/**
 * Block Assembly
 * Generates EDS-compatible HTML for each block type
 */

import type { BlockData, Intent, Product, Env } from './types';
import { products, useCases, features, productProfiles, recipes, reviews, getProductById, getProductsByPriceRange, searchProducts, getRecipesByCategory, getReviewsByProduct, getReviewsByUseCase, detectPersona, findRelevantBenefits, buildReasoningChain, type UserPersona, type ReasoningChain } from './content';

/**
 * Normalize use case ID (handle spaces, hyphens, etc.)
 */
function normalizeUseCase(useCase: string): string {
  return useCase.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
}

/**
 * Score a product based on user intent and context
 */
function scoreProduct(product: Product, intent: Intent, pricePreference?: string): number {
  let score = 0;
  const profile = productProfiles[product.id];

  if (!profile) return 0;

  // Score based on use cases (highest weight)
  for (const useCase of intent.entities.useCases) {
    const normalizedUseCase = normalizeUseCase(useCase);
    const useCaseScore = profile.useCaseScores[normalizedUseCase] || 0;
    score += useCaseScore * 10; // Use case match is worth up to 100 points
  }

  // Score based on price preference
  if (pricePreference === 'budget' || intent.entities.concerns.includes('price')) {
    if (profile.priceTier === 'budget') score += 50;
    else if (profile.priceTier === 'mid') score += 25;
    else score -= 20; // Penalize premium if budget-focused
  } else if (pricePreference === 'premium' || intent.entities.concerns.includes('premium')) {
    // Boost premium products for high-end queries
    if (profile.priceTier === 'premium') score += 60;
    else if (profile.priceTier === 'mid') score += 20;
    else score -= 30; // Penalize budget for premium-focused
  } else if (pricePreference === 'value') {
    if (profile.priceTier === 'mid') score += 40;
    else if (profile.priceTier === 'budget') score += 30;
  }

  // Bonus for matching use cases in bestFor
  for (const useCase of intent.entities.useCases) {
    const normalizedUseCase = normalizeUseCase(useCase);
    if (product.bestFor.includes(normalizedUseCase)) {
      score += 20;
    }
  }

  // Small bonus for products with programs if user seems to want convenience
  if (product.specs.programs && product.specs.programs > 0) {
    score += 5;
  }

  return score;
}

/**
 * Get the best product recommendation based on scoring
 */
function getBestProduct(intent: Intent, pricePreference?: string): { product: Product; reasoning: string } {
  // Score all products
  const scoredProducts = products.map((product) => ({
    product,
    score: scoreProduct(product, intent, pricePreference),
    profile: productProfiles[product.id],
  }));

  // Sort by score
  scoredProducts.sort((a, b) => b.score - a.score);

  const best = scoredProducts[0];

  // Generate reasoning based on why this product was selected
  let reasoning = '';

  if (intent.entities.useCases.length > 0) {
    const useCaseNames = intent.entities.useCases.map((uc) => normalizeUseCase(uc).replace(/-/g, ' ')).join(' and ');
    reasoning = `Best choice for ${useCaseNames}`;

    if (best.profile?.standoutFeatures.length > 0) {
      reasoning += ` with ${best.profile.standoutFeatures[0].toLowerCase()}`;
    }
  } else if (pricePreference === 'budget' || intent.entities.concerns.includes('price')) {
    reasoning = `Great value with essential Vitamix performance at an accessible price point`;
  } else {
    reasoning = best.profile?.standoutFeatures[0] || 'Our top recommendation for versatile blending';
  }

  return { product: best.product, reasoning };
}

/**
 * Get products for comparison based on context
 */
function getComparisonProducts(intent: Intent, pricePreference?: string): Product[] {
  // If specific products mentioned, use those
  if (intent.entities.products.length >= 2) {
    const mentioned = intent.entities.products
      .map((name) => products.find((p) =>
        p.name.toLowerCase().includes(name.toLowerCase()) ||
        p.id.toLowerCase().includes(name.toLowerCase())
      ))
      .filter((p): p is Product => p !== undefined);

    if (mentioned.length >= 2) return mentioned.slice(0, 3);
  }

  // Otherwise, pick products based on context
  if (pricePreference === 'budget' || intent.entities.concerns.includes('price')) {
    // Compare budget-friendly options
    return products
      .filter((p) => p.price < 550)
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);
  }

  // For use case queries, pick products that score well
  if (intent.entities.useCases.length > 0) {
    const scored = products.map((p) => ({ p, score: scoreProduct(p, intent, pricePreference) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map((s) => s.p);
  }

  // Default: compare across price tiers
  const budget = products.find((p) => productProfiles[p.id]?.priceTier === 'budget');
  const mid = products.find((p) => productProfiles[p.id]?.priceTier === 'mid');
  const premium = products.find((p) => productProfiles[p.id]?.priceTier === 'premium' && p.id !== 'ascent-x5-smartprep-kitchen-system');

  return [budget, mid, premium].filter((p): p is Product => p !== undefined);
}

/**
 * Generate a title for the hero block based on intent
 */
async function generateHeroTitle(query: string, intent: Intent, env: Env): Promise<string> {
  // For speed, use simple templates based on intent
  const titleTemplates: Record<string, string> = {
    discovery: "Let's Find Your Perfect Vitamix",
    comparison: 'Comparing Vitamix Blenders',
    'product-detail': 'Exploring the {product}',
    'use-case': 'The Best Vitamix for {useCase}',
    specs: 'Technical Specifications',
    reviews: 'What Customers Are Saying',
    price: 'Find the Right Vitamix for Your Budget',
    recommendation: 'Our Recommendation for You',
  };

  let title = titleTemplates[intent.primary] || "Let's Find Your Perfect Vitamix";

  // Replace placeholders
  if (intent.entities.products.length > 0) {
    title = title.replace('{product}', intent.entities.products[0]);
  }
  if (intent.entities.useCases.length > 0) {
    const useCase = intent.entities.useCases[0]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    title = title.replace('{useCase}', useCase);
  }

  return title;
}

/**
 * Assemble hero-question block
 */
async function assembleHeroQuestion(query: string, intent: Intent, env: Env): Promise<BlockData> {
  const title = await generateHeroTitle(query, intent, env);

  return {
    blockType: 'hero-question',
    html: `<div class="hero-question">
  <div><div>${title}</div></div>
  <div><div>${query}</div></div>
</div>`,
    sectionStyle: 'highlight',
  };
}

/**
 * Assemble needs-explorer block
 */
function assembleNeedsExplorer(): BlockData {
  const cards = useCases.slice(0, 6).map(
    (uc) => `<div>
    <div>${uc.name}</div>
    <div>${uc.description}</div>
    <div>${uc.id}</div>
  </div>`
  );

  return {
    blockType: 'needs-explorer',
    html: `<div class="needs-explorer">
  <div><div>What would you like to make?</div></div>
  ${cards.join('\n')}
</div>`,
    sectionStyle: 'default',
  };
}

/**
 * Assemble product-spotlight block
 */
function assembleProductSpotlight(intent: Intent): BlockData {
  let product: Product | undefined;
  let spotlight_reasoning = '';

  // First, check if a specific product was mentioned
  if (intent.entities.products.length > 0) {
    const productName = intent.entities.products[0].toLowerCase();
    product = products.find(
      (p) =>
        p.id.toLowerCase().includes(productName) ||
        p.name.toLowerCase().includes(productName) ||
        p.series.includes(productName)
    );
  }

  // Otherwise, use intelligent scoring
  if (!product) {
    const pricePreference = intent.entities.concerns.includes('price') ? 'budget' : undefined;
    const result = getBestProduct(intent, pricePreference);
    product = result.product;
    spotlight_reasoning = result.reasoning;
  }

  const priceHtml = product.originalPrice
    ? `<s>$${product.originalPrice}</s> $${product.price}`
    : `$${product.price}`;

  const featuresHtml = product.features.slice(0, 4).join(' | ');

  return {
    blockType: 'product-spotlight',
    html: `<div class="product-spotlight">
  <div><div><img src="${product.images.primary || ''}" alt="${product.name}"></div></div>
  <div><div>${product.name}</div></div>
  <div><div>${product.tagline || product.description}</div></div>
  <div><div>${priceHtml}</div></div>
  <div><div>${featuresHtml}</div></div>
  <div><div>${product.warranty || ''} warranty</div></div>
  <div><div><a href="${product.url}">Shop Now</a></div></div>
</div>`,
    sectionStyle: 'default',
  };
}

/**
 * Assemble comparison-table block
 */
function assembleComparisonTable(intent: Intent): BlockData {
  // Use intelligent product selection
  const pricePreference = intent.entities.concerns.includes('price') ? 'budget' : undefined;
  const compareProducts = getComparisonProducts(intent, pricePreference);

  // Build comparison table rows
  const headerRow = `<div>
  <div>Feature</div>
  ${compareProducts.map((p) => `<div>${p.name}</div>`).join('\n')}
</div>`;

  const priceRow = `<div>
  <div>Price</div>
  ${compareProducts.map((p) => `<div>$${p.price}</div>`).join('\n')}
</div>`;

  const warrantyRow = `<div>
  <div>Warranty</div>
  ${compareProducts.map((p) => `<div>${p.warranty || 'N/A'}</div>`).join('\n')}
</div>`;

  const programsRow = `<div>
  <div>Programs</div>
  ${compareProducts.map((p) => `<div>${p.specs.programs || 'Manual'}</div>`).join('\n')}
</div>`;

  const powerRow = `<div>
  <div>Motor Power</div>
  ${compareProducts.map((p) => `<div>${p.specs.watts || 'N/A'}W</div>`).join('\n')}
</div>`;

  const bestForRow = `<div>
  <div>Best For</div>
  ${compareProducts.map((p) => `<div>${p.bestFor.slice(0, 2).map((b) => b.replace(/-/g, ' ')).join(', ')}</div>`).join('\n')}
</div>`;

  return {
    blockType: 'comparison-table',
    html: `<div class="comparison-table">
  ${headerRow}
  ${priceRow}
  ${programsRow}
  ${powerRow}
  ${warrantyRow}
  ${bestForRow}
</div>`,
    sectionStyle: 'default',
  };
}

/**
 * Assemble feature-cards block
 */
function assembleFeatureCards(intent: Intent): BlockData {
  // Select relevant features based on use case
  let relevantFeatures = features;

  if (intent.entities.useCases.length > 0) {
    const useCase = useCases.find((uc) => uc.id === intent.entities.useCases[0]);
    if (useCase) {
      relevantFeatures = features.filter((f) =>
        useCase.relevantFeatures.some((rf) => f.name.toLowerCase().includes(rf.toLowerCase()))
      );
    }
  }

  if (relevantFeatures.length < 3) {
    relevantFeatures = features.slice(0, 4);
  }

  const cards = relevantFeatures.slice(0, 4).map(
    (f) => `<div>
  <div>${f.name}</div>
  <div>${f.description}</div>
  <div>${f.benefit}</div>
</div>`
  );

  return {
    blockType: 'feature-cards',
    html: `<div class="feature-cards">
  <div><div>Key Features</div></div>
  ${cards.join('\n')}
</div>`,
    sectionStyle: 'default',
  };
}

/**
 * Assemble price-comparison block
 */
function assemblePriceComparison(): BlockData {
  // Group by price tiers
  const sortedProducts = [...products].sort((a, b) => a.price - b.price);
  const tiers = [
    { name: 'Budget-Friendly', range: '$400-500', products: sortedProducts.filter((p) => p.price < 500) },
    { name: 'Mid-Range', range: '$500-700', products: sortedProducts.filter((p) => p.price >= 500 && p.price < 700) },
    { name: 'Premium', range: '$700+', products: sortedProducts.filter((p) => p.price >= 700) },
  ];

  const rows = tiers
    .filter((t) => t.products.length > 0)
    .map((tier) => {
      const topProduct = tier.products[0];
      return `<div>
  <div>${tier.name}</div>
  <div>${tier.range}</div>
  <div>${topProduct.name}</div>
  <div>$${topProduct.price}</div>
</div>`;
    });

  return {
    blockType: 'price-comparison',
    html: `<div class="price-comparison">
  <div><div>Find Your Price Range</div></div>
  ${rows.join('\n')}
</div>`,
    sectionStyle: 'default',
  };
}

/**
 * Assemble recommendation block with empathetic response structure
 * Structure: Validation -> Understanding -> Recommendation with reasoning -> Outcome visualization
 */
function assembleRecommendation(intent: Intent, query?: string): BlockData {
  // Use intelligent scoring to find the best product
  const pricePreference = intent.entities.concerns.includes('price') ? 'budget' : undefined;
  const { product, reasoning } = getBestProduct(intent, pricePreference);

  // Detect user persona for empathetic messaging
  const persona = detectPersona(query || '', intent.entities.concerns, intent.entities.useCases);
  const reasoningChain = buildReasoningChain(persona, product, intent.entities.useCases);

  // Build empathetic response components
  let validationHtml = '';
  let understandingHtml = '';
  let reasoningHtml = '';
  let visualizationHtml = '';

  if (persona) {
    // Validation: "I hear you, this is a real challenge"
    if (persona.effectiveMessaging.validationPhrases.length > 0) {
      validationHtml = `<div><div>validation</div><div>${persona.effectiveMessaging.validationPhrases[0]}</div></div>`;
    }
  }

  if (reasoningChain) {
    // Understanding + reasoning chain
    understandingHtml = `<div><div>understanding</div><div>You need ${reasoningChain.functionalBenefit.statement.toLowerCase()}. The ${product.name}'s ${reasoningChain.productFeature.name} delivers exactly that.</div></div>`;

    // Proof point
    reasoningHtml = `<div><div>proof</div><div>${reasoningChain.functionalBenefit.proofPoint}</div></div>`;

    // Visualization: "Imagine..."
    if (reasoningChain.emotionalOutcome.visualization) {
      visualizationHtml = `<div><div>visualization</div><div>${reasoningChain.emotionalOutcome.visualization}</div></div>`;
    }
  } else {
    // Fallback to standard reasoning
    let detailedReasoning = reasoning;
    const profile = productProfiles[product.id];

    if (profile) {
      if (profile.priceTier === 'budget') {
        detailedReasoning += ' — an excellent value at this price point.';
      } else if (profile.priceTier === 'premium' && !intent.entities.concerns.includes('price')) {
        detailedReasoning += ' — a premium investment for serious blending.';
      }
    }

    reasoningHtml = `<div><div>reasoning</div><div>${detailedReasoning}</div></div>`;
  }

  return {
    blockType: 'recommendation',
    html: `<div class="recommendation">
  <div><div>Our Recommendation</div></div>
  ${validationHtml}
  ${understandingHtml}
  <div><div><img src="${product.images.primary || ''}" alt="${product.name}"></div></div>
  <div><div>${product.name}</div></div>
  <div><div>$${product.price}</div></div>
  ${reasoningHtml}
  ${visualizationHtml}
  <div><div><a href="${product.url}">Shop ${product.name}</a></div></div>
</div>`,
    sectionStyle: 'highlight',
  };
}

/**
 * Assemble follow-up block with contextual suggestions
 */
function assembleFollowUp(intent: Intent): BlockData {
  const suggestions: string[] = [];

  // Add contextual follow-ups based on intent
  if (intent.primary === 'discovery') {
    suggestions.push('Compare top models', 'Show me budget options', 'What can I make with a Vitamix?');
  } else if (intent.primary === 'comparison') {
    suggestions.push('Tell me more about the X5', 'Which is best for smoothies?', 'Show me the differences in features');
  } else if (intent.primary === 'product-detail') {
    suggestions.push('Compare with other models', 'What recipes can I make?', 'Is this good for soups?');
  } else if (intent.primary === 'use-case') {
    suggestions.push('Which model is best?', 'Compare options', 'Show me recipes');
  } else if (intent.primary === 'price') {
    suggestions.push('What features do I get at each price?', 'Is the upgrade worth it?', 'Show me the best value');
  } else {
    suggestions.push('Compare other options', 'Tell me about warranties', 'What accessories are available?');
  }

  const chipRows = suggestions
    .slice(0, 3)
    .map((s) => `<div><div>${s}</div></div>`)
    .join('\n');

  return {
    blockType: 'follow-up',
    html: `<div class="follow-up">
  <div><div>What would you like to explore next?</div></div>
  ${chipRows}
</div>`,
    sectionStyle: 'default',
  };
}

/**
 * Assemble specs-table block
 */
function assembleSpecsTable(intent: Intent): BlockData {
  let product: Product;

  // First, check if a specific product was mentioned
  if (intent.entities.products.length > 0) {
    const found = products.find((p) =>
      p.name.toLowerCase().includes(intent.entities.products[0].toLowerCase()) ||
      p.id.toLowerCase().includes(intent.entities.products[0].toLowerCase())
    );
    if (found) {
      product = found;
    } else {
      // Fall back to intelligent selection
      const pricePreference = intent.entities.concerns.includes('price') ? 'budget' : undefined;
      product = getBestProduct(intent, pricePreference).product;
    }
  } else {
    // Use intelligent selection based on intent
    const pricePreference = intent.entities.concerns.includes('price') ? 'budget' : undefined;
    product = getBestProduct(intent, pricePreference).product;
  }

  return {
    blockType: 'specs-table',
    html: `<div class="specs-table">
  <div><div>${product.name} Specifications</div></div>
  <div><div>Motor Power</div><div>${product.specs.watts || 1800}W</div></div>
  <div><div>Container Capacity</div><div>${product.specs.capacity || '64oz'}</div></div>
  <div><div>Programs</div><div>${product.specs.programs || 'Variable Speed'}</div></div>
  <div><div>Warranty</div><div>${product.warranty || '10 years'}</div></div>
  <div><div>Series</div><div>${product.series.toUpperCase()}</div></div>
</div>`,
    sectionStyle: 'default',
  };
}

/**
 * Assemble recipe-suggestions block
 */
function assembleRecipeSuggestions(intent: Intent): BlockData {
  // Determine which category of recipes to show
  let category = 'smoothies'; // default

  if (intent.entities.useCases.length > 0) {
    const normalizedUseCase = normalizeUseCase(intent.entities.useCases[0]);
    // Map use cases to recipe categories
    const categoryMap: Record<string, string> = {
      'smoothies': 'smoothies',
      'soups': 'soups',
      'nut-butters': 'nut-butters',
      'frozen-desserts': 'frozen-desserts',
      'baby-food': 'baby-food',
      'meal-prep': 'meal-prep',
    };
    category = categoryMap[normalizedUseCase] || 'smoothies';
  }

  // Get recipes for this category
  let relevantRecipes = getRecipesByCategory(category);

  // Fallback to all recipes if none found
  if (relevantRecipes.length === 0) {
    relevantRecipes = recipes.slice(0, 4);
  }

  const categoryName = category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const recipeCards = relevantRecipes.slice(0, 4).map(
    (recipe) => `<div>
  <div>${recipe.name}</div>
  <div>${recipe.description}</div>
  <div>${recipe.time} | ${recipe.difficulty}</div>
  <div>${recipe.tip}</div>
</div>`
  );

  return {
    blockType: 'recipe-suggestions',
    html: `<div class="recipe-suggestions">
  <div><div>${categoryName} Recipes</div></div>
  <div><div>Try these recipes with your Vitamix</div></div>
  ${recipeCards.join('\n')}
</div>`,
    sectionStyle: 'default',
  };
}

/**
 * Assemble review-carousel block
 */
function assembleReviewCarousel(intent: Intent): BlockData {
  let relevantReviews = reviews;

  // Filter by product if one is mentioned
  if (intent.entities.products.length > 0) {
    const productName = intent.entities.products[0].toLowerCase();
    const product = products.find(
      (p) =>
        p.id.toLowerCase().includes(productName) ||
        p.name.toLowerCase().includes(productName)
    );
    if (product) {
      relevantReviews = getReviewsByProduct(product.id);
    }
  }

  // Filter by use case if no product match
  if (relevantReviews.length === 0 && intent.entities.useCases.length > 0) {
    const normalizedUseCase = normalizeUseCase(intent.entities.useCases[0]);
    relevantReviews = getReviewsByUseCase(normalizedUseCase);
  }

  // Fallback to all reviews
  if (relevantReviews.length === 0) {
    relevantReviews = reviews;
  }

  // Sort by rating (highest first)
  relevantReviews = [...relevantReviews].sort((a, b) => b.rating - a.rating);

  const reviewCards = relevantReviews.slice(0, 4).map((review) => {
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const product = getProductById(review.productId);
    return `<div>
  <div>${stars}</div>
  <div>${review.title}</div>
  <div>${review.content}</div>
  <div>${review.author}${review.verifiedPurchase ? ' ✓ Verified' : ''}</div>
  <div>${product?.name || ''}</div>
</div>`;
  });

  return {
    blockType: 'review-carousel',
    html: `<div class="review-carousel">
  <div><div>What Customers Are Saying</div></div>
  ${reviewCards.join('\n')}
</div>`,
    sectionStyle: 'default',
  };
}

/**
 * Assemble proactive-insight block
 */
export function assembleProactiveInsight(insight: { insight: string; type: string }): BlockData {
  return {
    blockType: 'proactive-insight',
    html: `<div class="proactive-insight">
  <div><div>${insight.type}</div></div>
  <div><div>${insight.insight}</div></div>
</div>`,
    sectionStyle: 'default',
  };
}

/**
 * Main block assembly function
 */
export async function assembleBlock(
  blockType: string,
  intent: Intent,
  query: string,
  env: Env
): Promise<BlockData> {
  switch (blockType) {
    case 'hero-question':
      return assembleHeroQuestion(query, intent, env);
    case 'needs-explorer':
      return assembleNeedsExplorer();
    case 'product-spotlight':
      return assembleProductSpotlight(intent);
    case 'comparison-table':
      return assembleComparisonTable(intent);
    case 'feature-cards':
      return assembleFeatureCards(intent);
    case 'specs-table':
      return assembleSpecsTable(intent);
    case 'price-comparison':
      return assemblePriceComparison();
    case 'recommendation':
      return assembleRecommendation(intent, query);
    case 'follow-up':
      return assembleFollowUp(intent);
    case 'recipe-suggestions':
      return assembleRecipeSuggestions(intent);
    case 'review-carousel':
      return assembleReviewCarousel(intent);
    default:
      // Fallback
      return {
        blockType,
        html: `<div class="${blockType}"><div><div>Content coming soon</div></div></div>`,
        sectionStyle: 'default',
      };
  }
}
