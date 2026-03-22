@echo off
echo [1/3] Starting WordPress Production Build...
npx vite build --config vite.config.wordpress.js

echo [2/3] Preparing WordPress Package Structure...
if not exist "wordpress-package\plugins\study-buddy-core\assets" mkdir "wordpress-package\plugins\study-buddy-core\assets"

echo [3/3] Build Complete! 
echo.
echo WordPress Package ready at: c:\Users\Administrator\Music\Win Apps\Study buddy\wordpress-package
echo In your WordPress: 
echo 1. Zip and install the 'study-buddy-core' plugin.
echo 2. Zip and install the 'study-buddy-pro' theme.
echo 3. Create a new Page and add common the shortcode: [study_buddy_app]
echo 4. Set the Page Template to 'Study Buddy Pro' and set as Front Page.
pause
