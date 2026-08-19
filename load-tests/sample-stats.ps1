# Helper functions for sampling Docker container CPU/RAM and Postgres
# connection counts during a load-test run. Dot-source this file to use the
# functions standalone, or let run-benchmark.ps1 invoke them.
#
#   . .\sample-stats.ps1
#   Start-StatSampling -Containers @('msr_insight_express','msr_insight_fastapi','msr_insight_postgres') -OutFile results\stats-50vus.csv -IntervalSeconds 5
#   ... do work ...
#   Stop-StatSampling

function Get-PgConnectionCount {
    param(
        [string]$PostgresUser = $(if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }),
        [string]$PostgresDb = $(if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "msr_insight" })
    )

    $total = (docker compose exec -T postgres psql -U $PostgresUser -d $PostgresDb -t -c "SELECT count(*) FROM pg_stat_activity;" 2>$null).Trim()
    $active = (docker compose exec -T postgres psql -U $PostgresUser -d $PostgresDb -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>$null).Trim()

    [PSCustomObject]@{
        TotalConnections  = $total
        ActiveConnections = $active
    }
}

function Get-ContainerStatsSnapshot {
    param([string[]]$Containers)

    $raw = docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}}" @Containers 2>$null
    $rows = @()
    foreach ($line in $raw) {
        $parts = $line -split ","
        if ($parts.Count -ge 3) {
            $rows += [PSCustomObject]@{
                Name = $parts[0]
                CPUPerc = $parts[1]
                MemUsage = ($parts[2..($parts.Count - 1)] -join ",")
            }
        }
    }
    return $rows
}

$script:StatSamplingJob = $null

function Start-StatSampling {
    param(
        [Parameter(Mandatory = $true)][string[]]$Containers,
        [Parameter(Mandatory = $true)][string]$OutFile,
        [int]$IntervalSeconds = 5
    )

    "Timestamp,Container,CPUPerc,MemUsage,PGTotalConnections,PGActiveConnections" | Set-Content -Path $OutFile -Encoding utf8

    $script:StatSamplingJob = Start-Job -ScriptBlock {
        param($Containers, $OutFile, $IntervalSeconds, $ScriptRoot)

        # docker compose exec needs to run from the repo root (where
        # docker-compose.yml lives), which is the parent of load-tests/.
        Set-Location (Split-Path -Parent $ScriptRoot)

        . (Join-Path $ScriptRoot "sample-stats.ps1")

        while ($true) {
            $timestamp = (Get-Date).ToString("o")
            $pg = Get-PgConnectionCount
            $snapshot = Get-ContainerStatsSnapshot -Containers $Containers

            foreach ($c in $snapshot) {
                "$timestamp,$($c.Name),$($c.CPUPerc),$($c.MemUsage),$($pg.TotalConnections),$($pg.ActiveConnections)" |
                    Add-Content -Path $OutFile -Encoding utf8
            }

            Start-Sleep -Seconds $IntervalSeconds
        }
    } -ArgumentList $Containers, $OutFile, $IntervalSeconds, $PSScriptRoot

    return $script:StatSamplingJob
}

function Stop-StatSampling {
    if ($script:StatSamplingJob) {
        Stop-Job -Job $script:StatSamplingJob -ErrorAction SilentlyContinue | Out-Null
        Remove-Job -Job $script:StatSamplingJob -Force -ErrorAction SilentlyContinue | Out-Null
        $script:StatSamplingJob = $null
    }
}
