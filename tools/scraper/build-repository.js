/**
 * Build Content Repository
 *
 * Processes raw scraped data into clean, structured JSON files
 * for the generative UI content repository.
 */

import fs from 'fs/promises';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), '../../content');

/**
 * Extract price from messy SKU/text field
 */
function extractPrice(text) {
  if (!text) return null;

  // Look for patterns like "Now$699.95" or "$699.95"
  const nowMatch = text.match(/Now\$?([\d,]+\.?\d*)/);
  if (nowMatch) return parseFloat(nowMatch[1].replace(',', ''));

  const priceMatch = text.match(/\$([\d,]+\.?\d*)/);
  if (priceMatch) return parseFloat(priceMatch[1].replace(',', ''));

  return null;
}

/**
 * Extract original price (Was price)
 */
function extractOriginalPrice(text) {
  if (!text) return null;

  const wasMatch = text.match(/Was\s*\$?([\d,]+\.?\d*)/);
  if (wasMatch) return parseFloat(wasMatch[1].replace(',', ''));

  return null;
}

/**
 * Extract warranty info
 */
function extractWarranty(text) {
  if (!text) return null;

  if (text.includes('10 Year') || text.includes('10-Year')) return '10 years';
  if (text.includes('7 yr') || text.includes('7 Year')) return '7 years';
  if (text.includes('5 yr') || text.includes('5 Year')) return '5 years';

  return null;
}

/**
 * Generate a clean ID from product name
 */
function generateId(name) {
  return name
    .toLowerCase()
    .replace(/®|™/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Detect product series from name/URL
 */
function detectSeries(name, url) {
  const text = `${name} ${url}`.toLowerCase();

  if (text.includes('ascent') && text.includes('x')) return 'ascent-x';
  if (text.includes('ascent')) return 'ascent';
  if (text.includes('5200')) return '5200';
  if (text.includes('e310') || text.includes('explorian')) return 'explorian';
  if (text.includes('propel')) return 'propel';
  if (text.includes('immersion')) return 'immersion';

  return 'other';
}

/**
 * Extract key features from description
 */
function extractFeatures(description) {
  const features = [];

  if (!description) return features;

  const featurePatterns = [
    /(\d+)\s*Blending Programs/i,
    /Self-Cleaning/i,
    /Digital Timer/i,
    /Variable Speed/i,
    /(\d+)-[Oo]unce.*?Container/i,
    /Stainless Steel/i,
    /Tamper/i,
    /BPA[- ]?Free/i,
    /Wireless/i,
    /Touch/i,
  ];

  featurePatterns.forEach(pattern => {
    const match = description.match(pattern);
    if (match) {
      features.push(match[0]);
    }
  });

  return features;
}

/**
 * Determine best use cases based on series and features
 */
function determineBestFor(series, features, description) {
  const bestFor = [];
  const text = `${features.join(' ')} ${description || ''}`.toLowerCase();

  // Base recommendations by series
  if (series === 'ascent-x') {
    bestFor.push('serious-home-chefs', 'meal-prep-enthusiasts', 'tech-lovers');
  } else if (series === '5200') {
    bestFor.push('families', 'everyday-blending', 'classic-reliability');
  } else if (series === 'explorian') {
    bestFor.push('budget-conscious', 'beginners', 'small-spaces');
  }

  // Feature-based additions
  if (text.includes('smoothie')) bestFor.push('smoothie-lovers');
  if (text.includes('soup')) bestFor.push('hot-soup-makers');
  if (text.includes('nut butter')) bestFor.push('nut-butter-makers');

  return [...new Set(bestFor)]; // Remove duplicates
}

/**
 * Get primary product image
 */
function getPrimaryImage(images) {
  if (!images || images.length === 0) return null;

  // Prefer PNG product shots over lifestyle images
  const productImages = images.filter(img =>
    img.includes('products/') &&
    !img.includes('config/') &&
    (img.includes('.png') || img.includes('format=png'))
  );

  return productImages[0] || images[0];
}

/**
 * Clean and structure a single product
 */
function cleanProduct(rawProduct) {
  const priceFromSku = extractPrice(rawProduct.sku);
  const priceFromPrice = rawProduct.priceNum || extractPrice(rawProduct.price);

  return {
    id: generateId(rawProduct.name),
    name: rawProduct.name.replace(/\s+/g, ' ').trim(),
    series: detectSeries(rawProduct.name, rawProduct.url),
    url: rawProduct.url,
    price: priceFromPrice || priceFromSku,
    originalPrice: extractOriginalPrice(rawProduct.sku),
    warranty: extractWarranty(rawProduct.sku) || extractWarranty(rawProduct.description),
    description: rawProduct.description?.substring(0, 500) || '',
    tagline: rawProduct.tagline || '',
    features: extractFeatures(rawProduct.description),
    bestFor: [],
    images: {
      primary: getPrimaryImage(rawProduct.images),
      gallery: rawProduct.images?.slice(0, 5) || [],
    },
    specs: rawProduct.specs || {},
  };
}

/**
 * Create comparison data between products
 */
function createComparisons(products) {
  const comparisons = [];

  // Group by series
  const bySeriesMap = {};
  products.forEach(p => {
    if (!bySeriesMap[p.series]) bySeriesMap[p.series] = [];
    bySeriesMap[p.series].push(p);
  });

  // Create within-series comparisons
  Object.entries(bySeriesMap).forEach(([series, seriesProducts]) => {
    if (seriesProducts.length > 1) {
      comparisons.push({
        id: `compare-${series}`,
        title: `Compare ${series.toUpperCase()} Models`,
        products: seriesProducts.map(p => p.id),
        attributes: ['price', 'warranty', 'features'],
      });
    }
  });

  // Create cross-series comparison (entry-level vs premium)
  const entryLevel = products.filter(p => ['explorian', '5200'].includes(p.series));
  const premium = products.filter(p => p.series === 'ascent-x');

  if (entryLevel.length && premium.length) {
    comparisons.push({
      id: 'compare-entry-vs-premium',
      title: 'Entry-Level vs Premium',
      products: [...entryLevel.slice(0, 2), ...premium.slice(0, 2)].map(p => p.id),
      attributes: ['price', 'warranty', 'features', 'series'],
    });
  }

  return comparisons;
}

/**
 * Create use cases content
 */
function createUseCases() {
  return {
    useCases: [
      {
        id: 'smoothies',
        name: 'Daily Smoothies',
        description: 'Blend fruits, vegetables, and proteins into silky smoothies every morning.',
        icon: 'smoothie',
        recommendedSeries: ['ascent-x', '5200', 'explorian'],
      },
      {
        id: 'soups',
        name: 'Hot Soups',
        description: 'Create steaming hot soups from raw ingredients in minutes using blade friction.',
        icon: 'soup',
        recommendedSeries: ['ascent-x', '5200'],
      },
      {
        id: 'nut-butters',
        name: 'Nut Butters',
        description: 'Grind nuts into creamy or chunky butters with no additives.',
        icon: 'nut-butter',
        recommendedSeries: ['ascent-x', '5200'],
      },
      {
        id: 'frozen-desserts',
        name: 'Frozen Desserts',
        description: 'Turn frozen fruits into healthy ice cream alternatives.',
        icon: 'frozen-dessert',
        recommendedSeries: ['ascent-x', '5200'],
      },
      {
        id: 'meal-prep',
        name: 'Meal Prep',
        description: 'Batch prepare ingredients for the week ahead.',
        icon: 'meal-prep',
        recommendedSeries: ['ascent-x'],
      },
      {
        id: 'baby-food',
        name: 'Baby Food',
        description: 'Puree fresh ingredients for homemade baby food.',
        icon: 'baby-food',
        recommendedSeries: ['ascent-x', '5200', 'explorian'],
      },
    ],
  };
}

/**
 * Create features content
 */
function createFeatures() {
  return {
    features: [
      {
        id: 'self-cleaning',
        name: 'Self-Cleaning',
        description: 'Add warm water and a drop of dish soap, and your Vitamix cleans itself in 30-60 seconds.',
        availableOn: ['ascent-x', '5200', 'explorian'],
      },
      {
        id: 'variable-speed',
        name: 'Variable Speed Control',
        description: 'Dial in the perfect texture for any recipe, from chunky salsa to silky smoothies.',
        availableOn: ['ascent-x', '5200', 'explorian'],
      },
      {
        id: 'blending-programs',
        name: 'Blending Programs',
        description: 'Preset programs for common recipes ensure consistent results every time.',
        availableOn: ['ascent-x'],
      },
      {
        id: 'touch-interface',
        name: 'Touch Interface',
        description: 'Intuitive touch controls with digital display for precise blending.',
        availableOn: ['ascent-x'],
      },
      {
        id: 'stainless-container',
        name: 'Stainless Steel Container',
        description: 'Durable, stain and odor resistant, perfect for hot and cold ingredients.',
        availableOn: ['ascent-x', '5200'],
      },
      {
        id: 'laser-cut-blades',
        name: 'Laser-Cut Stainless Steel Blades',
        description: 'Hardened blades that never need sharpening, designed to pulverize the toughest ingredients.',
        availableOn: ['ascent-x', '5200', 'explorian'],
      },
    ],
  };
}

async function main() {
  console.log('Building content repository...\n');

  // Read raw products
  const rawData = JSON.parse(
    await fs.readFile(path.join(CONTENT_DIR, 'products.json'), 'utf-8')
  );

  console.log(`Processing ${rawData.count} raw products...`);

  // Clean and structure products
  const products = rawData.products.map(cleanProduct);

  // Add bestFor based on series and features
  products.forEach(p => {
    p.bestFor = determineBestFor(p.series, p.features, p.description);
  });

  // Write cleaned products
  await fs.writeFile(
    path.join(CONTENT_DIR, 'products-clean.json'),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      count: products.length,
      products
    }, null, 2)
  );
  console.log(`✓ Wrote products-clean.json (${products.length} products)`);

  // Create comparisons
  const comparisons = createComparisons(products);
  await fs.writeFile(
    path.join(CONTENT_DIR, 'comparisons.json'),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      comparisons
    }, null, 2)
  );
  console.log(`✓ Wrote comparisons.json (${comparisons.length} comparisons)`);

  // Create use cases
  const useCases = createUseCases();
  await fs.writeFile(
    path.join(CONTENT_DIR, 'use-cases.json'),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      ...useCases
    }, null, 2)
  );
  console.log(`✓ Wrote use-cases.json (${useCases.useCases.length} use cases)`);

  // Create features
  const features = createFeatures();
  await fs.writeFile(
    path.join(CONTENT_DIR, 'features.json'),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      ...features
    }, null, 2)
  );
  console.log(`✓ Wrote features.json (${features.features.length} features)`);

  // Summary
  console.log('\nContent repository built successfully!');
  console.log(`Location: ${CONTENT_DIR}`);
}

main();
