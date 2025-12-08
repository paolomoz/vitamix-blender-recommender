# Quick Start Guide - Vitamix RAG System

## TL;DR - Get Running in 3 Minutes

```bash
# 1. Start the worker
cd workers/vitamix-recommender
npm run dev

# 2. Index products (in another terminal)
curl http://localhost:8787/api/index?limit=10

# 3. Test it!
curl "http://localhost:8787/api/stream?query=best+blender+for+smoothies&model=claude"
```

## What Just Happened?

1. **Started the worker** - Now running on localhost:8787
2. **Indexed 10 products** - Scraped from Vitamix.com, embedded with Cloudflare Workers AI
3. **Made a RAG-enhanced query** - LLM now has real product context!

## System Requirements

✅ **Already configured for you:**
- Cloudflare Workers AI (FREE embeddings - no API key needed!)
- Cerebras or Claude for text generation (keys already set)

✅ **No additional setup needed** - Just run!

## Understanding the Flow

```
User Query
    ↓
[Embedding] ← Cloudflare Workers AI (FREE!)
    ↓
[Vector Search] ← In-memory store
    ↓
[Top 3 Results] → "Ascent X5: Best for smoothies..."
    ↓
[LLM Prompt] ← Claude/Cerebras + Retrieved Context
    ↓
[Response] → Factual, grounded recommendations
```

## Key Commands

```bash
# Check health & RAG status
curl http://localhost:8787/health

# Index all 68 products (takes ~5 min)
curl http://localhost:8787/api/index

# Index just 10 for testing (takes ~30 sec)
curl http://localhost:8787/api/index?limit=10

# Test with Claude
curl "http://localhost:8787/api/stream?query=YOUR_QUERY&model=claude"

# Test with Cerebras
curl "http://localhost:8787/api/stream?query=YOUR_QUERY&model=cerebras"
```

## What Makes This Different?

**Without RAG (old way):**
- LLM uses generic knowledge
- Hardcoded product data in TypeScript
- May give outdated info

**With RAG (new way):**
- LLM retrieves real product pages
- Always up-to-date with Vitamix.com
- Grounded in facts, not hallucinations

## Example Queries to Try

```bash
# Discovery
curl "http://localhost:8787/api/stream?query=help+me+find+a+blender"

# Specific use case
curl "http://localhost:8787/api/stream?query=best+for+making+hot+soups"

# Product comparison
curl "http://localhost:8787/api/stream?query=compare+Ascent+X5+and+X4"

# Technical specs
curl "http://localhost:8787/api/stream?query=what+is+the+motor+power"

# Price conscious
curl "http://localhost:8787/api/stream?query=most+affordable+option"
```

## Toggle Between Claude & Cerebras

The system respects the `model` parameter:

```bash
# Use Claude (higher quality, slower)
?model=claude

# Use Cerebras (faster, cheaper)
?model=cerebras
```

The frontend already has UI to toggle between these!

## What Files Changed?

**New RAG system:**
- `src/rag/` - 7 new modules for RAG
- `src/intent.ts` - Enhanced with RAG retrieval
- `src/index.ts` - Added `/api/index` endpoint
- `wrangler.toml` - Added AI binding

**Key insight:** We're using Cloudflare Workers AI for embeddings (FREE!), while keeping your existing Claude/Cerebras for text generation.

## Common Questions

**Q: Do I need OpenAI?**
A: No! We use Cloudflare Workers AI (free).

**Q: Can I use Cerebras or Claude for embeddings?**
A: No - they don't have embedding models. But you already have them for text generation, and we use Cloudflare Workers AI for embeddings.

**Q: What if the worker restarts?**
A: You'll need to re-index (in-memory store). For production, use Cloudflare Vectorize for persistence.

**Q: How long does indexing take?**
A: ~30 seconds for 10 products, ~5 minutes for all 68.

**Q: Does this work with the frontend model toggle?**
A: Yes! The frontend already sends `?model=claude` or `?model=cerebras`. RAG works with both.

## Next Steps

1. ✅ Test basic queries
2. ✅ Compare RAG vs non-RAG responses
3. ✅ Index all 68 products
4. ✅ Try different model combinations
5. 📊 Monitor retrieval quality

## Need Help?

See the full documentation in `RAG-README.md`
