/**
 * RAG System - Main Export
 */

// Re-export types
export type {
  ProductPageContent,
  DocumentChunk,
  VectorSearchResult,
  RetrievalOptions,
} from './types';

// Re-export scraper
export {
  fetchSitemapUrls,
  scrapeProductPage,
  scrapeAllProducts,
} from './scraper';

// Re-export chunking
export {
  chunkProductPage,
  chunkAllProducts,
} from './chunking';

// Re-export embeddings
export {
  generateEmbedding,
  generateEmbeddings,
  cosineSimilarity,
} from './embeddings';

// Re-export vector store
export {
  VectorStore,
  getVectorStore,
} from './vector-store';

// Re-export retrieval
export {
  retrieveContext,
  retrieveContextWithIntent,
  formatContextForLLM,
  getProductRecommendations,
} from './retrieval';

// Main indexing functions
export { indexProducts } from './indexer';
export { indexProductsLocal } from './indexer-local';
