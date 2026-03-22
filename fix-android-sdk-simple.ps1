# Android SDK Auto-Fix Script
$ErrorActionPreference = "Stop"

Write-Host "Android SDK Auto-Configuration" -ForegroundColor Cyan
Write-Host "Searching for Android SDK..." -ForegroundColor Yellow

# Common SDK locations
$sdkLocations = @(
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "$env:LOCALAPPDATA\Android\Sdk",
    "C:\Android\Sdk",
    "$env:USERPROFILE\Android\Sdk"
)

$sdkPath = $null
foreach ($location in $sdkLocations) {
    if (Test-Path $location) {
        if (Test-Path "$location\platform-tools") {
            $sdkPath = $location
            Write-Host "Found Android SDK: $sdkPath" -ForegroundColor Green
            break
        }
    }
}

if ($null -eq $sdkPath) {
    Write-Host "Android SDK not found" -ForegroundColor Red
    Write-Host "Install Android Studio: https://developer.android.com/studio" -ForegroundColor Yellow
    exit 1
}

# Create local.properties
$androidDir = "mobile-app\android"
if (-not (Test-Path $androidDir)) {
    Write-Host "Creating android directory..." -ForegroundColor Yellow
    New-Item -Path $androidDir -ItemType Directory -Force | Out-Null
}

$localPropsPath = "$androidDir\local.properties"
$sdkPathFormatted = $sdkPath -replace '\\', '\\\\'

$content = "sdk.dir=$sdkPathFormatted"

Set-Content -Path $localPropsPath -Value $content -Encoding UTF8

Write-Host "Created: $localPropsPath" -ForegroundColor Green
Write-Host "Setting ANDROID_HOME..." -ForegroundColor Yellow

[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdkPath, 'User')
$env:ANDROID_HOME = $sdkPath

Write-Host "Done! Restart your terminal." -ForegroundColor Green
