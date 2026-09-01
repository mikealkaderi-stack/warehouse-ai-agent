@echo off
setlocal
title SRT Driver Control - Final Check
cd /d "%~dp0"

where node.exe >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js was not found. Restart Windows, then try again.
  echo.
  pause
  exit /b 1
)

where pnpm.cmd >nul 2>nul
if errorlevel 1 (
  echo.
  echo pnpm was not found. Run: npm.cmd install --global pnpm
  echo.
  pause
  exit /b 1
)

powershell.exe -NoProfile -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2; if ($response.StatusCode -eq 200) { exit 0 } } catch {}; exit 1"
if not errorlevel 1 (
  echo.
  echo The application is currently running.
  echo Close the SRT launcher window first, then run this check again.
  echo No data has been changed.
  echo.
  pause
  exit /b 1
)

echo.
echo SRT DRIVER CONTROL - FINAL APPLICATION CHECK
echo This check does not change Supabase data.
echo.
echo [1 of 2] Checking code quality...
call pnpm.cmd lint
if errorlevel 1 goto :failed

echo.
echo [2 of 2] Creating the production version...
call pnpm.cmd build
if errorlevel 1 goto :failed

echo.
echo ========================================================
echo APPLICATION CHECK COMPLETED SUCCESSFULLY
echo The application is ready for normal local use.
echo ========================================================
echo.
pause
exit /b 0

:failed
echo.
echo ========================================================
echo THE CHECK FOUND A PROBLEM
echo Take a photo or copy the error shown above so it can be fixed.
echo Your Supabase data was not changed.
echo ========================================================
echo.
pause
exit /b 1
