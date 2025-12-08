/**
 * Embeddings Generation
 * Supports Cloudflare Workers AI (default) and OpenAI (fallback)
 */

import type { Env } from '../types';
import type { DocumentChunk } from './types';

/**
 * Generate embedding using Cloudflare Workers AI
 */
async function generateEmbeddingWithWorkersAI(text: string, env: Env): Promise<number[]> {
  if (!env.AI) {
    throw new Error('Cloudflare Workers AI binding is not configured');
  }

  try {
    const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: text.substring(0, 8000),
    });

    return response.data[0];
  } catch (error) {
    console.error('[RAG Embeddings] Workers AI failed:', error);
    throw error;
  }
}

/**
 * Generate embedding using OpenAI (fallback)
 */
async function generateEmbeddingWithOpenAI(text: string, env: Env): Promise<number[]> {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.substring(0, 8000),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('[RAG Embeddings] OpenAI failed:', error);
    throw error;
  }
}

/**
 * Generate embedding for a single text
 * Automatically uses Workers AI if available, falls back to OpenAI
 */
export async function generateEmbedding(text: string, env: Env): Promise<number[]> {
  // Prefer Cloudflare Workers AI (free, fast, no API key needed)
  if (env.AI) {
    console.log('[RAG Embeddings] Using Cloudflare Workers AI');
    return generateEmbeddingWithWorkersAI(text, env);
  }

  // Fallback to OpenAI
  if (env.OPENAI_API_KEY) {
    console.log('[RAG Embeddings] Using OpenAI (fallback)');
    return generateEmbeddingWithOpenAI(text, env);
  }

  throw new Error('No embedding provider configured. Please set up Cloudflare Workers AI binding or OPENAI_API_KEY');
}

/**
 * Generate embeddings for multiple chunks with batching
 */
export async function generateEmbeddings(
  chunks: DocumentChunk[],
  env: Env,
  batchSize: number = 10
): Promise<DocumentChunk[]> {
  const chunksWithEmbeddings: DocumentChunk[] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    console.log(`[RAG Embeddings] Processing batch ${i / batchSize + 1}/${Math.ceil(chunks.length / batchSize)}`);

    // Process batch in parallel
    const embeddings = await Promise.all(
      batch.map(chunk => generateEmbedding(chunk.content, env))
    );

    // Attach embeddings to chunks
    batch.forEach((chunk, index) => {
      chunksWithEmbeddings.push({
        ...chunk,
        embedding: embeddings[index],
      });
    });

    // Small delay to avoid rate limits
    if (i + batchSize < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`[RAG Embeddings] Generated ${chunksWithEmbeddings.length} embeddings`);
  return chunksWithEmbeddings;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return similarity;
}
