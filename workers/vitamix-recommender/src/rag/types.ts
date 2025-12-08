/**
 * RAG System Types
 */

export interface ProductPageContent {
  url: string;
  title: string;
  description: string;
  price?: string;
  features: string[];
  specs: Record<string, string>;
  reviews?: string[];
  rawContent: string;
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    type: 'product' | 'feature' | 'spec' | 'review';
    productUrl: string;
    productTitle: string;
    section?: string;
  };
  embedding?: number[];
}

export interface VectorSearchResult {
  chunk: DocumentChunk;
  score: number;
}

export interface RetrievalOptions {
  topK?: number;
  filter?: {
    type?: string;
    productUrl?: string;
  };
  minScore?: number;
}
