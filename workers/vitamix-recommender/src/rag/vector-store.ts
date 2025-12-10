/**
 * Vector Store with Cloudflare Vectorize
 * Stores chunks with embeddings in persistent Vectorize index
 */

import type { DocumentChunk, VectorSearchResult, RetrievalOptions } from './types';
import type { Env, VectorizeVector } from '../types';
import { cosineSimilarity } from './embeddings';

/**
 * Vector store using Cloudflare Vectorize for persistence
 */
export class VectorStore {
  private env: Env;
  private chunkCount: number = 0;

  constructor(env: Env) {
    this.env = env;
    console.log('[RAG VectorStore] Initialized with Cloudflare Vectorize');
  }

  /**
   * Add chunks to the Vectorize index
   */
  async addChunks(chunks: DocumentChunk[]): Promise<void> {
    if (!this.env.VECTORIZE) {
      throw new Error('Vectorize binding not available');
    }

    if (chunks.length === 0) {
      console.log('[RAG VectorStore] No chunks to add');
      return;
    }

    try {
      // Convert chunks to Vectorize format
      const vectors: VectorizeVector[] = chunks
        .filter(chunk => chunk.embedding && chunk.embedding.length > 0)
        .map(chunk => ({
          id: chunk.id,
          values: chunk.embedding!,
          metadata: {
            content: chunk.content,
            type: chunk.metadata.type,
            productUrl: chunk.metadata.productUrl,
            productTitle: chunk.metadata.productTitle,
            section: chunk.metadata.section || '',
          },
        }));

      if (vectors.length === 0) {
        console.log('[RAG VectorStore] No chunks with embeddings to add');
        return;
      }

      // Insert vectors in batches (Vectorize has limits)
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await this.env.VECTORIZE.insert(batch);
        console.log(`[RAG VectorStore] Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);
      }

      this.chunkCount += vectors.length;
      console.log(`[RAG VectorStore] Added ${vectors.length} chunks (total: ${this.chunkCount})`);
    } catch (error) {
      console.error('[RAG VectorStore] Error adding chunks:', error);
      throw error;
    }
  }

  /**
   * Clear all chunks from the index
   * Note: Vectorize doesn't have a clear() method, so we track IDs separately
   */
  async clear(): Promise<void> {
    console.warn('[RAG VectorStore] Clear operation not fully supported with Vectorize');
    console.warn('[RAG VectorStore] Consider recreating the index or using deleteByIds with known IDs');
    this.chunkCount = 0;
  }

  /**
   * Get estimated number of chunks
   * Note: Vectorize doesn't expose count, so this returns a cached value
   * For deployed workers, this will always return 0 unless we query
   */
  size(): number {
    return this.chunkCount;
  }

  /**
   * Check if the index has any data by doing a test query
   * Returns true if at least one vector exists
   */
  async hasData(): Promise<boolean> {
    if (!this.env.VECTORIZE) {
      return false;
    }

    try {
      // Create a dummy vector for testing (768 dimensions of 0s)
      const testVector = new Array(768).fill(0);
      const results = await this.env.VECTORIZE.query(testVector, {
        topK: 1,
        returnMetadata: false,
      });
      return results.matches.length > 0;
    } catch (error) {
      console.error('[RAG VectorStore] Error checking if index has data:', error);
      return false;
    }
  }

  /**
   * Search for similar chunks using Vectorize
   */
  async search(
    queryEmbedding: number[],
    options: RetrievalOptions = {}
  ): Promise<VectorSearchResult[]> {
    if (!this.env.VECTORIZE) {
      throw new Error('Vectorize binding not available');
    }

    const {
      topK = 5,
      filter,
      minScore = 0.0,
    } = options;

    try {
      // Build Vectorize filter if needed
      const vectorizeFilter: Record<string, any> = {};
      if (filter?.type) {
        vectorizeFilter.type = filter.type;
      }
      if (filter?.productUrl) {
        vectorizeFilter.productUrl = filter.productUrl;
      }

      // Query Vectorize
      const results = await this.env.VECTORIZE.query(queryEmbedding, {
        topK: topK * 2, // Get extra results to filter by minScore
        returnMetadata: true,
        filter: Object.keys(vectorizeFilter).length > 0 ? vectorizeFilter : undefined,
      });

      // Convert Vectorize matches to VectorSearchResult
      const searchResults: VectorSearchResult[] = results.matches
        .filter(match => match.score >= minScore)
        .slice(0, topK)
        .map(match => ({
          chunk: {
            id: match.id,
            content: match.metadata?.content || '',
            metadata: {
              type: match.metadata?.type || 'product',
              productUrl: match.metadata?.productUrl || '',
              productTitle: match.metadata?.productTitle || '',
              section: match.metadata?.section,
            },
            embedding: match.values,
          },
          score: match.score,
        }));

      console.log(`[RAG VectorStore] Search returned ${searchResults.length} results`);

      return searchResults;
    } catch (error) {
      console.error('[RAG VectorStore] Error searching:', error);
      throw error;
    }
  }

  /**
   * Get all chunks (for debugging)
   * Note: Limited implementation with Vectorize - returns empty array
   */
  getAllChunks(): DocumentChunk[] {
    console.warn('[RAG VectorStore] getAllChunks not supported with Vectorize');
    return [];
  }

  /**
   * Get chunk by ID using Vectorize
   */
  async getChunkById(id: string): Promise<DocumentChunk | undefined> {
    if (!this.env.VECTORIZE) {
      return undefined;
    }

    try {
      const results = await this.env.VECTORIZE.getByIds([id]);
      if (results.length === 0) {
        return undefined;
      }

      const vector = results[0];
      return {
        id: vector.id,
        content: vector.metadata?.content || '',
        metadata: {
          type: vector.metadata?.type || 'product',
          productUrl: vector.metadata?.productUrl || '',
          productTitle: vector.metadata?.productTitle || '',
          section: vector.metadata?.section,
        },
        embedding: vector.values,
      };
    } catch (error) {
      console.error('[RAG VectorStore] Error getting chunk by ID:', error);
      return undefined;
    }
  }

  /**
   * Export store data (not supported with Vectorize)
   */
  export(): DocumentChunk[] {
    console.warn('[RAG VectorStore] Export not supported with Vectorize');
    return [];
  }

  /**
   * Import store data (use addChunks instead)
   */
  async import(chunks: DocumentChunk[]): Promise<void> {
    console.log(`[RAG VectorStore] Importing ${chunks.length} chunks via addChunks`);
    await this.addChunks(chunks);
  }
}

// Store reference by env (keyed approach)
const storeCache = new WeakMap<Env, VectorStore>();

/**
 * Get or create vector store for this env
 */
export function getVectorStore(env: Env): VectorStore {
  if (!storeCache.has(env)) {
    storeCache.set(env, new VectorStore(env));
  }
  return storeCache.get(env)!;
}
