@echo off
echo Nabster Study Buddy - Windows Portable Builder
echo ===========================================
echo.

REM Check for existing builds
echo Checking for existing builds...

if exist "Nabster_Study_Buddy_Portable\Nabster Tsr Study Buddy.exe" (
    echo Found existing portable build!
    echo Location: Nabster_Study_Buddy_Portable\
    goto :create_zip
)

if exist "StudyBuddy_EXE_Release\Nabster Tsr Study Buddy.exe" (
    echo Found existing EXE release build!
    echo Location: StudyBuddy_EXE_Release\
    goto :create_zip
)

if exist "StudyBuddy_URL_Method_Release\Nabster Tsr Study Buddy.exe" (
    echo Found existing URL method release build!
    echo Location: StudyBuddy_URL_Method_Release\
    goto :create_zip
)

echo No existing builds found. Let's create a new portable version.
echo.

REM Create new portable build
echo Creating portable build from source...

REM Use the existing dist folder if it exists
if exist "dist" (
    echo Found dist folder, creating portable package...
    
    REM Create portable structure
    if not exist "portable_build" mkdir portable_build
    if not exist "portable_build\dist" mkdir portable_build\dist
    if not exist "portable_build\electron" mkdir portable_build\electron
    
    REM Copy essential files
    echo Copying frontend files...
    xcopy /s /y dist\* portable_build\dist\
    
    echo Copying Electron files...
    xcopy /s /y electron\* portable_build\electron\
    
    echo Copying public assets...
    if exist "public" xcopy /s /y public\* portable_build\dist\
    
    echo Creating package.json for portable...
    echo { > portable_build\package.json
    echo   "name": "nabster-study-buddy-portable", >> portable_build\package.json
    echo   "version": "1.0.0", >> portable_build\package.json
    echo   "main": "electron/main-windows.cjs" >> portable_build\package.json
    echo } >> portable_build\package.json
    
    echo Portable build created in portable_build\
    goto :create_zip
)

echo No dist folder found. Please run 'npm run build' first or use existing builds.
pause
exit /b 1

:create_zip
echo.
echo Build ready! Here are your options:
echo.
echo 1. Nabster_Study_Buddy_Portable\Nabster Tsr Study Buddy.exe (Recommended)
echo 2. StudyBuddy_EXE_Release\Nabster Tsr Study Buddy.exe
echo 3. StudyBuddy_URL_Method_Release\Nabster Tsr Study Buddy.exe
echo.
echo All builds are ready to use!
echo Simply run the .exe file to start the application.
echo.
pause