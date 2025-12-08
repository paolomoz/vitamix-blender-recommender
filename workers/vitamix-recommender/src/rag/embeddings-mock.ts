/**
 * Mock Embeddings for Local Testing
 * No API keys required - uses deterministic text hashing
 *
 * NOTE: This is for TESTING ONLY. Not production quality.
 * For production, use Cloudflare Workers AI, OpenAI, or Cohere.
 */

/**
 * Simple hash function to convert string to number
 */
function simpleHash(str: string, seed: number = 0): number {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Generate a deterministic "embedding" vector from text
 * Uses multiple hash functions with different seeds to create a vector
 *
 * This is NOT a real semantic embedding, but it will:
 * - Be deterministic (same text = same vector)
 * - Have some basic similarity properties (similar words = somewhat similar vectors)
 * - Allow testing the RAG pipeline without API keys
 */
export function generateMockEmbedding(text: string, dimensions: number = 384): number[] {
  const normalized = text.toLowerCase().trim();
  const embedding: number[] = [];

  // Generate vector using multiple hash seeds
  for (let i = 0; i < dimensions; i++) {
    // Use sliding windows of the text with different seeds
    const windowSize = 5;
    let sum = 0;

    // Hash different parts of the text
    for (let j = 0; j < normalized.length; j += windowSize) {
      const chunk = normalized.substring(j, j + windowSize);
      const hash = simpleHash(chunk, i);
      sum += hash;
    }

    // Add character frequency features
    const charCode = i < normalized.length ? normalized.charCodeAt(i) : 0;
    sum += charCode * (i + 1);

    // Add word-level features
    const words = normalized.split(/\s+/);
    if (words.length > 0) {
      const wordIndex = i % words.length;
      sum += simpleHash(words[wordIndex], i);
    }

    // Normalize to [-1, 1] range
    const normalized_value = (sum % 2000 - 1000) / 1000;
    embedding.push(normalized_value);
  }

  // Normalize the vector (make it unit length)
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] = embedding[i] / magnitude;
    }
  }

  return embedding;
}

/**
 * Batch generate mock embeddings
 */
export async function generateMockEmbeddings(
  texts: string[],
  dimensions: number = 384
): Promise<number[][]> {
  // Simulate some async delay to mimic API behavior
  await new Promise(resolve => setTimeout(resolve, 10));

  return texts.map(text => generateMockEmbedding(text, dimensions));
}

/**
 * Test the quality of mock embeddings
 */
export function testMockEmbeddings(): void {
  const tests = [
    { text: 'blender for smoothies', similar: 'smoothie maker', different: 'database server' },
    { text: 'powerful motor', similar: 'strong engine', different: 'touchscreen display' },
    { text: 'easy to clean', similar: 'simple cleanup', different: 'expensive price' },
  ];

  console.log('[Mock Embeddings] Testing similarity...');

  for (const test of tests) {
    const emb1 = generateMockEmbedding(test.text);
    const emb2 = generateMockEmbedding(test.similar);
    const emb3 = generateMockEmbedding(test.different);

    const sim12 = cosineSimilarity(emb1, emb2);
    const sim13 = cosineSimilarity(emb1, emb3);

    console.log(`"${test.text}" vs "${test.similar}": ${sim12.toFixed(3)}`);
    console.log(`"${test.text}" vs "${test.different}": ${sim13.toFixed(3)}`);
    console.log(`Similar > Different: ${sim12 > sim13 ? '✓' : '✗'}`);
    console.log('---');
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
