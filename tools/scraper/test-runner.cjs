const { chromium } = require('playwright');

const TEST_CASES = [
  // Use Case Tests
  { category: 'Use Cases', query: 'best blender for smoothies', expect: ['Ascent', 'smoothie'] },
  { category: 'Use Cases', query: 'hot soup maker', expect: ['Ascent', 'soup'] },
  { category: 'Use Cases', query: 'nut butter blender', expect: ['Ascent', 'nut'] },
  { category: 'Use Cases', query: 'frozen dessert maker', expect: ['Ascent', 'frozen'] },
  { category: 'Use Cases', query: 'baby food puree', expect: ['Ascent', 'baby'] },
  { category: 'Use Cases', query: 'meal prep kitchen system', expect: ['Ascent', 'meal'] },

  // Price/Budget Tests
  { category: 'Budget', query: 'cheap vitamix under 500', expect: ['E310', 'budget'] },
  { category: 'Budget', query: 'best value blender', expect: ['price', 'value'] },
  { category: 'Budget', query: 'affordable options', expect: ['price', 'E310'] },
  { category: 'Budget', query: 'premium high-end blender', expect: ['X5', 'premium'] },

  // Comparison Tests
  { category: 'Comparison', query: 'X5 vs X4', expect: ['comparison', 'X5', 'X4'] },
  { category: 'Comparison', query: 'compare Ascent models', expect: ['comparison', 'Ascent'] },
  { category: 'Comparison', query: 'difference between 5200 and Explorian', expect: ['comparison', '5200'] },
  { category: 'Comparison', query: 'which is better X3 or X2', expect: ['comparison'] },

  // Product Detail Tests
  { category: 'Product', query: 'tell me about the Ascent X5', expect: ['X5', 'specs'] },
  { category: 'Product', query: 'E310 Explorian features', expect: ['E310', 'features'] },
  { category: 'Product', query: '5200 specifications', expect: ['5200', 'specs'] },

  // Recipe Tests
  { category: 'Recipes', query: 'smoothie recipes', expect: ['recipe', 'Smoothie'] },
  { category: 'Recipes', query: 'soup recipes for vitamix', expect: ['recipe', 'Soup'] },
  { category: 'Recipes', query: 'how to make nut butter', expect: ['recipe', 'Butter'] },
  { category: 'Recipes', query: 'frozen dessert ideas', expect: ['recipe', 'Cream'] },

  // Review Tests
  { category: 'Reviews', query: 'customer reviews X5', expect: ['review', 'Worth every penny'] },
  { category: 'Reviews', query: 'what do people say about vitamix', expect: ['review', 'Verified'] },
  { category: 'Reviews', query: 'is the 5200 worth it', expect: ['review', '5200'] },

  // Discovery Tests
  { category: 'Discovery', query: 'help me choose a blender', expect: ['What would you like'] },
  { category: 'Discovery', query: 'what vitamix should I get', expect: ['recommendation'] },
  { category: 'Discovery', query: 'I need a blender for my family', expect: ['recommendation', 'family'] },

  // Edge Cases
  { category: 'Edge Cases', query: 'smothies', expect: ['smoothie'] }, // typo - LLM should understand
  { category: 'Edge Cases', query: 'BEST BLENDER', expect: ['Ascent'] }, // caps
  { category: 'Edge Cases', query: 'blender for protein shakes and smoothies', expect: ['smoothie'] },
  { category: 'Edge Cases', query: '', expect: ['Vitamix'] }, // empty - discovery mode, any content shows it's working

  // Conversational Flow Tests
  { category: 'Flow', query: 'I want to make smoothies', expect: ['smoothies'] },
  { category: 'Flow', query: 'what about soups too?', expect: ['soups'] },
  { category: 'Flow', query: 'which model handles both?', expect: ['comparison', 'recommendation'] },

  // Feature-specific Tests
  { category: 'Features', query: 'blender with touchscreen', expect: ['X5', 'X4', 'touchscreen'] },
  { category: 'Features', query: 'self cleaning blender', expect: ['self-cleaning', 'Self-Cleaning'] },
  { category: 'Features', query: 'blender with programs', expect: ['programs', 'Programs'] },
  { category: 'Features', query: 'variable speed control', expect: ['Variable Speed'] },
];

async function runTests() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const results = [];
  const startTime = Date.now();
  const testDuration = 30 * 60 * 1000; // 30 minutes

  console.log('='.repeat(60));
  console.log('VITAMIX RECOMMENDER - COMPREHENSIVE TEST SUITE');
  console.log('Started:', new Date().toISOString());
  console.log('='.repeat(60));

  let testIndex = 0;
  let passCount = 0;
  let failCount = 0;
  let issuesFound = [];

  while (Date.now() - startTime < testDuration && testIndex < TEST_CASES.length * 3) {
    const test = TEST_CASES[testIndex % TEST_CASES.length];
    const iteration = Math.floor(testIndex / TEST_CASES.length) + 1;

    console.log(`\n[${testIndex + 1}] Testing: "${test.query}" (${test.category}) - Iteration ${iteration}`);

    const testStart = Date.now();

    try {
      // Navigate to the page with the query
      const url = test.query
        ? `http://localhost:3000/?q=${encodeURIComponent(test.query)}`
        : 'http://localhost:3000/';

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });

      // Wait for content to load (SSE streaming)
      await page.waitForTimeout(3000);

      // Get page content
      const content = await page.content();
      const textContent = await page.evaluate(() => document.body.innerText);

      // Check expectations
      let passed = true;
      let failedExpectations = [];

      for (const expectation of test.expect) {
        const found = content.toLowerCase().includes(expectation.toLowerCase()) ||
                     textContent.toLowerCase().includes(expectation.toLowerCase());
        if (!found) {
          passed = false;
          failedExpectations.push(expectation);
        }
      }

      const duration = Date.now() - testStart;

      if (passed) {
        console.log(`   ✓ PASS (${duration}ms)`);
        passCount++;
      } else {
        console.log(`   ✗ FAIL - Missing: ${failedExpectations.join(', ')} (${duration}ms)`);
        failCount++;
        issuesFound.push({
          query: test.query,
          category: test.category,
          missing: failedExpectations,
          duration
        });

        // Take screenshot of failures
        await page.screenshot({
          path: `/Users/paolo/excat/vitamix-blender-recommender/tools/scraper/test-screenshots/fail-${testIndex}.png`,
          fullPage: true
        });
      }

      // Check for visual issues
      const hasContentComingSoon = textContent.includes('Content coming soon');
      if (hasContentComingSoon) {
        console.log('   ⚠ WARNING: "Content coming soon" found');
        issuesFound.push({
          query: test.query,
          category: test.category,
          issue: 'Content coming soon block',
          duration
        });
      }

      // Check for errors in console
      const errors = await page.evaluate(() => {
        return window.__errors || [];
      });
      if (errors.length > 0) {
        console.log(`   ⚠ Console errors: ${errors.length}`);
      }

      results.push({
        query: test.query,
        category: test.category,
        passed,
        duration,
        iteration
      });

    } catch (error) {
      console.log(`   ✗ ERROR: ${error.message}`);
      failCount++;
      issuesFound.push({
        query: test.query,
        category: test.category,
        error: error.message
      });
    }

    testIndex++;

    // Brief pause between tests
    await page.waitForTimeout(500);
  }

  const totalDuration = Date.now() - startTime;

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testIndex}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Pass Rate: ${((passCount / testIndex) * 100).toFixed(1)}%`);
  console.log(`Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`Avg per test: ${(totalDuration / testIndex).toFixed(0)}ms`);

  if (issuesFound.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('ISSUES FOUND:');
    issuesFound.forEach((issue, i) => {
      console.log(`${i + 1}. [${issue.category}] "${issue.query}"`);
      if (issue.missing) console.log(`   Missing: ${issue.missing.join(', ')}`);
      if (issue.issue) console.log(`   Issue: ${issue.issue}`);
      if (issue.error) console.log(`   Error: ${issue.error}`);
    });
  }

  // Category breakdown
  console.log('\n' + '-'.repeat(60));
  console.log('RESULTS BY CATEGORY:');
  const categories = [...new Set(TEST_CASES.map(t => t.category))];
  for (const cat of categories) {
    const catResults = results.filter(r => r.category === cat);
    const catPass = catResults.filter(r => r.passed).length;
    console.log(`  ${cat}: ${catPass}/${catResults.length} passed`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Ended:', new Date().toISOString());
  console.log('='.repeat(60));

  // Keep browser open for inspection
  console.log('\nBrowser kept open for inspection. Press Ctrl+C to close.');
  await new Promise(() => {});
}

runTests().catch(console.error);
