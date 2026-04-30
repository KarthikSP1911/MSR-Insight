@echo off
REM ===========================================================
REM  Launch Chrome with Chrome DevTools Protocol (CDP) enabled
REM  Required for Session-Piggyback Scraping research module
REM ===========================================================

set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
set DEBUG_PORT=9222
set PROFILE_DIR="%~dp0\.chrome-debug-profile"

echo [MSR-Insight] Launching Chrome with CDP on port %DEBUG_PORT%...
echo [MSR-Insight] Profile directory: %PROFILE_DIR%
echo.

start "" %CHROME_PATH% --remote-debugging-port=%DEBUG_PORT% --user-data-dir=%PROFILE_DIR%

echo [MSR-Insight] Chrome launched. Navigate to parents.msrit.edu and log in.
echo [MSR-Insight] The piggyback extension will auto-detect your session.
echo.
echo [MSR-Insight] Verify CDP is active: http://127.0.0.1:%DEBUG_PORT%/json/version
pause
