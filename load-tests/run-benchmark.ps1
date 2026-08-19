# Orchestrates the full k6 load-test benchmark against the local docker
# compose stack: starts services, seeds the DB, then runs api-load.js once
# per concurrency level (10, 25, 50, 100, 250, 500 VUs), sampling container
# CPU/RAM and Postgres connection counts throughout each level.
#
# Usage:
#   .\run-benchmark.ps1
#   .\run-benchmark.ps1 -IncludePuppeteer
#   .\run-benchmark.ps1 -Levels 10,50 -StageDuration 1m
#
# Raw per-level results land in load-tests\results\ (gitignored). A running
# summary is appended to load-tests\results\summary.csv as each level
# completes. Any failure at a level is logged and stops the benchmark from
# advancing to higher levels -- results are never fabricated or extrapolated.

param(
    [int[]]$Levels = @(10, 25, 50, 100, 250, 500),
    [string]$StageDuration = "2m",
    [string]$WarmupDuration = "15s",
    [int]$CooldownSeconds = 25,
    [int]$SampleIntervalSeconds = 5,
    [switch]$IncludePuppeteer,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$LoadTestsDir = $PSScriptRoot
$ResultsDir = Join-Path $LoadTestsDir "results"
$SummaryCsv = Join-Path $ResultsDir "summary.csv"
$PreflightFile = Join-Path $ResultsDir "preflight.txt"

. (Join-Path $LoadTestsDir "sample-stats.ps1")

function Write-Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Write-Fail($msg) { Write-Host "FAIL: $msg" -ForegroundColor Red }
function Write-Ok($msg) { Write-Host "OK: $msg" -ForegroundColor Green }

function Assert-LastExitCode($what) {
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "$what (exit code $LASTEXITCODE)"
        throw "$what failed"
    }
}

function Get-DurationSeconds($d) {
    if ($d -match '^(\d+)h$') { return [int]$matches[1] * 3600 }
    if ($d -match '^(\d+)m$') { return [int]$matches[1] * 60 }
    if ($d -match '^(\d+)s$') { return [int]$matches[1] }
    return 120
}

New-Item -ItemType Directory -Force -Path $ResultsDir | Out-Null

# ---------------------------------------------------------------------------
# 1. Pre-flight checks
# ---------------------------------------------------------------------------
Write-Step "Pre-flight checks"

docker info *>$null
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Docker Desktop does not appear to be running. Start Docker Desktop and re-run this script."
    exit 1
}
Write-Ok "Docker is running"

if (-not (Get-Command k6 -ErrorAction SilentlyContinue)) {
    Write-Fail "k6 is not installed. Install it with: winget install k6 --source winget"
    exit 1
}
$k6Version = (k6 version)
Write-Ok "k6 found: $k6Version"

$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$mem = Get-CimInstance Win32_ComputerSystem
$totalRamGb = [math]::Round($mem.TotalPhysicalMemory / 1GB, 2)

$preflightInfo = @"
Benchmark run: $(Get-Date -Format o)
Host CPU: $($cpu.Name)
Cores / Logical processors: $($cpu.NumberOfCores) / $($cpu.NumberOfLogicalProcessors)
Total RAM: $totalRamGb GB
k6 version: $k6Version
Docker resource limits: none configured in docker-compose.yml (deploy.resources absent) -- containers may use full host CPU/RAM
Levels: $($Levels -join ', ')
Stage duration per level: $StageDuration
"@
$preflightInfo | Set-Content -Path $PreflightFile -Encoding utf8
Write-Host $preflightInfo
Write-Ok "Preflight info saved to $PreflightFile"

# ---------------------------------------------------------------------------
# 2. Benchmark-only rate limit override (process-scoped, not persisted)
# ---------------------------------------------------------------------------
Write-Step "Applying benchmark-only rate limit override (this process only)"
$env:RATE_LIMIT_MAX = "1000000"
$env:RATE_LIMIT_WINDOW_MS = "900000"
Write-Ok "RATE_LIMIT_MAX=$($env:RATE_LIMIT_MAX) for this run (default 200 is unaffected outside this script)"

# ---------------------------------------------------------------------------
# 3. Start the stack
# ---------------------------------------------------------------------------
Write-Step "Starting docker compose stack"
Push-Location $RepoRoot
try {
    if ($SkipBuild) {
        docker compose up -d
    } else {
        docker compose up -d --build
    }
    Assert-LastExitCode "docker compose up"

    Write-Host "Waiting for express health endpoint..."
    $healthy = $false
    for ($i = 0; $i -lt 60; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:5001/api/health" -UseBasicParsing -TimeoutSec 3
            if ($resp.StatusCode -eq 200) { $healthy = $true; break }
        } catch {}
        Start-Sleep -Seconds 3
    }
    if (-not $healthy) {
        Write-Fail "Express did not become healthy at http://localhost:5001/api/health within timeout"
        throw "express health check failed"
    }
    Write-Ok "Express is healthy"

    $fastapiHealthy = $false
    for ($i = 0; $i -lt 20; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -UseBasicParsing -TimeoutSec 3
            if ($resp.StatusCode -eq 200) { $fastapiHealthy = $true; break }
        } catch {}
        Start-Sleep -Seconds 3
    }
    if (-not $fastapiHealthy) {
        Write-Fail "FastAPI did not become healthy at http://localhost:8000/api/health within timeout"
        throw "fastapi health check failed"
    }
    Write-Ok "FastAPI is healthy"

    # -----------------------------------------------------------------------
    # 4. Seed the database
    # -----------------------------------------------------------------------
    Write-Step "Seeding database"
    docker compose exec -T express npx prisma db seed
    Assert-LastExitCode "prisma db seed"
    Write-Ok "Database seeded (proctor P000 / password123 + 2 students)"

    # -----------------------------------------------------------------------
    # 5. Smoke test target endpoint
    # -----------------------------------------------------------------------
    Write-Step "Smoke-testing GET /api/auth/profile"
    $loginBody = @{ proctorId = "P000"; password = "password123" } | ConvertTo-Json
    $loginResp = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/proctor-login" -Method Post -Body $loginBody -ContentType "application/json"
    if (-not $loginResp.data.sessionId) {
        Write-Fail "proctor-login did not return a sessionId"
        throw "smoke test failed: no sessionId"
    }
    $sessionId = $loginResp.data.sessionId
    $profileResp = Invoke-WebRequest -Uri "http://localhost:5001/api/auth/profile" -Headers @{ "x-session-id" = $sessionId } -UseBasicParsing
    if ($profileResp.StatusCode -ne 200) {
        Write-Fail "GET /api/auth/profile returned $($profileResp.StatusCode)"
        throw "smoke test failed: profile endpoint not healthy"
    }
    Write-Ok "Smoke test passed: proctor-login + GET /api/auth/profile both succeeded"

    # -----------------------------------------------------------------------
    # 6. Run each concurrency level
    # -----------------------------------------------------------------------
    # Always start a fresh summary.csv for this invocation -- appending to a
    # stale file from a previous (possibly aborted) run would mix results
    # from different code/config versions under the same level.
    "Level,RPS,p50_ms,p95_ms,p99_ms,ErrorRatePct,ExpressCPUAvg,ExpressMemAvg,FastAPICPUAvg,FastAPIMemAvg,PostgresCPUAvg,PostgresMemAvg,PGActiveConnAvg,PGTotalConnAvg,Status" |
        Set-Content -Path $SummaryCsv -Encoding utf8

    $containers = @("msr_insight_express", "msr_insight_fastapi", "msr_insight_postgres")
    $completedLevels = @()
    $crashDetected = $false

    foreach ($level in $Levels) {
        Write-Step "Level: $level concurrent users"

        Write-Host "Warm-up run (discarded)..."
        Push-Location $LoadTestsDir
        k6 run api-load.js -e STAGE_VUS=$level -e STAGE_DURATION=$WarmupDuration -e RAMP_DURATION=10s --quiet 2>$null | Out-Null
        Pop-Location

        $statsCsv = Join-Path $ResultsDir "docker-stats-${level}vus.csv"
        Start-StatSampling -Containers $containers -OutFile $statsCsv -IntervalSeconds $SampleIntervalSeconds | Out-Null

        Write-Host "Timed run: $level VUs for $StageDuration (plus 30s ramp)..."
        Push-Location $LoadTestsDir
        k6 run api-load.js -e STAGE_VUS=$level -e STAGE_DURATION=$StageDuration
        $k6ExitCode = $LASTEXITCODE
        Pop-Location

        Stop-StatSampling

        $summaryFile = Join-Path $ResultsDir "api-load-${level}vus.json"
        if (-not (Test-Path $summaryFile)) {
            Write-Fail "Level $level produced no summary file ($summaryFile). Stopping benchmark here."
            "$level,,,,,,,,,,,,,,FAILED_NO_SUMMARY" | Add-Content -Path $SummaryCsv -Encoding utf8
            break
        }

        $summary = Get-Content $summaryFile -Raw | ConvertFrom-Json
        $rps = [math]::Round($summary.metrics.http_reqs.values.rate, 2)
        $p50 = [math]::Round($summary.metrics.http_req_duration.values.med, 1)
        $p95 = [math]::Round($summary.metrics.http_req_duration.values.'p(95)', 1)
        $p99 = [math]::Round($summary.metrics.http_req_duration.values.'p(99)', 1)
        $errRate = [math]::Round($summary.metrics.http_req_failed.values.rate * 100, 3)

        # Trim the first ~30s (ramp window) of samples so container/DB stats
        # reflect steady-state at this concurrency level, not the ramp.
        $rampCutoff = (Get-Date).AddSeconds(-1 * (Get-DurationSeconds $StageDuration))
        $samples = @()
        if (Test-Path $statsCsv) {
            $samples = Import-Csv $statsCsv | Where-Object { [datetime]$_.Timestamp -gt $rampCutoff }
        }

        function Get-AvgCpuPct($rows, $name) {
            $vals = $rows | Where-Object { $_.Container -eq $name } | ForEach-Object { [double]($_.CPUPerc -replace '%','') }
            if ($vals.Count -eq 0) { return "" }
            return [math]::Round(($vals | Measure-Object -Average).Average, 2)
        }
        function Get-LastMem($rows, $name) {
            $vals = $rows | Where-Object { $_.Container -eq $name }
            if ($vals.Count -eq 0) { return "" }
            return ($vals[-1].MemUsage)
        }

        $expressCpu = Get-AvgCpuPct $samples "msr_insight_express"
        $expressMem = Get-LastMem $samples "msr_insight_express"
        $fastapiCpu = Get-AvgCpuPct $samples "msr_insight_fastapi"
        $fastapiMem = Get-LastMem $samples "msr_insight_fastapi"
        $pgCpu = Get-AvgCpuPct $samples "msr_insight_postgres"
        $pgMem = Get-LastMem $samples "msr_insight_postgres"

        $pgActiveVals = $samples | ForEach-Object { [double]$_.PGActiveConnections } | Where-Object { $_ -ne $null }
        $pgTotalVals = $samples | ForEach-Object { [double]$_.PGTotalConnections } | Where-Object { $_ -ne $null }
        $pgActiveAvg = if ($pgActiveVals.Count -gt 0) { [math]::Round(($pgActiveVals | Measure-Object -Average).Average, 1) } else { "" }
        $pgTotalAvg = if ($pgTotalVals.Count -gt 0) { [math]::Round(($pgTotalVals | Measure-Object -Average).Average, 1) } else { "" }

        $status = if ($k6ExitCode -eq 0) { "OK" } else { "THRESHOLD_OR_ERROR(exit=$k6ExitCode)" }

        "$level,$rps,$p50,$p95,$p99,$errRate,$expressCpu,$expressMem,$fastapiCpu,$fastapiMem,$pgCpu,$pgMem,$pgActiveAvg,$pgTotalAvg,$status" |
            Add-Content -Path $SummaryCsv -Encoding utf8

        Write-Host "Level $level -> RPS=$rps p50=${p50}ms p95=${p95}ms p99=${p99}ms err=${errRate}% expressCPU=${expressCpu}% pgConn(active/total)=$pgActiveAvg/$pgTotalAvg status=$status"

        # Check for a crashed/OOM'd container before continuing.
        $runningContainers = docker compose ps --status running --format "{{.Name}}"
        foreach ($c in $containers) {
            if ($runningContainers -notcontains $c) {
                Write-Fail "Container $c is not running after level $level (possible crash/OOM). Stopping benchmark here."
                $crashDetected = $true
                break
            }
        }

        $completedLevels += $level

        if ($crashDetected) { break }

        if ($level -ne $Levels[-1]) {
            Write-Host "Cooldown ${CooldownSeconds}s before next level..."
            Start-Sleep -Seconds $CooldownSeconds
        }
    }

    # -----------------------------------------------------------------------
    # 7. Optional Puppeteer/login scenario
    # -----------------------------------------------------------------------
    if ($IncludePuppeteer) {
        Write-Step "Optional: Puppeteer/login scenario (NOT comparable to API benchmark)"
        Push-Location $LoadTestsDir
        k6 run puppeteer-login.js
        Pop-Location
        Write-Ok "Puppeteer scenario complete. See results\puppeteer-login-summary.json"
    }

    # -----------------------------------------------------------------------
    # 8. Final report
    # -----------------------------------------------------------------------
    Write-Step "Benchmark complete"
    if (Test-Path $SummaryCsv) {
        Import-Csv $SummaryCsv | Format-Table -AutoSize
    }
    Write-Host "`nResults directory: $ResultsDir"
    Write-Host "Stack left running. Run 'docker compose down' from repo root to stop it."
}
finally {
    Pop-Location
}
