// Resize an image to a small icon using sharp (or canvas)
// Usage: node scripts/resize-icon.mjs <input> <output> <size>

import { createCanvas, loadImage } from 'canvas';
import { readFileSync, writeFileSync } from 'fs';

// Fallback: use sharp if available, otherwise try canvas
async function resizeWithSharp(input, output, size) {
  const sharp = (await import('sharp')).default;
  await sharp(input)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 80, compressionLevel: 9 })
    .toFile(output);
  console.log(`Resized ${input} -> ${output} (${size}x${size})`);
}

async function main() {
  const input = process.argv[2] || 'public/images/map/outpost.png';
  const output = process.argv[3] || 'public/images/map/outpost_48.png';
  const size = parseInt(process.argv[4] || '48');

  try {
    await resizeWithSharp(input, output, size);
  } catch (e) {
    console.log('sharp not available, trying alternative...');
    console.error(e.message);
  }
}

main();
