/**
 * Vitamix Product Catalog Scraper
 *
 * Scrapes product information from vitamix.com/us/en_us/shop/blenders
 * Extracts: name, price, description, images, specs, features
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'https://www.vitamix.com';
const BLENDERS_URL = `${BASE_URL}/us/en_us/shop/blenders`;

const OUTPUT_DIR = path.join(process.cwd(), '../../content');

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(path.join(OUTPUT_DIR, 'images'), { recursive: true });
}

async function scrapeProductList(page) {
  console.log('Navigating to blenders catalog...');
  await page.goto(BLENDERS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait a bit for dynamic content
  await page.waitForTimeout(5000);

  // Take screenshot for debugging
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  console.log('Saved debug screenshot');

  // Log page HTML for debugging
  const html = await page.content();
  const fs = await import('fs/promises');
  await fs.writeFile('debug-page.html', html);
  console.log('Saved debug HTML');

  // Wait for product grid to load
  await page.waitForSelector('.product-tile, .product-card, [data-product-id], a[href*="/shop/"]', { timeout: 15000 }).catch(() => {
    console.log('No standard product selectors found, trying alternatives...');
  });

  // Extract product links and basic info from catalog page
  const products = await page.evaluate(() => {
    const items = [];
    const seen = new Set();

    // Method 1: Try to find JSON-LD structured data
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    jsonLdScripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        if (data['@type'] === 'Product' || data.itemListElement) {
          // Handle ItemList
          if (data.itemListElement) {
            data.itemListElement.forEach(item => {
              if (item.url && !seen.has(item.url)) {
                seen.add(item.url);
                items.push({
                  url: item.url,
                  name: item.name || '',
                  source: 'json-ld'
                });
              }
            });
          }
        }
      } catch (e) {}
    });

    // Method 2: Find product-item-link elements (Magento pattern)
    document.querySelectorAll('.product-item-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && !seen.has(href)) {
        seen.add(href);
        items.push({
          url: href.startsWith('http') ? href : `https://www.vitamix.com${href}`,
          name: link.textContent?.trim() || '',
          source: 'product-item-link'
        });
      }
    });

    // Method 3: Find hidden JSON-LD data spans
    document.querySelectorAll('.json_ld_data').forEach(container => {
      const urlEl = container.querySelector('.product_url_json_ld');
      const nameEl = container.querySelector('.product_name_json_ld');
      const priceEl = container.querySelector('.product_price_json_ld');
      const skuEl = container.querySelector('.product_sku_json_ld');
      const imgEl = container.querySelector('.product_image_json_ld');

      const url = urlEl?.textContent?.trim();
      if (url && !seen.has(url)) {
        seen.add(url);
        items.push({
          url,
          name: nameEl?.textContent?.trim() || '',
          price: priceEl?.textContent?.trim() || '',
          sku: skuEl?.textContent?.trim() || '',
          image: imgEl?.textContent?.trim() || '',
          source: 'json_ld_data'
        });
      }
    });

    return items;
  });

  console.log(`Found ${products.length} products in catalog`);
  return products;
}

async function scrapeProductDetails(page, product) {
  console.log(`Scraping details for: ${product.name || product.url}`);

  try {
    await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for page content to load
    await page.waitForTimeout(3000);

    const details = await page.evaluate(() => {
      // Product name
      const name = document.querySelector('h1, .product-name, .pdp-product-name')?.textContent?.trim() || '';

      // Price
      const priceEl = document.querySelector('.price, .product-price, [data-price], .pdp-price');
      const price = priceEl?.textContent?.trim() || '';
      const priceNum = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;

      // Description
      const descEl = document.querySelector('.product-description, .pdp-description, [data-description], .description');
      const description = descEl?.textContent?.trim() || '';

      // Tagline/subtitle
      const taglineEl = document.querySelector('.product-tagline, .pdp-tagline, .subtitle');
      const tagline = taglineEl?.textContent?.trim() || '';

      // Images
      const images = [];
      document.querySelectorAll('.product-image img, .pdp-image img, .gallery img, picture img').forEach(img => {
        const src = img.src || img.getAttribute('data-src');
        if (src && !images.includes(src)) {
          images.push(src);
        }
      });

      // Features/highlights
      const features = [];
      document.querySelectorAll('.feature, .product-feature, .highlight, li[class*="feature"]').forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length < 200) {
          features.push(text);
        }
      });

      // Specs
      const specs = {};
      document.querySelectorAll('.spec-row, .specification, tr[class*="spec"], .specs-table tr').forEach(row => {
        const label = row.querySelector('th, .spec-label, td:first-child')?.textContent?.trim();
        const value = row.querySelector('td:last-child, .spec-value')?.textContent?.trim();
        if (label && value) {
          specs[label] = value;
        }
      });

      // SKU/Model
      const skuEl = document.querySelector('[data-sku], .sku, .product-sku, .model-number');
      const sku = skuEl?.textContent?.trim() || skuEl?.getAttribute('data-sku') || '';

      // Series detection
      let series = 'unknown';
      const pageText = document.body.textContent?.toLowerCase() || '';
      if (pageText.includes('ascent x') || name.toLowerCase().includes('ascent x')) {
        series = 'ascent-x';
      } else if (pageText.includes('ascent') || name.toLowerCase().includes('ascent')) {
        series = 'ascent';
      } else if (pageText.includes('5200') || name.toLowerCase().includes('5200')) {
        series = '5200';
      } else if (pageText.includes('explorian') || name.toLowerCase().includes('explorian')) {
        series = 'explorian';
      } else if (pageText.includes('propel') || name.toLowerCase().includes('propel')) {
        series = 'propel';
      } else if (pageText.includes('immersion') || name.toLowerCase().includes('immersion')) {
        series = 'immersion';
      }

      return {
        name,
        price,
        priceNum,
        description,
        tagline,
        images,
        features,
        specs,
        sku,
        series,
      };
    });

    return {
      ...product,
      ...details,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error scraping ${product.url}:`, error.message);
    return {
      ...product,
      error: error.message,
      scrapedAt: new Date().toISOString(),
    };
  }
}

async function main() {
  console.log('Starting Vitamix product scraper...\n');

  await ensureOutputDir();

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  try {
    // First, get list of all products
    const productList = await scrapeProductList(page);

    // Save raw product list
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'products-raw.json'),
      JSON.stringify(productList, null, 2)
    );
    console.log(`\nSaved raw product list to products-raw.json`);

    // Scrape details for each product
    const products = [];
    for (const product of productList) {
      const details = await scrapeProductDetails(page, product);
      products.push(details);

      // Small delay between requests
      await page.waitForTimeout(1000);
    }

    // Save full product data
    const output = {
      scrapedAt: new Date().toISOString(),
      source: BLENDERS_URL,
      count: products.length,
      products,
    };

    await fs.writeFile(
      path.join(OUTPUT_DIR, 'products.json'),
      JSON.stringify(output, null, 2)
    );

    console.log(`\nSaved ${products.length} products to products.json`);

  } catch (error) {
    console.error('Scraping failed:', error);
  } finally {
    await browser.close();
  }
}

main();
