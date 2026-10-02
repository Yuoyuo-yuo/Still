@echo off
cd /d "%~dp0"
if exist "dist\win-unpacked\Still.exe" (
  start "" "%~dp0dist\win-unpacked\Still.exe"
  exit /b
)
if exist "dist\Still.exe" (
  start "" "%~dp0dist\Still.exe"
  exit /b
)
if exist "node_modules\electron\dist\electron.exe" (
  set ELECTRON_RUN_AS_NODE=
  start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."
  exit /b
)
echo Build the desktop application with npm install and npm run dist first.
pause
