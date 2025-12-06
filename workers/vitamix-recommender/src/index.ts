/**
 * Vitamix Recommender Worker
 * SSE streaming endpoint for generative UI
 */

import type { Env, SessionContext, LLMModel } from './types';
import { classifyIntent, generateFollowUps, generateProactiveInsight } from './intent';
import { assembleBlock, assembleProactiveInsight } from './blocks';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Handle SSE stream request
 */
async function handleStream(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get('query') || url.searchParams.get('q') || '';
  const slug = url.searchParams.get('slug') || '';
  const contextParam = url.searchParams.get('ctx') || '';
  const stage = url.searchParams.get('stage') || 'exploring';
  const modelParam = url.searchParams.get('model') || 'claude';

  // Validate model parameter
  const model: LLMModel = modelParam === 'cerebras' ? 'cerebras' : 'claude';
  console.log(`[Worker] Using model: ${model}`);

  // Handle empty query - default to discovery mode
  const effectiveQuery = query || 'help me find the right Vitamix';

  // Parse session context if provided
  let sessionContext: SessionContext | null = null;
  if (contextParam) {
    try {
      const decoded = atob(decodeURIComponent(contextParam));
      sessionContext = JSON.parse(decoded);
    } catch (e) {
      console.warn('Failed to parse session context:', e);
    }
  }

  // Create SSE stream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Start async processing
  (async () => {
    try {
      // Send initial connection event
      await writer.write(encoder.encode(`event: connected\ndata: {"status":"connected"}\n\n`));

      // Classify intent
      console.log(`[Worker] Classifying intent for: "${effectiveQuery}"`);
      const intent = await classifyIntent(effectiveQuery, sessionContext, env, model);
      console.log(`[Worker] Intent: ${intent.primary}, Blocks: ${intent.suggestedBlocks.join(', ')}`);

      // Start generating follow-ups and insights in parallel with blocks
      const followUpsPromise = generateFollowUps(effectiveQuery, intent, sessionContext, env, model);
      const insightPromise = generateProactiveInsight(effectiveQuery, intent, sessionContext, env, model);

      // Filter out 'follow-up' block since we use conversation bar now
      const blocksToRender = intent.suggestedBlocks.filter((b) => b !== 'follow-up');

      // Generate and stream each block
      let blockCount = 0;
      for (const blockType of blocksToRender) {
        console.log(`[Worker] Assembling block: ${blockType}`);

        const blockData = await assembleBlock(blockType, intent, effectiveQuery, env);

        // Send block content event
        const eventData = JSON.stringify({
          blockType: blockData.blockType,
          html: blockData.html,
          sectionStyle: blockData.sectionStyle,
        });

        await writer.write(encoder.encode(`event: block-content\ndata: ${eventData}\n\n`));
        blockCount++;

        // Add proactive insight after the second content block (after hero + first content)
        if (blockCount === 2) {
          try {
            const insight = await insightPromise;
            if (insight) {
              console.log(`[Worker] Adding proactive insight: ${insight.type}`);
              const insightBlock = assembleProactiveInsight(insight);
              const insightEventData = JSON.stringify({
                blockType: insightBlock.blockType,
                html: insightBlock.html,
                sectionStyle: insightBlock.sectionStyle,
              });
              await writer.write(encoder.encode(`event: block-content\ndata: ${insightEventData}\n\n`));
            }
          } catch (e) {
            console.warn('[Worker] Insight generation failed:', e);
          }
        }

        // Small delay between blocks for visual effect
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Wait for follow-ups to complete
      let followUps: string[] = [];
      try {
        followUps = await followUpsPromise;
        console.log(`[Worker] Generated ${followUps.length} follow-up suggestions`);
      } catch (e) {
        console.warn('[Worker] Follow-up generation failed:', e);
      }

      // Send completion event with follow-ups
      const completeData = JSON.stringify({
        status: 'complete',
        intent: {
          primary: intent.primary,
          entities: intent.entities,
          journeyStage: intent.journeyStage,
        },
        followUps,
        slug,
        model,
      });
      await writer.write(encoder.encode(`event: generation-complete\ndata: ${completeData}\n\n`));
    } catch (error) {
      console.error('[Worker] Stream error:', error);
      const errorData = JSON.stringify({
        message: error instanceof Error ? error.message : 'An error occurred',
      });
      await writer.write(encoder.encode(`event: error\ndata: ${errorData}\n\n`));
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...corsHeaders,
    },
  });
}

/**
 * Handle health check
 */
function handleHealth(): Response {
  return new Response(JSON.stringify({ status: 'ok', service: 'vitamix-recommender' }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * Handle CORS preflight
 */
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Main fetch handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // Route requests
    switch (path) {
      case '/api/stream':
        return handleStream(request, env);
      case '/health':
      case '/':
        return handleHealth();
      default:
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }
  },
};
