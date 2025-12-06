/**
 * Full page screenshot test
 */

import { chromium } from 'playwright';

async function runTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // Test comparison query with full page screenshot
    console.log('Testing comparison query...');
    await page.goto('http://localhost:3000/?q=compare%20X5%20vs%20X4', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: '/Users/paolo/excat/vitamix-blender-recommender/tools/scraper/test-screenshots/full-comparison.png',
      fullPage: true
    });
    console.log('Screenshot: full-comparison.png');

    // Test budget query with full page screenshot
    console.log('Testing budget query...');
    await page.goto('http://localhost:3000/?q=budget%20friendly%20options', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: '/Users/paolo/excat/vitamix-blender-recommender/tools/scraper/test-screenshots/full-budget.png',
      fullPage: true
    });
    console.log('Screenshot: full-budget.png');

    // Test smoothie query
    console.log('Testing smoothie query...');
    await page.goto('http://localhost:3000/?q=best%20blender%20for%20smoothies', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: '/Users/paolo/excat/vitamix-blender-recommender/tools/scraper/test-screenshots/full-smoothie.png',
      fullPage: true
    });
    console.log('Screenshot: full-smoothie.png');

    console.log('Done!');
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

runTest();
