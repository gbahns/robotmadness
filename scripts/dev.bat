@echo off
REM Kill any existing Node process on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing existing process %%a on port 3000
    powershell -Command "Stop-Process -Id %%a -Force -ErrorAction SilentlyContinue" 2>nul
)

REM Small delay to ensure port is freed
timeout /t 1 /nobreak >nul

REM Start the dev server
echo Starting dev server on port 3000
npm run dev