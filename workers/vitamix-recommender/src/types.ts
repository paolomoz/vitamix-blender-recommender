/**
 * Type definitions for Vitamix Recommender Worker
 */

export interface Env {
  CEREBRAS_KEY: string;
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY?: string;
  COHERE_API_KEY?: string;
  FAL_API_KEY: string;
  DA_IMS_TOKEN: string;
  ENVIRONMENT: string;
  AI?: any; // Cloudflare Workers AI binding
}

export type LLMModel = 'cerebras' | 'claude';

export interface Product {
  id: string;
  name: string;
  series: string;
  url: string;
  price: number;
  originalPrice: number | null;
  warranty: string | null;
  description: string;
  tagline: string;
  features: string[];
  bestFor: string[];
  images: {
    primary: string | null;
    gallery: string[];
  };
  specs: Record<string, string | number>;
}

export interface ProductsData {
  generatedAt: string;
  count: number;
  products: Product[];
}

export interface UseCase {
  id: string;
  name: string;
  description: string;
  icon: string;
  relevantFeatures: string[];
  recommendedSeries: string[];
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  benefit: string;
  availableIn: string[];
}

export interface Intent {
  primary:
    | 'discovery'
    | 'comparison'
    | 'product-detail'
    | 'use-case'
    | 'specs'
    | 'reviews'
    | 'price'
    | 'recommendation';
  entities: {
    products: string[];
    useCases: string[];
    concerns: string[];
  };
  journeyStage: 'exploring' | 'comparing' | 'deciding';
  suggestedBlocks: string[];
}

export interface BlockData {
  blockType: string;
  html: string;
  sectionStyle: string;
}

export interface SessionContext {
  // Encoded format from client
  q?: {
    t: string;  // query text
    i: string;  // intent
  }[];
  p?: {
    price?: string;
    uses?: string[];
    products?: string[];
    concerns?: string[];
    stage?: string;
  };
  // Alternative full format
  queries?: {
    query: string;
    intent: string;
  }[];
}

export type BlockType =
  | 'hero-question'
  | 'needs-explorer'
  | 'product-spotlight'
  | 'comparison-table'
  | 'feature-cards'
  | 'specs-table'
  | 'review-carousel'
  | 'recipe-suggestions'
  | 'price-comparison'
  | 'recommendation'
  | 'follow-up';
