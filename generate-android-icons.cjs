const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_ICON = path.join(__dirname, 'src', 'assets', 'logo.png');
const ANDROID_RES_DIR = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

// We want to generate the foreground icon (which should have a transparent background)
// The logo.png seems to be the one. Wait, let's just make it the main icon and foreground icon.
// Adaptive icons use foreground and background. The foreground is usually larger and padded so it fits inside the mask.
// A common approach is to just use a regular icon for both, or scale the foreground so it doesn't get cut off.
// Let's generate both ic_launcher.png (legacy round/square), ic_launcher_round.png, and ic_launcher_foreground.png.

const SIZES = {
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192
};

const FOREGROUND_SIZES = {
  'mdpi': 108,
  'hdpi': 162,
  'xhdpi': 216,
  'xxhdpi': 324,
  'xxxhdpi': 432
};

async function generateIcons() {
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error(`Source icon not found at ${SOURCE_ICON}`);
    process.exit(1);
  }

  try {
    for (const [density, size] of Object.entries(SIZES)) {
      const dir = path.join(ANDROID_RES_DIR, `mipmap-${density}`);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      // Generate legacy ic_launcher.png
      await sharp(SOURCE_ICON)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .toFile(path.join(dir, 'ic_launcher.png'));
        
      // Generate round ic_launcher_round.png (just the same since logo might be square, or we can round it)
      // For simplicity, we just copy the regular one, or round it if it has corners.
      // Let's just create a circular mask if we want it strictly round.
      const circleSvg = `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}"/></svg>`;
      await sharp(SOURCE_ICON)
        .resize(size, size, { fit: 'cover' })
        .composite([{ input: Buffer.from(circleSvg), blend: 'dest-in' }])
        .toFile(path.join(dir, 'ic_launcher_round.png'));

      console.log(`Generated standard icons for ${density}`);
    }

    // Generate adaptive foreground icons (padded to fit inside the adaptive mask)
    for (const [density, size] of Object.entries(FOREGROUND_SIZES)) {
      const dir = path.join(ANDROID_RES_DIR, `mipmap-${density}`);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      // Foreground icons need some padding so the logo doesn't get clipped by the adaptive mask.
      // 72% of the foreground size is the "safe zone".
      const paddedSize = Math.floor(size * 0.65); 
      
      const resizedLogo = await sharp(SOURCE_ICON)
        .resize(paddedSize, paddedSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .toBuffer();

      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 0 } // transparent background
        }
      })
      .composite([{ input: resizedLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));

      console.log(`Generated foreground icon for ${density}`);
    }

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
