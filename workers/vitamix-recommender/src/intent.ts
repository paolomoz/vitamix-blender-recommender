/**
 * Intent Classification using LLM (Cerebras or Claude)
 * Enhanced with empathetic reasoning and persona detection
 */

import type { Env, Intent, SessionContext, LLMModel } from './types';
import { detectPersona, findObjectionResponse, userPersonas, objectionLibrary, type UserPersona } from './content';
import { callLLM, parseJsonFromResponse } from './llm';

const INTENT_SYSTEM_PROMPT = `You are an intent classifier for a Vitamix blender recommendation system.
Analyze the user's query and return a JSON object with the following structure:

{
  "primary": "<one of: discovery, comparison, product-detail, use-case, specs, reviews, price, recommendation>",
  "entities": {
    "products": ["<product names or series mentioned>"],
    "useCases": ["<use cases like smoothies, soups, nut-butters, meal-prep>"],
    "concerns": ["<concerns like price, power, size, noise, warranty>"]
  },
  "journeyStage": "<one of: exploring, comparing, deciding>",
  "suggestedBlocks": ["<3 block types in order>"]
}

Intent types:
- discovery: User is exploring, doesn't know what they want
- comparison: User wants to compare multiple products
- product-detail: User asks about a specific product
- use-case: User asks about specific use cases (smoothies, soups, etc.)
- specs: User wants technical specifications
- reviews: User wants customer feedback
- price: User is price-focused
- recommendation: User wants a specific recommendation

Block types available:
- hero-question: Opening hero with the query
- needs-explorer: Cards showing use case options
- product-spotlight: Single product highlight
- comparison-table: Side-by-side comparison
- feature-cards: Feature benefit cards
- specs-table: Technical specifications
- review-carousel: Customer testimonials
- recipe-suggestions: Recipe cards
- price-comparison: Price-focused view
- recommendation: Final recommendation with CTA
- follow-up: Suggested next questions

Always include hero-question as first block. Pick 2 more blocks that best serve the intent.
For exploring: hero-question, needs-explorer, follow-up
For comparing: hero-question, comparison-table, recommendation
For product questions: hero-question, product-spotlight, specs-table
For use cases: hero-question, feature-cards, product-spotlight
For price focus: hero-question, price-comparison, recommendation

Return ONLY valid JSON, no explanation.`;

export async function classifyIntent(
  query: string,
  context: SessionContext | null,
  env: Env,
  model: LLMModel = 'cerebras'
): Promise<Intent> {
  // Determine journey stage from context
  // Note: Context is encoded with 'q' for queries and 'p' for profile
  let contextHint = '';
  const queries = context?.q || context?.queries;
  if (queries && queries.length > 0) {
    const queryCount = queries.length;
    if (queryCount <= 2) {
      contextHint = 'User is early in their journey, still exploring.';
    } else if (queryCount <= 5) {
      contextHint = 'User has asked several questions, likely comparing options.';
    } else {
      contextHint = 'User has been exploring extensively, may be ready to decide.';
    }
  }

  const userMessage = contextHint
    ? `Previous context: ${contextHint}\n\nCurrent query: "${query}"`
    : `Query: "${query}"`;

  try {
    const response = await callLLM(
      {
        systemPrompt: INTENT_SYSTEM_PROMPT,
        userMessage,
        temperature: 0.1,
        maxTokens: 500,
      },
      model,
      env
    );

    const content = response.content;
    console.log(`[Intent] Using ${response.model} model`);

    // Parse JSON from response
    const intent = parseJsonFromResponse<Intent>(content);
    if (intent) {
      // Validate and fix if needed
      if (!intent.suggestedBlocks || intent.suggestedBlocks.length === 0) {
        intent.suggestedBlocks = ['hero-question', 'needs-explorer', 'follow-up'];
      }
      if (!intent.suggestedBlocks.includes('hero-question')) {
        intent.suggestedBlocks.unshift('hero-question');
      }

      // Post-processing: Override for queries that LLM might misclassify
      const lowerQuery = query.toLowerCase();

      // Premium queries
      if (lowerQuery.includes('premium') || lowerQuery.includes('high-end') || lowerQuery.includes('high end') || lowerQuery.includes('top of the line') || lowerQuery.includes('luxury') || lowerQuery.includes('best quality')) {
        intent.primary = 'recommendation';
        intent.entities.concerns = ['premium'];
        intent.journeyStage = 'deciding';
        intent.suggestedBlocks = ['hero-question', 'product-spotlight', 'specs-table'];
      }

      // "Worth it" queries -> reviews
      if (lowerQuery.includes('worth it') || lowerQuery.includes('worth the money') || lowerQuery.includes('worth buying')) {
        intent.primary = 'reviews';
        intent.suggestedBlocks = ['hero-question', 'review-carousel', 'recommendation'];
      }

      // Touchscreen queries -> comparison (both X4 and X5 have it)
      if (lowerQuery.includes('touchscreen') || lowerQuery.includes('touch screen')) {
        intent.primary = 'comparison';
        intent.entities.products = ['ascent-x5', 'ascent-x4'];
        intent.entities.concerns = ['touchscreen'];
        intent.suggestedBlocks = ['hero-question', 'comparison-table', 'recommendation'];
      }

      // Discovery queries - show needs-explorer for help/choose type questions
      if ((lowerQuery.includes('help') && lowerQuery.includes('choose')) ||
          (lowerQuery.includes('help') && lowerQuery.includes('find')) ||
          (lowerQuery.includes('help') && lowerQuery.includes('pick')) ||
          lowerQuery === 'help me find the right vitamix') {
        intent.primary = 'discovery';
        intent.journeyStage = 'exploring';
        intent.suggestedBlocks = ['hero-question', 'needs-explorer', 'follow-up'];
      }

      return intent;
    }

    return getDefaultIntent(query);
  } catch (error) {
    console.error('Intent classification error:', error);
    return getDefaultIntent(query);
  }
}

function getDefaultIntent(query: string): Intent {
  // Simple keyword-based fallback
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('compare') || lowerQuery.includes('vs') || lowerQuery.includes('difference')) {
    return {
      primary: 'comparison',
      entities: { products: [], useCases: [], concerns: [] },
      journeyStage: 'comparing',
      suggestedBlocks: ['hero-question', 'comparison-table', 'recommendation'],
    };
  }

  if (lowerQuery.includes('price') || lowerQuery.includes('budget') || lowerQuery.includes('cheap') || lowerQuery.includes('affordable')) {
    return {
      primary: 'price',
      entities: { products: [], useCases: [], concerns: ['price'] },
      journeyStage: 'comparing',
      suggestedBlocks: ['hero-question', 'price-comparison', 'recommendation'],
    };
  }

  if (lowerQuery.includes('premium') || lowerQuery.includes('high-end') || lowerQuery.includes('high end') || lowerQuery.includes('top of the line') || lowerQuery.includes('luxury') || lowerQuery.includes('best quality')) {
    return {
      primary: 'recommendation',
      entities: { products: [], useCases: [], concerns: ['premium'] },
      journeyStage: 'deciding',
      suggestedBlocks: ['hero-question', 'product-spotlight', 'specs-table'],
    };
  }

  // Recipe queries - detect before use-case so "smoothie recipes" goes to recipes not use-case
  if (lowerQuery.includes('recipe') || lowerQuery.includes('how to make') || lowerQuery.includes('ideas')) {
    return {
      primary: 'use-case',
      entities: { products: [], useCases: [extractUseCase(lowerQuery)], concerns: [] },
      journeyStage: 'exploring',
      suggestedBlocks: ['hero-question', 'recipe-suggestions', 'product-spotlight'],
    };
  }

  if (lowerQuery.includes('smoothie') || lowerQuery.includes('soup') || lowerQuery.includes('nut butter') || lowerQuery.includes('baby food')) {
    return {
      primary: 'use-case',
      entities: { products: [], useCases: [extractUseCase(lowerQuery)], concerns: [] },
      journeyStage: 'exploring',
      suggestedBlocks: ['hero-question', 'feature-cards', 'product-spotlight'],
    };
  }

  // Feature queries - touchscreen, programs, self-cleaning, variable speed
  if (lowerQuery.includes('touchscreen') || lowerQuery.includes('touch screen')) {
    return {
      primary: 'comparison',
      entities: { products: ['ascent-x5', 'ascent-x4'], useCases: [], concerns: ['touchscreen'] },
      journeyStage: 'comparing',
      suggestedBlocks: ['hero-question', 'comparison-table', 'recommendation'],
    };
  }

  if (lowerQuery.includes('program') || lowerQuery.includes('preset')) {
    return {
      primary: 'specs',
      entities: { products: [], useCases: [], concerns: ['programs'] },
      journeyStage: 'comparing',
      suggestedBlocks: ['hero-question', 'specs-table', 'comparison-table'],
    };
  }

  if (lowerQuery.includes('self-clean') || lowerQuery.includes('self clean') || lowerQuery.includes('cleaning')) {
    return {
      primary: 'specs',
      entities: { products: [], useCases: [], concerns: ['cleaning'] },
      journeyStage: 'exploring',
      suggestedBlocks: ['hero-question', 'feature-cards', 'product-spotlight'],
    };
  }

  if (lowerQuery.includes('variable speed') || lowerQuery.includes('speed control')) {
    return {
      primary: 'specs',
      entities: { products: [], useCases: [], concerns: ['speed'] },
      journeyStage: 'exploring',
      suggestedBlocks: ['hero-question', 'feature-cards', 'product-spotlight'],
    };
  }

  // Product-specific queries (check before reviews to not catch "5200 worth it" as review)
  if (lowerQuery.includes('x5') || lowerQuery.includes('x4') || lowerQuery.includes('x3') || lowerQuery.includes('x2') || lowerQuery.includes('5200') || lowerQuery.includes('explorian')) {
    // But if it's a "worth it" question, treat as review
    if (lowerQuery.includes('worth it') || lowerQuery.includes('review')) {
      return {
        primary: 'reviews',
        entities: { products: [extractProductName(lowerQuery)], useCases: [], concerns: [] },
        journeyStage: 'comparing',
        suggestedBlocks: ['hero-question', 'review-carousel', 'recommendation'],
      };
    }
    return {
      primary: 'product-detail',
      entities: { products: [extractProductName(lowerQuery)], useCases: [], concerns: [] },
      journeyStage: 'comparing',
      suggestedBlocks: ['hero-question', 'product-spotlight', 'specs-table'],
    };
  }

  // Generic review queries (without product mentioned)
  if (lowerQuery.includes('review') || lowerQuery.includes('what do people') || lowerQuery.includes('customer')) {
    return {
      primary: 'reviews',
      entities: { products: [], useCases: [], concerns: [] },
      journeyStage: 'comparing',
      suggestedBlocks: ['hero-question', 'review-carousel', 'recommendation'],
    };
  }

  if (lowerQuery.includes('recommend') || lowerQuery.includes('which')) {
    return {
      primary: 'recommendation',
      entities: { products: [], useCases: [], concerns: [] },
      journeyStage: 'deciding',
      suggestedBlocks: ['hero-question', 'recommendation', 'follow-up'],
    };
  }

  // Discovery queries
  if (lowerQuery.includes('help') || lowerQuery.includes('choose') || lowerQuery.includes('find') || lowerQuery.includes('looking for')) {
    return {
      primary: 'discovery',
      entities: { products: [], useCases: [], concerns: [] },
      journeyStage: 'exploring',
      suggestedBlocks: ['hero-question', 'needs-explorer', 'follow-up'],
    };
  }

  // Default: discovery
  return {
    primary: 'discovery',
    entities: { products: [], useCases: [], concerns: [] },
    journeyStage: 'exploring',
    suggestedBlocks: ['hero-question', 'needs-explorer', 'follow-up'],
  };
}

function extractUseCase(query: string): string {
  if (query.includes('smoothie')) return 'smoothies';
  if (query.includes('soup')) return 'soups';
  if (query.includes('nut butter')) return 'nut-butters';
  if (query.includes('baby food')) return 'baby-food';
  if (query.includes('frozen') || query.includes('ice cream')) return 'frozen-desserts';
  if (query.includes('meal prep')) return 'meal-prep';
  return 'general';
}

function extractProductName(query: string): string {
  if (query.includes('x5')) return 'ascent-x5';
  if (query.includes('x4')) return 'ascent-x4';
  if (query.includes('x3')) return 'ascent-x3';
  if (query.includes('x2')) return 'ascent-x2';
  if (query.includes('5200')) return '5200';
  if (query.includes('explorian') || query.includes('e310')) return 'explorian';
  return '';
}

const FOLLOW_UP_PROMPT = `You are a helpful Vitamix expert generating follow-up questions.
Based on the conversation context, generate 2-4 natural follow-up questions the user would likely ask next.

IMPORTANT:
- Make questions specific to their situation, not generic
- Include any product names they've discussed
- Reference their concerns or use cases
- Vary the phrasing (conversational, not robotic)
- Keep each question under 40 characters

Return ONLY a JSON array of strings, no explanation. Example:
["How does X5 handle ice?", "What about the warranty?", "Show me recipes"]`;

const PROACTIVE_INSIGHT_PROMPT = `You are an empathetic Vitamix consultant who understands people, not just products.
Based on the user's query and emotional context, suggest ONE valuable insight that addresses their deeper needs.

EMPATHETIC INSIGHT FRAMEWORK:
1. First understand what they REALLY want (the emotional outcome, not the product)
2. Then offer an insight that validates their situation and provides unexpected value

Categories of insights:
- validation: Acknowledge their situation ("You're not alone - this is the #1 reason parents buy Vitamix")
- peace-of-mind: Address hidden fears ("10-year warranty means no buyer's remorse")
- visualization: Help them see success ("Imagine kids asking for seconds on a green smoothie")
- proof-point: Credible evidence ("Same blenders used in Jamba Juice")
- solution: Direct problem-solving ("Self-cleaning in 60 seconds - you'll actually use it daily")

Return a JSON object with:
{
  "insight": "The empathetic insight (1-2 sentences, speaks to their emotional need)",
  "type": "validation|peace-of-mind|visualization|proof-point|solution"
}

Return ONLY valid JSON, no explanation.`;

/**
 * Generate smart follow-up suggestions based on conversation context
 */
export async function generateFollowUps(
  query: string,
  intent: Intent,
  context: SessionContext | null,
  env: Env,
  model: LLMModel = 'cerebras'
): Promise<string[]> {
  // Build context message
  const profile = context?.p || {};
  const previousQueries = context?.q?.map((q: { t: string }) => q.t).join(', ') || '';

  const contextMessage = `
User's current query: "${query}"
Intent: ${intent.primary}
Products discussed: ${intent.entities.products.join(', ') || profile.products?.join(', ') || 'none'}
Use cases: ${intent.entities.useCases.join(', ') || profile.uses?.join(', ') || 'none'}
Concerns: ${intent.entities.concerns.join(', ') || profile.concerns?.join(', ') || 'none'}
Price preference: ${profile.price || 'unknown'}
Journey stage: ${intent.journeyStage}
Previous queries: ${previousQueries || 'first query'}
`;

  try {
    const response = await callLLM(
      {
        systemPrompt: FOLLOW_UP_PROMPT,
        userMessage: contextMessage,
        temperature: 0.7,
        maxTokens: 200,
      },
      model,
      env
    );

    const content = response.content;

    // Parse JSON array from response
    const followUps = parseJsonFromResponse<string[]>(content);
    if (followUps && Array.isArray(followUps)) {
      return followUps.slice(0, 4);
    }

    return getDefaultFollowUps(intent);
  } catch (error) {
    console.error('Follow-up generation error:', error);
    return getDefaultFollowUps(intent);
  }
}

/**
 * Generate a proactive insight based on context
 * Enhanced with empathetic persona detection
 */
export async function generateProactiveInsight(
  query: string,
  intent: Intent,
  context: SessionContext | null,
  env: Env,
  model: LLMModel = 'cerebras'
): Promise<{ insight: string; type: string } | null> {
  const profile = context?.p || {};

  // Detect user persona for empathetic messaging
  const persona = detectPersona(query, intent.entities.concerns, intent.entities.useCases);
  const objection = findObjectionResponse(query);

  // Build empathetic context message
  let emotionalContext = '';
  if (persona) {
    emotionalContext = `
Detected persona: ${persona.name}
Their frustrations: ${persona.emotionalState.frustrations.join(', ')}
Their hopes: ${persona.emotionalState.hopes.join(', ')}
What resonates with them: ${persona.effectiveMessaging.benefitEmphasis.slice(0, 2).join('; ')}
Example visualization that works: ${persona.effectiveMessaging.visualizations[0] || ''}`;
  }

  if (objection) {
    emotionalContext += `
Possible objection detected: ${objection.objectionId}
Consider addressing: ${objection.variations[0]?.response.slice(0, 100)}...`;
  }

  const contextMessage = `
User's query: "${query}"
Intent: ${intent.primary}
Products: ${intent.entities.products.join(', ') || 'general browsing'}
Use cases: ${intent.entities.useCases.join(', ') || 'unknown'}
Concerns: ${intent.entities.concerns.join(', ') || 'none mentioned'}
Price preference: ${profile.price || 'unknown'}
${emotionalContext}`;

  try {
    const response = await callLLM(
      {
        systemPrompt: PROACTIVE_INSIGHT_PROMPT,
        userMessage: contextMessage,
        temperature: 0.8,
        maxTokens: 150,
      },
      model,
      env
    );

    const content = response.content;

    // Parse JSON from response
    const insight = parseJsonFromResponse<{ insight: string; type: string }>(content);
    if (insight) {
      return insight;
    }

    return getDefaultInsight(intent, query);
  } catch (error) {
    console.error('Insight generation error:', error);
    return getDefaultInsight(intent, query);
  }
}

function getDefaultFollowUps(intent: Intent): string[] {
  switch (intent.primary) {
    case 'discovery':
      return ['Compare top models', 'Show budget options', "What can I make?"];
    case 'comparison':
      return ['Which is best for me?', 'Show full specs', 'What about warranty?'];
    case 'product-detail':
      return ['Compare with others', 'See recipes', 'Show accessories'];
    case 'use-case':
      return ['Which model is best?', 'Compare options', 'Show me recipes'];
    case 'price':
      return ['What do I lose at lower prices?', 'Best value pick?', 'Refurbished options?'];
    case 'recommendation':
      return ['Tell me more', 'Any alternatives?', 'What accessories?'];
    default:
      return ['Compare models', 'Show recommendations', 'Help me decide'];
  }
}

function getDefaultInsight(intent: Intent, query?: string): { insight: string; type: string } | null {
  // Try to detect persona for empathetic default insights
  const persona = query ? detectPersona(query, intent.entities.concerns, intent.entities.useCases) : null;

  // If we detected a persona, use their tailored messaging
  if (persona) {
    // Pick a visualization or benefit emphasis based on persona
    const visualizations = persona.effectiveMessaging.visualizations;
    const proofPoints = persona.effectiveMessaging.proofPoints;

    if (visualizations.length > 0) {
      return {
        insight: visualizations[0],
        type: 'visualization',
      };
    }
    if (proofPoints.length > 0) {
      return {
        insight: proofPoints[0],
        type: 'proof-point',
      };
    }
  }

  // Check for objection in query for tailored response
  const objection = query ? findObjectionResponse(query) : null;
  if (objection && objection.variations.length > 0) {
    return {
      insight: objection.variations[0].response.slice(0, 120) + '...',
      type: 'peace-of-mind',
    };
  }

  // Return empathetic contextual default insights
  switch (intent.primary) {
    case 'price':
      return {
        insight: "You're right to think carefully about this investment. At 15-20 years of daily use, it works out to less than 10 cents per smoothie.",
        type: 'peace-of-mind',
      };
    case 'use-case':
      if (intent.entities.useCases.includes('smoothies')) {
        return {
          insight: "The same blenders used in Jamba Juice - that's why their smoothies are so perfectly smooth.",
          type: 'proof-point',
        };
      }
      if (intent.entities.useCases.includes('soups')) {
        return {
          insight: 'Imagine coming home on a cold day to fresh tomato soup - ready in 6 minutes, no stove needed.',
          type: 'visualization',
        };
      }
      return {
        insight: 'Self-cleaning in 60 seconds means you\'ll actually use it daily - no dreading the cleanup.',
        type: 'solution',
      };
    case 'comparison':
      return {
        insight: 'Most Vitamix owners report using it 4+ times per week. The low friction makes it part of daily life.',
        type: 'proof-point',
      };
    case 'reviews':
      return {
        insight: "You're not alone in wanting to be sure. 70% of owners report it exceeds expectations.",
        type: 'validation',
      };
    default:
      return {
        insight: 'Vitamix offers a risk-free 60-day home trial - try it in your kitchen before committing.',
        type: 'peace-of-mind',
      };
  }
}
