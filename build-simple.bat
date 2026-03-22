@echo off
echo Nabster Study Buddy - Windows Build Script
echo ========================================
echo.

REM Check if Node.js is available
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo Cleaning temporary files...
REM Clean only essential directories
if exist dist (
    echo Removing dist folder...
    rd /s /q dist
)
if exist dist_electron (
    echo Removing dist_electron folder...
    rd /s /q dist_electron
)

REM Clean npm cache to free up space
echo Cleaning npm cache...
call npm cache clean --force >nul 2>&1

echo.
echo Installing dependencies (this may take a few minutes)...
call npm install --production --no-audit --no-fund
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    echo Trying with legacy peer deps...
    call npm install --legacy-peer-deps --no-audit --no-fund
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Building frontend application...
call npx vite build --config vite.config.windows.js
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)

echo.
echo Building Electron application for Windows...
call npx electron-builder --win --x64 --publish=never
if %errorlevel% neq 0 (
    echo ERROR: Electron build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build completed successfully!
echo.
echo Your executable should be in: dist_electron\win-unpacked\
echo Installer should be in: dist_electron\
echo.
echo Look for files with .exe extension
echo ========================================
echo.
pause