import sharp from 'sharp';

// Generate favicon from the school logo
async function generateFavicon() {
  const logoPath = 'public/assets/icons/oisLogo.png';

  // Generate favicon.ico (32x32 PNG used as favicon)
  await sharp(logoPath)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile('public/favicon.png');

  // Generate Apple Touch Icon (180x180)
  await sharp(logoPath)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile('public/apple-touch-icon.png');

  // Generate 192x192 for Android/PWA
  await sharp(logoPath)
    .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile('public/icon-192.png');

  console.log('Favicons generated successfully!');
}

generateFavicon();
