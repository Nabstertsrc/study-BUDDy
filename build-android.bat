@echo off
echo [1/3] Building Web Production Assets...
npx vite build

echo [2/3] Syncing with Android Project...
npx cap sync android

echo [3/3] Build Complete!
echo.
echo Your Android project is updated. 
echo To generate the APK:
echo 1. Open 'android' folder in Android Studio.
echo 2. Wait for Gradle sync to finish.
echo 3. Go to Build > Build Bundle(s) / APK(s) > Build APK(s).
echo.
echo Opening Android Studio...
npx cap open android
pause
