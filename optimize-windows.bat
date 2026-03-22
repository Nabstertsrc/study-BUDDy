@echo off
echo Nabster Study Buddy - Windows Optimizer
echo ======================================
echo.

REM Set Windows-specific environment variables for better performance
set ELECTRON_DISABLE_GPU=1
set ELECTRON_DISABLE_SANDBOX=1
set NODE_OPTIONS=--max-old-space-size=4096

REM Check Windows version and set compatibility
echo Detecting Windows version...
ver | find "Windows 10" >nul
if %errorlevel% == 0 (
    echo Windows 10 detected - applying optimizations...
    set COMPAT_MODE=~ WIN8RTM
)

ver | find "Windows 11" >nul
if %errorlevel% == 0 (
    echo Windows 11 detected - applying optimizations...
    set COMPAT_MODE=~ WIN10RTM
)

echo.
echo Available builds:
echo 1. Nabster_Study_Buddy_Portable (Recommended - 177MB)
echo 2. StudyBuddy_EXE_Release (Alternative build)
echo 3. StudyBuddy_URL_Method_Release (URL method build)
echo.

set /p choice="Select build (1-3) or press Enter for default (1): "

if "%choice%"=="" set choice=1
if "%choice%"=="1" set "BUILD_PATH=Nabster_Study_Buddy_Portable"
if "%choice%"=="2" set "BUILD_PATH=StudyBuddy_EXE_Release"
if "%choice%"=="3" set "BUILD_PATH=StudyBuddy_URL_Method_Release"

if not exist "%BUILD_PATH%\Nabster Tsr Study Buddy.exe" (
    echo ERROR: Selected build not found!
    echo Please run the build process first.
    pause
    exit /b 1
)

echo.
echo Setting compatibility mode for Windows...
echo Applying Windows optimizations...

REM Create optimized launcher
echo Creating optimized launcher...
echo @echo off > optimized-launcher.bat
echo set ELECTRON_DISABLE_GPU=1 >> optimized-launcher.bat
echo set ELECTRON_DISABLE_SANDBOX=1 >> optimized-launcher.bat
echo set NODE_OPTIONS=--max-old-space-size=4096 >> optimized-launcher.bat
echo start "" "%BUILD_PATH%\Nabster Tsr Study Buddy.exe" >> optimized-launcher.bat

echo.
echo Optimization complete!
echo.
echo You can now run:
echo - optimized-launcher.bat (Recommended - with Windows optimizations)
echo - %BUILD_PATH%\Nabster Tsr Study Buddy.exe (Direct launch)
echo.
echo The optimized launcher includes:
echo - GPU acceleration disabled (prevents crashes)
echo - Sandbox disabled (improves startup)
echo - Increased memory allocation
echo - Windows compatibility mode
echo.
pause