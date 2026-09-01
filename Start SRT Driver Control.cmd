@echo off
setlocal
title SRT Driver Control
cd /d "%~dp0"

where node.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found.
  echo Install Node.js, then restart Windows and try again.
  pause
  exit /b 1
)

where pnpm.cmd >nul 2>nul
if errorlevel 1 (
  echo pnpm was not found.
  echo Run: npm.cmd install --global pnpm
  pause
  exit /b 1
)

rem If the application is already running, open it without starting a second server.
powershell.exe -NoProfile -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2; if ($response.StatusCode -eq 200) { Start-Process 'http://localhost:3000'; exit 0 } } catch {}; exit 1"
if not errorlevel 1 exit /b 0

echo Starting SRT Driver Control...
echo Keep this window open while using the application.
echo Press Ctrl+C to stop the application.
echo.

rem Wait in the background until Next.js is ready, then open the default browser.
start "" /b powershell.exe -NoProfile -Command "$deadline = (Get-Date).AddSeconds(90); while ((Get-Date) -lt $deadline) { try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2; if ($response.StatusCode -eq 200) { Start-Process 'http://localhost:3000'; exit 0 } } catch {}; Start-Sleep -Seconds 1 }; exit 1"

call pnpm.cmd dev

echo.
echo SRT Driver Control has stopped.
pause
