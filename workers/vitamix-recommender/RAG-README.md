# RAG (Retrieval Augmented Generation) System

This document describes the RAG system implementation for the Vitamix Recommender Worker.

## Overview

The RAG system enhances product recommendations by:
- **Scraping** real product pages from Vitamix.com
- **Chunking** content into semantically meaningful pieces
- **Embedding** chunks using Cloudflare Workers AI (FREE!)
- **Retrieving** relevant context based on user queries
- **Augmenting** LLM prompts with factual product information

## Architecture

```
┌─────────────────┐
│  Sitemap.xml    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Scraper       │  Fetches product pages
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Chunking      │  Breaks into searchable pieces
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   Embeddings                        │
│   Cloudflare Workers AI (FREE!)     │
│   @cf/baai/bge-base-en-v1.5         │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Vector Store   │  In-memory (POC)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Retrieval     │  Cosine similarity search
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   LLM Context                       │
│   Augmented prompts for             │
│   Claude or Cerebras                │
└─────────────────────────────────────┘
```

## Setup

### 1. Install Dependencies

```bash
cd workers/vitamix-recommender
npm install
```

### 2. Configure Embeddings Provider

**Option A: Cloudflare Workers AI (Recommended - FREE!)**

No configuration needed! The AI binding is already configured in `wrangler.toml`. Just start the worker.

**Option B: OpenAI (Fallback)**

If you prefer OpenAI embeddings, create a `.dev.vars` file:

```bash
# workers/vitamix-recommender/.dev.vars
OPENAI_API_KEY=sk-your-openai-key-here
```

For production:
```bash
wrangler secret put OPENAI_API_KEY
```

### 3. Start the Worker

```bash
npm run dev
```

The worker will start on `http://localhost:8787`.

## Usage

### Step 1: Index Products

Before using RAG, you need to index the products from the sitemap:

```bash
# Index all products (this may take 5-10 minutes)
curl http://localhost:8787/api/index

# Or index a limited number for testing (faster)
curl http://localhost:8787/api/index?limit=10
```

**What happens during indexing:**
1. Fetches all URLs from the Vitamix sitemap
2. Scrapes each product page (with rate limiting)
3. Extracts: title, description, features, specs
4. Chunks content into searchable pieces
5. Generates embeddings for each chunk (Cloudflare Workers AI - FREE!)
6. Stores in in-memory vector store

**Expected output:**
```json
{
  "success": true,
  "chunksIndexed": 342
}
```

### Step 2: Check Health

Verify that RAG is ready:

```bash
curl http://localhost:8787/health
```

**Expected output:**
```json
{
  "status": "ok",
  "service": "vitamix-recommender",
  "rag": {
    "indexed": true,
    "chunks": 342
  }
}
```

### Step 3: Test RAG

Make a query using the streaming endpoint:

```bash
curl "http://localhost:8787/api/stream?query=best%20blender%20for%20smoothies&model=claude"
```

**What happens:**
1. Query embeddings are generated
2. Top 3 most relevant chunks are retrieved
3. Retrieved context is added to the LLM prompt
4. LLM generates response with factual product data
5. Blocks are assembled and streamed back

## File Structure

```
workers/vitamix-recommender/src/rag/
├── types.ts           # TypeScript type definitions
├── scraper.ts         # Product page scraping logic
├── chunking.ts        # Content chunking logic
├── embeddings.ts      # Embeddings integration (Workers AI + OpenAI fallback)
├── vector-store.ts    # In-memory vector store
├── retrieval.ts       # Context retrieval logic
├── indexer.ts         # Main indexing orchestration
└── index.ts           # Public API exports
```

## Key Concepts

### Chunking Strategy

Each product page is broken into multiple chunks:

1. **Overview chunk**: Title + description + price
2. **Feature chunks**: Individual features (one per chunk)
3. **Specs chunk**: All specifications combined
4. **Full chunk**: Complete product summary

This allows the retrieval system to match both broad queries ("best blender") and specific queries ("what's the motor power?").

### Retrieval Options

```typescript
interface RetrievalOptions {
  topK?: number;          // Number of results (default: 5)
  filter?: {              // Filter by chunk type
    type?: 'product' | 'feature' | 'spec' | 'review';
    productUrl?: string;  // Filter to specific product
  };
  minScore?: number;      // Minimum similarity score (default: 0.0)
}
```

### Similarity Scoring

The system uses **cosine similarity** to rank chunks:
- Score range: 0.0 to 1.0
- Higher is more similar
- Typical threshold: 0.5-0.6 for good matches

## Integration Points

### 1. Intent Classification

RAG enhances intent classification in `src/intent.ts`:

```typescript
// Before calling LLM, retrieve relevant context
const results = await retrieveContext(query, env, { topK: 3 });
const ragContext = formatContextForLLM(results);

// Augment system prompt with retrieved context
const enhancedPrompt = `${basePrompt}\n\n${ragContext}`;
```

### 2. Block Assembly

You can also use RAG directly in block assembly:

```typescript
import { retrieveContext, getProductRecommendations } from './rag';

// Get product recommendations based on query
const recommendations = await getProductRecommendations(query, env, 3);
```

## Limitations (POC)

This is a **Basic RAG POC** with the following limitations:

1. **In-memory storage**: Data is lost when worker restarts
2. **No persistence**: Must re-index after every restart
3. **Single-worker**: Doesn't scale across multiple workers
4. **Simple chunking**: Could be improved with overlapping chunks
5. **No reranking**: Uses pure cosine similarity

## Next Steps (Production)

To make this production-ready:

1. **Persistent Storage**: Use Cloudflare Vectorize or Pinecone
2. **Automatic Indexing**: Schedule periodic re-indexing
3. **Hybrid Search**: Combine semantic + keyword search
4. **Reranking**: Add a reranking model for better results
5. **Query Rewriting**: Improve query understanding
6. **Citation Tracking**: Show which chunks influenced the response
7. **A/B Testing**: Compare RAG vs. non-RAG performance

## Troubleshooting

### "Vector store is empty"

You need to index products first:
```bash
curl http://localhost:8787/api/index?limit=5
```

### "No embedding provider configured"

This means neither Workers AI nor OpenAI is available. Check:
1. Is the AI binding in wrangler.toml? (should be `[ai] binding = "AI"`)
2. Did you restart the worker after updating wrangler.toml?
3. If using OpenAI fallback, is the key in `.dev.vars`?

### Indexing is slow

Use the `limit` parameter for testing:
```bash
curl http://localhost:8787/api/index?limit=10
```

### Poor retrieval results

Adjust the `minScore` threshold in `retrieval.ts`:
```typescript
const results = await retrieveContext(query, env, {
  topK: 5,
  minScore: 0.4  // Lower = more permissive
});
```

## Embeddings Providers

The system supports two embedding providers with automatic fallback:

### 1. Cloudflare Workers AI (Default) ✅

**Model:** `@cf/baai/bge-base-en-v1.5` (BGE embeddings)
**Cost:** **FREE** - Included in Cloudflare Workers plan
**Performance:** Fast - Runs on edge network, low latency
**Quality:** High-quality 768-dimensional embeddings
**Setup:** Zero configuration - Already configured in `wrangler.toml`
**Limitations:** None for this use case

This is the **recommended option** and works out of the box!

### 2. OpenAI (Fallback)

**Model:** `text-embedding-3-small`
**Cost:** $0.02 per 1M tokens (~$0.003 per full index)
**Performance:** Requires external API call (slightly slower)
**Quality:** Excellent 1536-dimensional embeddings
**Setup:** Requires `OPENAI_API_KEY` in environment
**Use case:** Optional fallback if you prefer OpenAI embeddings

The system **automatically detects** which provider is available:
1. First tries Cloudflare Workers AI (if binding exists)
2. Falls back to OpenAI (if API key is configured)
3. Throws error if neither is available

### Provider Comparison

| Feature | Cloudflare Workers AI | OpenAI |
|---------|----------------------|--------|
| **Cost** | FREE ✅ | $0.02 per 1M tokens |
| **Speed** | Fast (edge) ✅ | Moderate (API call) |
| **Setup** | Zero config ✅ | Requires API key |
| **Quality** | High (768-dim) | Excellent (1536-dim) |
| **Best for** | POC & Production | High-precision needs |

**Recommendation:** Use Cloudflare Workers AI (default) for this POC. It's free, fast, and provides excellent quality for product recommendations.

## Testing

Test the system with various queries:

```bash
# Broad discovery
curl "http://localhost:8787/api/stream?query=help+me+find+a+blender"

# Specific product
curl "http://localhost:8787/api/stream?query=tell+me+about+the+Ascent+X5"

# Use case
curl "http://localhost:8787/api/stream?query=best+for+making+soups"

# Specs
curl "http://localhost:8787/api/stream?query=how+powerful+is+the+motor"
```

Compare responses with and without RAG to see the difference!

## Why Cloudflare Workers AI?

This implementation uses **Cloudflare Workers AI** for embeddings instead of requiring external services like OpenAI. Here's why:

### ✅ Zero Cost
- Included in Cloudflare Workers plan
- No per-request charges
- Perfect for POCs and production

### ✅ Zero Configuration
- No API keys to manage
- Already configured in `wrangler.toml`
- Works immediately when you run `npm run dev`

### ✅ Edge Performance
- Runs on Cloudflare's edge network
- Low latency (same network as your Worker)
- No external API calls needed

### ✅ High Quality
- BGE (BAAI General Embedding) model
- 768-dimensional embeddings
- State-of-the-art for semantic search

### ✅ Separation of Concerns
- **Embeddings:** Cloudflare Workers AI (semantic search)
- **Text Generation:** Your choice of Claude or Cerebras (responses)
- Each system uses the best tool for the job

### How It Works with Your Existing Stack

```
User Query: "best blender for smoothies"
    ↓
[1. Embedding] ← Cloudflare Workers AI (FREE)
    ↓
[2. Vector Search] ← Find top 3 relevant products
    ↓
[3. Context Assembly] ← "Ascent X5: powerful motor, pre-programmed..."
    ↓
[4. LLM Generation] ← Claude or Cerebras (your choice!)
    ↓
Response: "Based on your needs, I recommend the Ascent X5..."
```

**Key insight:** You don't need Claude or Cerebras for embeddings - they're text generation models. Cloudflare Workers AI provides specialized embedding models that work perfectly with your existing LLM setup.
