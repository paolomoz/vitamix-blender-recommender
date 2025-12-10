/**
 * Local RAG Indexer
 * Uses existing product data from content.ts instead of scraping
 */

import type { Env } from '../types';
import { products } from '../content';
import { generateEmbeddings } from './embeddings';
import { getVectorStore } from './vector-store';
import type { DocumentChunk, ProductPageContent } from './types';

/**
 * Convert our existing Product type to ProductPageContent
 */
function convertToProductPageContent(product: any): ProductPageContent {
  return {
    url: product.url,
    title: product.name,
    description: `${product.tagline}\n\n${product.description}`,
    price: `$${product.price}`,
    features: product.features,
    specs: product.specs,
    rawContent: `${product.name} ${product.description} ${product.features.join(' ')}`,
  };
}

/**
 * Chunk a single product into searchable documents
 */
function chunkProduct(product: any): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const url = product.url;
  const title = product.name;

  // Chunk 1: Overview
  chunks.push({
    id: `${product.id}-overview`,
    content: `${title}\n\n${product.tagline}\n\n${product.description}\nPrice: $${product.price}\nBest for: ${product.bestFor.join(', ')}`,
    metadata: {
      type: 'product',
      productUrl: url,
      productTitle: title,
      section: 'overview',
    },
  });

  // Chunk 2-N: Individual features
  product.features.forEach((feature: string, index: number) => {
    chunks.push({
      id: `${product.id}-feature-${index}`,
      content: `${title} - Feature: ${feature}`,
      metadata: {
        type: 'feature',
        productUrl: url,
        productTitle: title,
        section: 'features',
      },
    });
  });

  // Chunk N+1: Specs
  const specsText = Object.entries(product.specs)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  if (specsText.length > 0) {
    chunks.push({
      id: `${product.id}-specs`,
      content: `${title} Specifications:\n${specsText}`,
      metadata: {
        type: 'spec',
        productUrl: url,
        productTitle: title,
        section: 'specs',
      },
    });
  }

  // Chunk N+2: Full content
  const fullContent = [
    title,
    product.tagline,
    product.description,
    `Price: $${product.price}`,
    `Best for: ${product.bestFor.join(', ')}`,
    `Features: ${product.features.join(', ')}`,
    specsText,
  ].filter(Boolean).join('\n\n');

  chunks.push({
    id: `${product.id}-full`,
    content: fullContent.substring(0, 2000),
    metadata: {
      type: 'product',
      productUrl: url,
      productTitle: title,
      section: 'full',
    },
  });

  return chunks;
}

/**
 * Index products from local content.ts
 * This avoids scraping and Cloudflare bot protection
 */
export async function indexProductsLocal(
  env: Env
): Promise<{ success: boolean; chunksIndexed: number; error?: string }> {
  console.log('[RAG Indexer Local] Starting indexing from content.ts...');

  try {
    // Step 1: Chunk all products
    console.log(`[RAG Indexer Local] Chunking ${products.length} products...`);
    const allChunks: DocumentChunk[] = [];

    for (const product of products) {
      const chunks = chunkProduct(product);
      allChunks.push(...chunks);
    }

    console.log(`[RAG Indexer Local] Created ${allChunks.length} chunks`);

    // Step 2: Generate embeddings
    console.log('[RAG Indexer Local] Generating embeddings...');
    const chunksWithEmbeddings = await generateEmbeddings(allChunks, env, 10);

    // Step 3: Add to vector store
    console.log('[RAG Indexer Local] Adding to vector store...');
    const store = getVectorStore(env);
    await store.clear();
    await store.addChunks(chunksWithEmbeddings);

    console.log(`[RAG Indexer Local] ✅ Successfully indexed ${chunksWithEmbeddings.length} chunks from ${products.length} products`);

    return {
      success: true,
      chunksIndexed: chunksWithEmbeddings.length,
    };
  } catch (error) {
    console.error('[RAG Indexer Local] ❌ Indexing failed:', error);
    return {
      success: false,
      chunksIndexed: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
