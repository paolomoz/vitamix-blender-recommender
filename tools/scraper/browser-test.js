/**
 * Browser test for generative UI
 */

import { chromium } from 'playwright';

async function runTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Collect console logs and errors
  const consoleLogs = [];
  const consoleErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(`Page error: ${err.message}`);
  });

  try {
    // Test 1: Load homepage
    console.log('\n=== Test 1: Loading homepage ===');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 10000 });
    await page.screenshot({ path: '/Users/paolo/excat/vitamix-blender-recommender/tools/scraper/test-screenshots/01-homepage.png' });
    console.log('Screenshot: 01-homepage.png');

    // Check if query-form block loaded
    const queryForm = await page.$('.query-form');
    const queryInput = await page.$('.query-form-input');
    const submitBtn = await page.$('.query-form-submit');
    const chips = await page.$$('.query-form-chip');

    console.log(`Query form found: ${!!queryForm}`);
    console.log(`Input field found: ${!!queryInput}`);
    console.log(`Submit button found: ${!!submitBtn}`);
    console.log(`Suggestion chips found: ${chips.length}`);

    // Test 2: Submit a query via input
    console.log('\n=== Test 2: Submitting query ===');
    if (queryInput) {
      await queryInput.fill('best blender for smoothies');
      await page.screenshot({ path: '/Users/paolo/excat/vitamix-blender-recommender/tools/scraper/test-screenshots/02-query-entered.png' });
      console.log('Screenshot: 02-query-entered.png');

      await submitBtn.click();

      // Wait for loading state
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/Users/paolo/excat/vitamix-blender-recommender/tools/scraper/test-screenshots/03-loading.png' });
      console.log('Screenshot: 03-loading.png');

      // Wait for generation to complete
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/Users/paolo/excat/vitamix-blender-recommender/tools/scraper/test-screenshots/04-generated.png' });
      console.log('Screenshot: 04-generated.png');

      // Check generated content
      const heroQuestion = await page.$('.hero-question');
      const sections = await page.$$('#generation-content .section');
      console.log(`Hero question found: ${!!heroQuestion}`);
      console.log(`Sections generated: ${sections.length}`);
    }

    // Test 3: Direct URL with query parameter
    console.log('\n=== Test 3: Direct query URL ===');
    await page.goto('http://localhost:3000/?q=compare%20X5%20vs%20X4', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/Users/paolo/excat/vitamix-blender-recommender/tools/scraper/test-screenshots/05-comparison.png' });
    console.log('Screenshot: 05-comparison.png');

    const comparisonTable = await page.$('.comparison-table');
    console.log(`Comparison table found: ${!!comparisonTable}`);

    // Test 4: Budget query
    console.log('\n=== Test 4: Budget query ===');
    await page.goto('http://localhost:3000/?q=budget%20friendly%20options', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/Users/paolo/excat/vitamix-blender-recommender/tools/scraper/test-screenshots/06-budget.png' });
    console.log('Screenshot: 06-budget.png');

    const priceComparison = await page.$('.price-comparison');
    console.log(`Price comparison found: ${!!priceComparison}`);

    // Report console errors
    console.log('\n=== Console Errors ===');
    if (consoleErrors.length === 0) {
      console.log('No console errors!');
    } else {
      consoleErrors.forEach(err => console.log(`ERROR: ${err}`));
    }

    // Report relevant logs
    console.log('\n=== Relevant Console Logs ===');
    consoleLogs
      .filter(log => log.includes('[Generative]') || log.includes('error') || log.includes('Error'))
      .forEach(log => console.log(log));

  } catch (error) {
    console.error('Test failed:', error.message);
    await page.screenshot({ path: '/Users/paolo/excat/vitamix-blender-recommender/tools/scraper/test-screenshots/error.png' });
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
import { mkdir } from 'fs/promises';
await mkdir('/Users/paolo/excat/vitamix-blender-recommender/tools/scraper/test-screenshots', { recursive: true });

runTest();
