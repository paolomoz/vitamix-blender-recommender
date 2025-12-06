/**
 * UX Flow Test
 * Tests the conversation bar, append mode, and proactive insights
 */

import { chromium } from 'playwright';

async function runTest() {
  const browser = await chromium.launch({ headless: false }); // Show browser for visual verification
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    console.log('\n=== UX Flow Test ===\n');

    // 1. Initial query
    console.log('1. Testing initial query: "best blender for smoothies"');
    await page.goto('http://localhost:3000/?q=best%20blender%20for%20smoothies', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await page.waitForTimeout(4000);

    // Check for conversation bar
    const conversationBar = await page.$('.conversation-bar');
    console.log(`   - Conversation bar: ${conversationBar ? 'FOUND' : 'NOT FOUND'}`);

    // Check for proactive insight
    const insight = await page.$('.proactive-insight');
    console.log(`   - Proactive insight: ${insight ? 'FOUND' : 'NOT FOUND'}`);

    // Check for follow-up suggestions in conversation bar
    const chips = await page.$$('.conversation-chip');
    console.log(`   - Follow-up chips: ${chips.length} found`);

    // Take screenshot
    await page.screenshot({
      path: '/Users/paolo/excat/vitamix-blender-recommender/tools/scraper/test-screenshots/ux-test-1-initial.png',
      fullPage: true,
    });
    console.log('   - Screenshot saved: ux-test-1-initial.png');

    // 2. Test follow-up via conversation bar input
    console.log('\n2. Testing follow-up query via conversation bar');
    const input = await page.$('.conversation-bar-input');
    if (input) {
      await input.click();
      await input.fill('what about the X5?');
      await page.click('.conversation-bar-submit');
      await page.waitForTimeout(4000);

      // Check if content appended (look for conversation separator)
      const separator = await page.$('.conversation-separator');
      console.log(`   - Append mode: ${separator ? 'WORKING' : 'NOT WORKING'}`);

      await page.screenshot({
        path: '/Users/paolo/excat/vitamix-blender-recommender/tools/scraper/test-screenshots/ux-test-2-followup.png',
        fullPage: true,
      });
      console.log('   - Screenshot saved: ux-test-2-followup.png');
    } else {
      console.log('   - ERROR: Conversation bar input not found');
    }

    // 3. Test clicking a follow-up chip
    console.log('\n3. Testing click on follow-up chip');
    const chipAfter = await page.$('.conversation-chip');
    if (chipAfter) {
      const chipText = await chipAfter.textContent();
      console.log(`   - Clicking chip: "${chipText?.trim()}"`);
      await chipAfter.click();
      await page.waitForTimeout(4000);

      await page.screenshot({
        path: '/Users/paolo/excat/vitamix-blender-recommender/tools/scraper/test-screenshots/ux-test-3-chip.png',
        fullPage: true,
      });
      console.log('   - Screenshot saved: ux-test-3-chip.png');
    }

    console.log('\n=== Test Complete ===\n');

    // Keep browser open for 5 seconds for visual inspection
    await page.waitForTimeout(5000);
  } catch (error) {
    console.error('Test failed:', error.message);
    await page.screenshot({
      path: '/Users/paolo/excat/vitamix-blender-recommender/tools/scraper/test-screenshots/ux-test-error.png',
      fullPage: true,
    });
  } finally {
    await browser.close();
  }
}

runTest();
