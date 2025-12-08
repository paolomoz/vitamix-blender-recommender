/**
 * RAG Indexer
 * Main function to index all products from sitemap
 */

import type { Env } from '../types';
import { fetchSitemapUrls, scrapeAllProducts } from './scraper';
import { chunkAllProducts } from './chunking';
import { generateEmbeddings } from './embeddings';
import { getVectorStore } from './vector-store';

const SITEMAP_URL = 'https://www.vitamix.com/us/en_us/products/sitemap.xml';

/**
 * Index all products from the Vitamix sitemap
 * This is the main function to populate the vector store
 */
export async function indexProducts(
  env: Env,
  sitemapUrl: string = SITEMAP_URL,
  limit?: number
): Promise<{ success: boolean; chunksIndexed: number; error?: string }> {
  console.log('[RAG Indexer] Starting product indexing...');

  try {
    // Step 1: Fetch sitemap URLs
    console.log('[RAG Indexer] Step 1: Fetching sitemap...');
    let urls = await fetchSitemapUrls(sitemapUrl);

    if (limit) {
      urls = urls.slice(0, limit);
      console.log(`[RAG Indexer] Limiting to ${limit} products for testing`);
    }

    // Step 2: Scrape product pages
    console.log(`[RAG Indexer] Step 2: Scraping ${urls.length} product pages...`);
    const products = await scrapeAllProducts(urls, 5, 1000);

    if (products.length === 0) {
      throw new Error('No products scraped successfully');
    }

    // Step 3: Chunk products
    console.log('[RAG Indexer] Step 3: Chunking products...');
    const chunks = chunkAllProducts(products);

    // Step 4: Generate embeddings
    console.log('[RAG Indexer] Step 4: Generating embeddings...');
    const chunksWithEmbeddings = await generateEmbeddings(chunks, env, 10);

    // Step 5: Add to vector store
    console.log('[RAG Indexer] Step 5: Adding to vector store...');
    const store = getVectorStore();
    store.clear(); // Clear existing data
    store.addChunks(chunksWithEmbeddings);

    console.log(`[RAG Indexer] ✅ Successfully indexed ${chunksWithEmbeddings.length} chunks from ${products.length} products`);

    return {
      success: true,
      chunksIndexed: chunksWithEmbeddings.length,
    };
  } catch (error) {
    console.error('[RAG Indexer] ❌ Indexing failed:', error);
    return {
      success: false,
      chunksIndexed: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
