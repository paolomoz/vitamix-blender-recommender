/**
 * In-Memory Vector Store for POC
 * Stores chunks with embeddings and performs similarity search
 */

import type { DocumentChunk, VectorSearchResult, RetrievalOptions } from './types';
import { cosineSimilarity } from './embeddings';

/**
 * Simple in-memory vector store
 */
export class VectorStore {
  private chunks: DocumentChunk[] = [];

  constructor() {
    console.log('[RAG VectorStore] Initialized');
  }

  /**
   * Add chunks to the store
   */
  addChunks(chunks: DocumentChunk[]): void {
    this.chunks.push(...chunks);
    console.log(`[RAG VectorStore] Added ${chunks.length} chunks (total: ${this.chunks.length})`);
  }

  /**
   * Clear all chunks
   */
  clear(): void {
    this.chunks = [];
    console.log('[RAG VectorStore] Cleared all chunks');
  }

  /**
   * Get total number of chunks
   */
  size(): number {
    return this.chunks.length;
  }

  /**
   * Search for similar chunks
   */
  search(
    queryEmbedding: number[],
    options: RetrievalOptions = {}
  ): VectorSearchResult[] {
    const {
      topK = 5,
      filter,
      minScore = 0.0,
    } = options;

    // Filter chunks if needed
    let filteredChunks = this.chunks;
    if (filter) {
      filteredChunks = this.chunks.filter(chunk => {
        if (filter.type && chunk.metadata.type !== filter.type) return false;
        if (filter.productUrl && chunk.metadata.productUrl !== filter.productUrl) return false;
        return true;
      });
    }

    // Calculate similarity scores
    const results: VectorSearchResult[] = filteredChunks
      .filter(chunk => chunk.embedding !== undefined)
      .map(chunk => ({
        chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding!),
      }))
      .filter(result => result.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    console.log(`[RAG VectorStore] Search returned ${results.length} results (filtered from ${filteredChunks.length} chunks)`);

    return results;
  }

  /**
   * Get all chunks (for debugging)
   */
  getAllChunks(): DocumentChunk[] {
    return [...this.chunks];
  }

  /**
   * Get chunk by ID
   */
  getChunkById(id: string): DocumentChunk | undefined {
    return this.chunks.find(chunk => chunk.id === id);
  }

  /**
   * Export store data (for persistence)
   */
  export(): DocumentChunk[] {
    return this.chunks;
  }

  /**
   * Import store data (for restoration)
   */
  import(chunks: DocumentChunk[]): void {
    this.chunks = chunks;
    console.log(`[RAG VectorStore] Imported ${chunks.length} chunks`);
  }
}

// Global singleton for POC
let globalStore: VectorStore | null = null;

/**
 * Get or create the global vector store
 */
export function getVectorStore(): VectorStore {
  if (!globalStore) {
    globalStore = new VectorStore();
  }
  return globalStore;
}
