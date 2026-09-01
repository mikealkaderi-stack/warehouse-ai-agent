@echo off
setlocal
title SRT Driver Control - Project Backup

where tar.exe >nul 2>&1
if errorlevel 1 (
  echo.
  echo Windows could not find the ZIP tool.
  echo No backup was created.
  echo.
  pause
  exit /b 1
)

for /f %%I in ('powershell.exe -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set "BACKUP_STAMP=%%I"
for %%I in ("%~dp0..") do set "BACKUP_PARENT=%%~fI"
set "BACKUP_FOLDER=%BACKUP_PARENT%\SRT Project Backups"
set "BACKUP_FILE=%BACKUP_FOLDER%\srt-driver-control-project-%BACKUP_STAMP%.zip"

if not exist "%BACKUP_FOLDER%" mkdir "%BACKUP_FOLDER%"
if errorlevel 1 (
  echo.
  echo The backup folder could not be created.
  echo No backup was created.
  echo.
  pause
  exit /b 1
)

echo.
echo Creating a safe application backup...
echo Private keys and temporary files will not be included.
echo.

tar.exe -a -c -f "%BACKUP_FILE%" ^
  --exclude="srt-driver-control/node_modules" ^
  --exclude="srt-driver-control/.next" ^
  --exclude="srt-driver-control/.env.local" ^
  -C "%BACKUP_PARENT%" "srt-driver-control"

if errorlevel 1 (
  if exist "%BACKUP_FILE%" del /q "%BACKUP_FILE%"
  echo.
  echo The project backup failed. No incomplete ZIP was kept.
  echo.
  pause
  exit /b 1
)

echo.
echo PROJECT BACKUP CREATED SUCCESSFULLY
echo.
echo Saved as:
echo %BACKUP_FILE%
echo.

if /I "%~1"=="--quiet" exit /b 0
start "" explorer.exe /select,"%BACKUP_FILE%"
pause
exit /b 0
