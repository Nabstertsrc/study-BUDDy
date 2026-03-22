@echo off
echo Building Nabster Study Buddy for Windows...
echo.

REM Clean previous builds
echo Cleaning previous builds...
if exist dist rd /s /q dist
if exist dist_electron rd /s /q dist_electron
if exist node_modules\.cache rd /s /q node_modules\.cache

REM Install dependencies if needed
echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

REM Build the frontend
echo Building frontend with Windows optimization...
call npm run build:windows
if errorlevel 1 (
    echo Frontend build failed
    pause
    exit /b 1
)

REM Build the Electron app
echo Building Electron application...
call electron-builder --win --x64 --ia32 --publish=never
if errorlevel 1 (
    echo Electron build failed
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo Check the dist_electron folder for the executable.
echo.
pause