/**
 * RAG Retrieval Logic
 * Retrieves relevant context for user queries
 */

import type { Env } from '../types';
import type { Intent } from '../types';
import type { RetrievalOptions, VectorSearchResult } from './types';
import { generateEmbedding } from './embeddings';
import { getVectorStore } from './vector-store';

/**
 * Retrieve relevant context for a user query
 */
export async function retrieveContext(
  query: string,
  env: Env,
  options: RetrievalOptions = {}
): Promise<VectorSearchResult[]> {
  const store = getVectorStore();

  // Check if store is empty
  if (store.size() === 0) {
    console.warn('[RAG Retrieval] Vector store is empty. Did you index the products?');
    return [];
  }

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query, env);

  // Search for similar chunks
  const results = store.search(queryEmbedding, {
    topK: options.topK || 5,
    filter: options.filter,
    minScore: options.minScore || 0.5,
  });

  console.log(`[RAG Retrieval] Retrieved ${results.length} chunks for query: "${query.substring(0, 50)}..."`);

  return results;
}

/**
 * Retrieve context with intent-aware filtering
 */
export async function retrieveContextWithIntent(
  query: string,
  intent: Intent | null,
  env: Env,
  topK: number = 5
): Promise<VectorSearchResult[]> {
  const options: RetrievalOptions = { topK };

  // Apply filters based on intent
  if (intent) {
    // If user is asking about specific products, prioritize those
    if (intent.entities?.products && intent.entities.products.length > 0) {
      // For now, just increase topK to get more results
      options.topK = topK * 2;
    }

    // Filter by content type based on intent
    if (intent.primary === 'specs') {
      options.filter = { type: 'spec' };
    } else if (intent.primary === 'product-detail') {
      options.filter = { type: 'product' };
    }
  }

  return retrieveContext(query, env, options);
}

/**
 * Format retrieved context for LLM consumption
 */
export function formatContextForLLM(results: VectorSearchResult[]): string {
  if (results.length === 0) {
    return 'No relevant product information found.';
  }

  const contextParts: string[] = [
    '# Retrieved Product Information',
    '',
    'Here are the most relevant products from the Vitamix catalog:',
    '',
  ];

  results.forEach((result, index) => {
    const { chunk, score } = result;
    const { metadata, content } = chunk;

    contextParts.push(`## Result ${index + 1}: ${metadata.productTitle} (relevance: ${(score * 100).toFixed(1)}%)`);
    contextParts.push(`**Type:** ${metadata.type}`);
    contextParts.push(`**Source:** ${metadata.productUrl}`);
    contextParts.push('');
    contextParts.push(content);
    contextParts.push('');
    contextParts.push('---');
    contextParts.push('');
  });

  return contextParts.join('\n');
}

/**
 * Get product recommendations based on query
 */
export async function getProductRecommendations(
  query: string,
  env: Env,
  topK: number = 3
): Promise<{ productTitle: string; productUrl: string; reason: string }[]> {
  const results = await retrieveContext(query, env, { topK, filter: { type: 'product' } });

  // Group by product and take best match per product
  const productMap = new Map<string, VectorSearchResult>();

  for (const result of results) {
    const productUrl = result.chunk.metadata.productUrl;
    const existing = productMap.get(productUrl);

    if (!existing || result.score > existing.score) {
      productMap.set(productUrl, result);
    }
  }

  // Convert to recommendations
  const recommendations = Array.from(productMap.values()).map(result => ({
    productTitle: result.chunk.metadata.productTitle,
    productUrl: result.chunk.metadata.productUrl,
    reason: result.chunk.content.substring(0, 200) + '...',
  }));

  return recommendations.slice(0, topK);
}
