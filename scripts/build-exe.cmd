@echo off
setlocal

cd /d "%~dp0\.."

echo Checking for running StepMark process...
tasklist /FI "IMAGENAME eq stepmark.exe" 2>NUL | find /I "stepmark.exe" >NUL
if not errorlevel 1 (
  echo Closing running stepmark.exe before build...
  taskkill /IM stepmark.exe /T /F
  if errorlevel 1 exit /b %errorlevel%
) else (
  echo No running stepmark.exe found.
)

echo Building StepMark release exe and installers...
call npm.cmd run tauri build
if errorlevel 1 exit /b %errorlevel%

echo Built: %CD%\src-tauri\target\release\stepmark.exe
for %%F in ("src-tauri\target\release\stepmark.exe") do echo Size: %%~zF bytes

echo Bundles:
for %%F in ("src-tauri\target\release\bundle\msi\*.msi" "src-tauri\target\release\bundle\nsis\*.exe") do (
  if exist "%%~fF" echo %%~fF
)
