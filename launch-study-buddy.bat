@echo off
echo Nabster Study Buddy Launcher
echo ============================
echo.

REM Set Windows compatibility mode
echo Setting Windows compatibility settings...
set ELECTRON_DISABLE_GPU=1
set ELECTRON_DISABLE_SANDBOX=1
set NODE_OPTIONS=--max-old-space-size=4096

REM Check for the best available executable
set "EXECUTABLE="

if exist "Nabster_Study_Buddy_Portable\Nabster Tsr Study Buddy.exe" (
    set "EXECUTABLE=Nabster_Study_Buddy_Portable\Nabster Tsr Study Buddy.exe"
    echo Found: Portable version
)

if exist "StudyBuddy_EXE_Release\Nabster Tsr Study Buddy.exe" (
    if "%EXECUTABLE%"=="" (
        set "EXECUTABLE=StudyBuddy_EXE_Release\Nabster Tsr Study Buddy.exe"
        echo Found: EXE Release version
    )
)

if exist "StudyBuddy_URL_Method_Release\Nabster Tsr Study Buddy.exe" (
    if "%EXECUTABLE%"=="" (
        set "EXECUTABLE=StudyBuddy_URL_Method_Release\Nabster Tsr Study Buddy.exe"
        echo Found: URL Method version
    )
)

if "%EXECUTABLE%"=="" (
    echo ERROR: No executable found!
    echo.
    echo Please run create-portable.bat first or ensure you have a built version.
    pause
    exit /b 1
)

echo.
echo Starting: %EXECUTABLE%
echo.
echo If the application doesn't start properly, try:
echo 1. Run as Administrator
echo 2. Check Windows Defender exclusions
echo 3. Ensure all files are in the correct location
echo.

REM Launch the application
start "" "%EXECUTABLE%"

REM Exit the launcher
exit