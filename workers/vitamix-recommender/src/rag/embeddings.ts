/**
 * Embeddings Generation
 * Supports multiple providers: Cloudflare Workers AI, OpenAI, Cohere, and Mock (for testing)
 */

import type { Env } from '../types';
import type { DocumentChunk } from './types';
import { generateMockEmbedding } from './embeddings-mock';

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
 * Generate embedding using Cohere (free tier available)
 */
async function generateEmbeddingWithCohere(text: string, env: Env): Promise<number[]> {
  if (!env.COHERE_API_KEY) {
    throw new Error('COHERE_API_KEY is not configured');
  }

  try {
    const response = await fetch('https://api.cohere.ai/v1/embed', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: [text.substring(0, 8000)],
        model: 'embed-english-light-v3.0',
        input_type: 'search_document',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cohere API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.embeddings[0];
  } catch (error) {
    console.error('[RAG Embeddings] Cohere failed:', error);
    throw error;
  }
}

/**
 * Generate embedding for a single text
 * Automatically detects available provider and uses fallback chain
 */
export async function generateEmbedding(text: string, env: Env): Promise<number[]> {
  // Try providers in order of preference, with automatic fallback on failure

  // 1. Cloudflare Workers AI (free, fast, no API key needed)
  if (env.AI) {
    try {
      console.log('[RAG Embeddings] Trying Cloudflare Workers AI...');
      return await generateEmbeddingWithWorkersAI(text, env);
    } catch (error) {
      console.warn('[RAG Embeddings] Workers AI failed, trying next provider...', error);
    }
  }

  // 2. Cohere (free tier, easy to get API key)
  if (env.COHERE_API_KEY) {
    try {
      console.log('[RAG Embeddings] Trying Cohere...');
      return await generateEmbeddingWithCohere(text, env);
    } catch (error) {
      console.warn('[RAG Embeddings] Cohere failed, trying next provider...', error);
    }
  }

  // 3. OpenAI (paid, high quality)
  if (env.OPENAI_API_KEY) {
    try {
      console.log('[RAG Embeddings] Trying OpenAI...');
      return await generateEmbeddingWithOpenAI(text, env);
    } catch (error) {
      console.warn('[RAG Embeddings] OpenAI failed, falling back to mock...', error);
    }
  }

  // 4. Mock embeddings (for testing without any API keys)
  console.warn('[RAG Embeddings] ⚠️  Using MOCK embeddings (testing only - not production quality)');
  return generateMockEmbedding(text, 384);
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
