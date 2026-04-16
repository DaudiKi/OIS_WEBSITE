import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const directories = [
  'public/assets/images',
  'public/assets/gallery',
  'public/assets/icons'
];

const MAX_WIDTH = 1920;

async function optimizeImages() {
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.warn(`Directory ${dir} does not exist. Skipping.`);
      continue;
    }

    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        const filePath = path.join(dir, file);
        const outputFileName = `${path.parse(file).name}.webp`;
        const outputPath = path.join(dir, outputFileName);

        try {
          // Skip if WebP already exists and is newer than the source
          if (fs.existsSync(outputPath)) {
            const sourceStat = fs.statSync(filePath);
            const outputStat = fs.statSync(outputPath);
            if (outputStat.mtime > sourceStat.mtime) {
              console.log(`Skipping ${file} - already optimized.`);
              continue;
            }
          }

          console.log(`Optimizing ${file}...`);
          const image = sharp(filePath);
          const metadata = await image.metadata();

          let pipeline = image;
          if (metadata.width > MAX_WIDTH) {
            pipeline = pipeline.resize(MAX_WIDTH);
          }

          await pipeline
            .webp({ quality: 80 })
            .toFile(outputPath);
            
          const oldSize = fs.statSync(filePath).size;
          const newSize = fs.statSync(outputPath).size;
          console.log(`Done! ${Math.round(oldSize / 1024)}KB -> ${Math.round(newSize / 1024)}KB`);
        } catch (err) {
          console.error(`Error optimizing ${file}:`, err);
        }
      }
    }
  }
}

optimizeImages();
