/**
 * Product Page Scraper
 * Fetches and parses Vitamix product pages
 */

import type { ProductPageContent } from './types';

/**
 * Fetch the sitemap and extract all product URLs
 */
export async function fetchSitemapUrls(sitemapUrl: string): Promise<string[]> {
  const response = await fetch(sitemapUrl);
  const xml = await response.text();

  // Extract URLs from XML sitemap
  const urlMatches = xml.matchAll(/<loc>(.*?)<\/loc>/g);
  const urls: string[] = [];

  for (const match of urlMatches) {
    urls.push(match[1]);
  }

  console.log(`[RAG Scraper] Found ${urls.length} URLs in sitemap`);
  return urls;
}

/**
 * Scrape a single product page
 */
export async function scrapeProductPage(url: string): Promise<ProductPageContent | null> {
  try {
    const response = await fetch(url);
    const html = await response.text();

    // Simple HTML parsing (in production, use a proper HTML parser)
    const title = extractText(html, /<title>(.*?)<\/title>/);
    const description = extractText(html, /<meta name="description" content="(.*?)"/) ||
                       extractText(html, /<meta property="og:description" content="(.*?)"/);

    // Extract price
    const price = extractText(html, /\$[\d,]+\.?\d*/);

    // Extract features (look for common patterns)
    const features = extractFeatures(html);

    // Extract specs
    const specs = extractSpecs(html);

    return {
      url,
      title: cleanText(title || ''),
      description: cleanText(description || ''),
      price,
      features,
      specs,
      rawContent: cleanHTML(html),
    };
  } catch (error) {
    console.error(`[RAG Scraper] Failed to scrape ${url}:`, error);
    return null;
  }
}

/**
 * Batch scrape multiple product pages with rate limiting
 */
export async function scrapeAllProducts(
  urls: string[],
  batchSize: number = 5,
  delayMs: number = 1000
): Promise<ProductPageContent[]> {
  const results: ProductPageContent[] = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    console.log(`[RAG Scraper] Processing batch ${i / batchSize + 1}/${Math.ceil(urls.length / batchSize)}`);

    const batchResults = await Promise.all(
      batch.map(url => scrapeProductPage(url))
    );

    results.push(...batchResults.filter((r): r is ProductPageContent => r !== null));

    // Rate limiting
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`[RAG Scraper] Successfully scraped ${results.length} products`);
  return results;
}

// Helper functions

function extractText(html: string, regex: RegExp): string | undefined {
  const match = html.match(regex);
  return match ? match[1] : undefined;
}

function extractFeatures(html: string): string[] {
  const features: string[] = [];

  // Look for common feature patterns
  const patterns = [
    /<li[^>]*>(.*?)<\/li>/g,
    /<p[^>]*class="[^"]*feature[^"]*"[^>]*>(.*?)<\/p>/gi,
  ];

  for (const pattern of patterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const text = cleanText(stripHTML(match[1]));
      if (text.length > 10 && text.length < 200) {
        features.push(text);
      }
    }
  }

  return [...new Set(features)].slice(0, 10); // Dedupe and limit
}

function extractSpecs(html: string): Record<string, string> {
  const specs: Record<string, string> = {};

  // Look for spec patterns (key: value)
  const specPatterns = [
    /<dt[^>]*>(.*?)<\/dt>\s*<dd[^>]*>(.*?)<\/dd>/g,
    /<tr[^>]*>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>/g,
  ];

  for (const pattern of specPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const key = cleanText(stripHTML(match[1]));
      const value = cleanText(stripHTML(match[2]));
      if (key && value && key.length < 50 && value.length < 200) {
        specs[key] = value;
      }
    }
  }

  return specs;
}

function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function cleanHTML(html: string): string {
  // Remove scripts and styles
  let cleaned = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleaned = stripHTML(cleaned);
  return cleanText(cleaned);
}

function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
