@echo off
set "ROOT=%~dp0"

echo Installing FastAPI Backend dependencies...
cd /d "%ROOT%backend\fastapi"
call uv sync
if errorlevel 1 goto :error

echo Installing Express Backend dependencies...
cd /d "%ROOT%backend\express"
call npm install
if errorlevel 1 goto :error
call npx prisma generate
if errorlevel 1 goto :error

echo Installing Frontend dependencies...
cd /d "%ROOT%frontend"
call npm install
if errorlevel 1 goto :error

cd /d "%ROOT%"
echo.
echo Setup complete!
echo NOTE: frontend\.env does not exist yet. Create it with:
echo   NEXT_PUBLIC_API_URL=...
echo   NEXT_PUBLIC_FASTAPI_URL=...
pause
goto :eof

:error
echo.
echo Setup failed. See error above.
cd /d "%ROOT%"
pause
exit /b 1
