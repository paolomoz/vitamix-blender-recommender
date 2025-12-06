/**
 * Download Product Images
 *
 * Downloads product images from Vitamix CDN and saves locally
 */

import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import http from 'http';

const CONTENT_DIR = path.join(process.cwd(), '../../content');
const IMAGES_DIR = path.join(CONTENT_DIR, 'images');

/**
 * Download a single image
 */
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', async () => {
        const buffer = Buffer.concat(chunks);
        await fs.writeFile(filepath, buffer);
        resolve(filepath);
      });
      response.on('error', reject);
    });

    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error(`Timeout downloading ${url}`));
    });
  });
}

/**
 * Generate a clean filename from URL
 */
function getFilename(url, productId, index) {
  // Extract extension from URL
  let ext = 'jpg';
  if (url.includes('format=png') || url.includes('.png')) ext = 'png';
  if (url.includes('format=avif') || url.includes('.avif')) ext = 'avif';
  if (url.includes('format=webp') || url.includes('.webp')) ext = 'webp';

  return `${productId}-${index}.${ext}`;
}

async function main() {
  console.log('Downloading product images...\n');

  // Ensure images directory exists
  await fs.mkdir(IMAGES_DIR, { recursive: true });

  // Read products
  const productsData = JSON.parse(
    await fs.readFile(path.join(CONTENT_DIR, 'products-clean.json'), 'utf-8')
  );

  const imageManifest = {};
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const product of productsData.products) {
    console.log(`Processing: ${product.name}`);
    imageManifest[product.id] = { primary: null, gallery: [] };

    // Download primary image
    if (product.images.primary) {
      const filename = getFilename(product.images.primary, product.id, 'primary');
      const filepath = path.join(IMAGES_DIR, filename);

      try {
        // Check if already exists
        try {
          await fs.access(filepath);
          console.log(`  ⏭️  ${filename} (exists)`);
          skipped++;
        } catch {
          await downloadImage(product.images.primary, filepath);
          console.log(`  ✓ ${filename}`);
          downloaded++;
        }
        imageManifest[product.id].primary = `/content/images/${filename}`;
      } catch (error) {
        console.log(`  ✗ ${filename} - ${error.message}`);
        failed++;
      }
    }

    // Download gallery images (limit to 3)
    const galleryImages = product.images.gallery?.slice(0, 3) || [];
    for (let i = 0; i < galleryImages.length; i++) {
      const url = galleryImages[i];
      const filename = getFilename(url, product.id, i);
      const filepath = path.join(IMAGES_DIR, filename);

      try {
        try {
          await fs.access(filepath);
          console.log(`  ⏭️  ${filename} (exists)`);
          skipped++;
        } catch {
          await downloadImage(url, filepath);
          console.log(`  ✓ ${filename}`);
          downloaded++;
        }
        imageManifest[product.id].gallery.push(`/content/images/${filename}`);
      } catch (error) {
        console.log(`  ✗ ${filename} - ${error.message}`);
        failed++;
      }

      // Small delay between downloads
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Save image manifest
  await fs.writeFile(
    path.join(CONTENT_DIR, 'images-manifest.json'),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      images: imageManifest
    }, null, 2)
  );

  console.log(`\nDownload complete!`);
  console.log(`  Downloaded: ${downloaded}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log(`\nManifest saved to: images-manifest.json`);
}

main();
