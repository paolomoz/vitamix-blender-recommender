/**
 * Content Chunking for RAG
 * Breaks down product pages into searchable chunks
 */

import type { ProductPageContent, DocumentChunk } from './types';

/**
 * Chunk a product page into multiple searchable documents
 */
export function chunkProductPage(product: ProductPageContent): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];

  // Chunk 1: Overview (title + description)
  if (product.title || product.description) {
    chunks.push({
      id: `${sanitizeUrl(product.url)}-overview`,
      content: `${product.title}\n\n${product.description}${product.price ? `\nPrice: ${product.price}` : ''}`,
      metadata: {
        type: 'product',
        productUrl: product.url,
        productTitle: product.title,
        section: 'overview',
      },
    });
  }

  // Chunk 2-N: Individual features
  product.features.forEach((feature, index) => {
    if (feature.trim().length > 0) {
      chunks.push({
        id: `${sanitizeUrl(product.url)}-feature-${index}`,
        content: `${product.title} - Feature: ${feature}`,
        metadata: {
          type: 'feature',
          productUrl: product.url,
          productTitle: product.title,
          section: 'features',
        },
      });
    }
  });

  // Chunk N+1: All specs combined
  const specsText = Object.entries(product.specs)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  if (specsText.length > 0) {
    chunks.push({
      id: `${sanitizeUrl(product.url)}-specs`,
      content: `${product.title} Specifications:\n${specsText}`,
      metadata: {
        type: 'spec',
        productUrl: product.url,
        productTitle: product.title,
        section: 'specs',
      },
    });
  }

  // Chunk N+2: Full content (for broad semantic matching)
  // Keep this under ~500 tokens for better embedding quality
  const fullContent = [
    product.title,
    product.description,
    product.price ? `Price: ${product.price}` : '',
    `Features: ${product.features.join(', ')}`,
    specsText,
  ].filter(Boolean).join('\n\n');

  chunks.push({
    id: `${sanitizeUrl(product.url)}-full`,
    content: fullContent.substring(0, 2000), // Limit length
    metadata: {
      type: 'product',
      productUrl: product.url,
      productTitle: product.title,
      section: 'full',
    },
  });

  return chunks;
}

/**
 * Chunk all products
 */
export function chunkAllProducts(products: ProductPageContent[]): DocumentChunk[] {
  const allChunks: DocumentChunk[] = [];

  for (const product of products) {
    const chunks = chunkProductPage(product);
    allChunks.push(...chunks);
  }

  console.log(`[RAG Chunking] Created ${allChunks.length} chunks from ${products.length} products`);
  return allChunks;
}

/**
 * Create URL-safe identifier
 */
function sanitizeUrl(url: string): string {
  return url
    .replace(/https?:\/\//, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}
