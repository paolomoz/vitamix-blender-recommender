/**
 * Generative UI Scripts
 *
 * Handles SSE streaming from worker, block rendering, and session context.
 * Adapted from materialised-web cerebras-scripts.js
 */

import {
  decorateBlock,
  loadBlock,
  decorateButtons,
  decorateIcons,
  loadCSS,
} from './aem.js';

// Worker URL (use localhost for development)
const WORKER_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8787'
  : 'https://vitamix-recommender.paolo-moz.workers.dev';

// Store original block data for publishing
let originalBlocksData = [];

/**
 * Generate a URL-safe slug from a query
 */
function generateSlug(query) {
  let slug = query
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);

  const hash = simpleHash(query + Date.now()).slice(0, 6);
  return `${slug}-${hash}`;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash &= hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Session Context Manager
 * Tracks conversation state, user profile, and journey progress
 */
class SessionContextManager {
  static STORAGE_KEY = 'vitamix-session';
  static MODEL_KEY = 'vitamix-model';
  static RAG_KEY = 'vitamix-rag';
  static MAX_QUERIES = 10;

  /**
   * Get the selected LLM model (persisted in sessionStorage)
   * Default is 'claude' for new sessions
   */
  static getModel() {
    try {
      return sessionStorage.getItem(this.MODEL_KEY) || 'claude';
    } catch {
      return 'claude';
    }
  }

  /**
   * Set the LLM model (persisted in sessionStorage)
   */
  static setModel(model) {
    try {
      if (model === 'claude' || model === 'cerebras') {
        sessionStorage.setItem(this.MODEL_KEY, model);
        console.log(`[Model] Switched to ${model}`);
        window.dispatchEvent(new CustomEvent('model-changed', { detail: { model } }));
      }
    } catch (e) {
      console.warn('[Model] Failed to save model:', e);
    }
  }

  /**
   * Get whether RAG is enabled (persisted in sessionStorage)
   * Default is true (enabled)
   */
  static getRAGEnabled() {
    try {
      const stored = sessionStorage.getItem(this.RAG_KEY);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  }

  /**
   * Set whether RAG is enabled (persisted in sessionStorage)
   */
  static setRAGEnabled(enabled) {
    try {
      sessionStorage.setItem(this.RAG_KEY, enabled ? 'true' : 'false');
      console.log(`[RAG] ${enabled ? 'Enabled' : 'Disabled'}`);
      window.dispatchEvent(new CustomEvent('rag-changed', { detail: { enabled } }));
    } catch (e) {
      console.warn('[RAG] Failed to save setting:', e);
    }
  }

  /**
   * Toggle RAG on/off
   */
  static toggleRAG() {
    const current = this.getRAGEnabled();
    this.setRAGEnabled(!current);
    return !current;
  }

  static getContext() {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure required fields exist (for backwards compatibility with old sessions)
        return {
          queries: parsed.queries || [],
          sessionStart: parsed.sessionStart || Date.now(),
          lastUpdated: parsed.lastUpdated || Date.now(),
          profile: { ...this.getDefaultProfile(), ...(parsed.profile || {}) },
        };
      }
    } catch (e) {
      console.warn('[Session] Failed to load context:', e);
    }
    return {
      queries: [],
      sessionStart: Date.now(),
      lastUpdated: Date.now(),
      profile: this.getDefaultProfile(),
    };
  }

  static getDefaultProfile() {
    return {
      pricePreference: 'unknown', // budget, value, premium, unknown
      featureFocus: [], // programs, power, ease-of-use, quiet, etc.
      useCases: [], // smoothies, soups, meal-prep, etc.
      householdSize: 'unknown', // solo, couple, family, unknown
      productsDiscussed: [],
      productsCompared: [],
      questionsAsked: [],
      concernsRaised: [], // price, noise, counter space, cleanup
      clickedProducts: [],
      journeyStage: 'exploring',
    };
  }

  static saveContext(context) {
    try {
      context.lastUpdated = Date.now();
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(context));
    } catch (e) {
      console.warn('[Session] Failed to save context:', e);
    }
  }

  static addQuery(entry) {
    const context = this.getContext();

    // Add query to history
    context.queries.push({
      query: entry.query,
      timestamp: entry.timestamp || Date.now(),
      intent: entry.intent || 'general',
      entities: entry.entities || { products: [], useCases: [] },
      generatedPath: entry.generatedPath,
    });

    // Keep only last N queries
    if (context.queries.length > this.MAX_QUERIES) {
      context.queries = context.queries.slice(-this.MAX_QUERIES);
    }

    // Update user profile based on query
    this.updateProfile(context, entry);

    this.saveContext(context);
  }

  static updateProfile(context, entry) {
    // Merge stored profile with defaults to ensure all fields exist
    const defaults = this.getDefaultProfile();
    const profile = { ...defaults, ...(context.profile || {}) };
    // Ensure arrays exist (in case old session data is missing them)
    profile.productsDiscussed = profile.productsDiscussed || [];
    profile.productsCompared = profile.productsCompared || [];
    profile.useCases = profile.useCases || [];
    profile.featureFocus = profile.featureFocus || [];
    profile.questionsAsked = profile.questionsAsked || [];
    profile.concernsRaised = profile.concernsRaised || [];
    profile.clickedProducts = profile.clickedProducts || [];

    const query = entry.query.toLowerCase();
    const entities = entry.entities || {};

    // Track products discussed
    if (entities.products && entities.products.length > 0) {
      profile.productsDiscussed = [...new Set([
        ...profile.productsDiscussed,
        ...entities.products,
      ])];
    }

    // Track use cases
    if (entities.useCases && entities.useCases.length > 0) {
      profile.useCases = [...new Set([
        ...profile.useCases,
        ...entities.useCases,
      ])];
    }

    // Infer price preference
    if (query.includes('budget') || query.includes('cheap') || query.includes('affordable')) {
      profile.pricePreference = 'budget';
    } else if (query.includes('best') || query.includes('premium') || query.includes('top')) {
      profile.pricePreference = 'premium';
    } else if (query.includes('value') || query.includes('worth')) {
      profile.pricePreference = 'value';
    }

    // Infer household size
    if (query.includes('family') || query.includes('kids') || query.includes('children')) {
      profile.householdSize = 'family';
    } else if (query.includes('couple') || query.includes('two')) {
      profile.householdSize = 'couple';
    } else if (query.includes('myself') || query.includes('single') || query.includes('one person')) {
      profile.householdSize = 'solo';
    }

    // Track concerns
    const concerns = [];
    if (query.includes('noise') || query.includes('loud') || query.includes('quiet')) concerns.push('noise');
    if (query.includes('space') || query.includes('counter') || query.includes('storage')) concerns.push('counter-space');
    if (query.includes('clean') || query.includes('wash')) concerns.push('cleanup');
    if (query.includes('price') || query.includes('cost') || query.includes('expensive')) concerns.push('price');
    profile.concernsRaised = [...new Set([...profile.concernsRaised, ...concerns])];

    // Track feature focus
    const features = [];
    if (query.includes('program')) features.push('programs');
    if (query.includes('power') || query.includes('watt')) features.push('power');
    if (query.includes('easy') || query.includes('simple')) features.push('ease-of-use');
    if (query.includes('touchscreen') || query.includes('display')) features.push('touchscreen');
    profile.featureFocus = [...new Set([...profile.featureFocus, ...features])];

    // Track questions asked
    profile.questionsAsked.push(entry.query);

    // Update journey stage based on behavior
    const queryCount = context.queries.length;
    const hasCompared = entry.intent === 'comparison' || profile.productsCompared.length > 0;

    if (hasCompared || queryCount > 3) {
      profile.journeyStage = 'comparing';
    }
    if (queryCount > 5 || entry.intent === 'recommendation') {
      profile.journeyStage = 'deciding';
    }

    context.profile = profile;
  }

  static trackProductClick(productId) {
    const context = this.getContext();
    if (!context.profile) context.profile = this.getDefaultProfile();
    // Ensure array exists
    context.profile.clickedProducts = context.profile.clickedProducts || [];
    context.profile.clickedProducts = [...new Set([
      ...context.profile.clickedProducts,
      productId,
    ])];
    this.saveContext(context);
  }

  static buildEncodedContextParam() {
    const context = this.getContext();
    if (context.queries.length === 0) return '';

    const profile = context.profile || {};

    const summary = {
      q: context.queries.slice(-5).map((q) => ({
        t: q.query.substring(0, 100),
        i: q.intent,
      })),
      p: {
        price: profile.pricePreference,
        uses: profile.useCases?.slice(0, 3),
        products: profile.productsDiscussed?.slice(0, 5),
        concerns: profile.concernsRaised?.slice(0, 3),
        stage: profile.journeyStage,
      },
    };

    return encodeURIComponent(btoa(JSON.stringify(summary)));
  }

  static getJourneyStage() {
    const context = this.getContext();
    return context.profile?.journeyStage || 'exploring';
  }

  static getProfile() {
    const context = this.getContext();
    return context.profile || this.getDefaultProfile();
  }
}

/**
 * Render a single block section
 */
async function renderBlockSection(blockData, container) {
  const section = document.createElement('div');
  section.className = 'section';
  if (blockData.sectionStyle && blockData.sectionStyle !== 'default') {
    section.classList.add(blockData.sectionStyle);
  }
  section.dataset.sectionStatus = 'initialized';
  section.innerHTML = blockData.html;

  // Handle generated images
  section.querySelectorAll('img[data-gen-image]').forEach((img) => {
    img.dataset.originalSrc = img.getAttribute('src');
    img.onload = () => img.classList.add('loaded');
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('loaded');
    }
  });

  // Wrap block in wrapper div (EDS pattern)
  const blockEl = section.querySelector('[class]');
  if (blockEl) {
    const blockName = blockEl.classList[0];
    const wrapper = document.createElement('div');
    wrapper.className = `${blockName}-wrapper`;
    blockEl.parentNode.insertBefore(wrapper, blockEl);
    wrapper.appendChild(blockEl);
    decorateBlock(blockEl);
    section.classList.add(`${blockName}-container`);
  }

  decorateButtons(section);
  decorateIcons(section);
  container.appendChild(section);

  const block = section.querySelector('.block');
  if (block) {
    await loadBlock(block);
  }

  section.dataset.sectionStatus = 'loaded';
  section.style.display = null;

  // Attach interactive handlers
  attachBlockInteractivity(section, blockData.blockType);

  return section;
}

/**
 * Attach click handlers to make block elements interactive
 * Note: Many blocks now have built-in handlers in their decorators.
 * This function handles remaining blocks that need interactivity added.
 */
function attachBlockInteractivity(section, blockType) {
  // Feature cards - click to learn more about that feature
  // These use decorated class names from the block decorator
  if (blockType === 'feature-cards') {
    section.querySelectorAll('.feature-card').forEach((card) => {
      const featureName = card.querySelector('.feature-card-name')?.textContent?.trim();
      if (featureName && !card.dataset.interactive) {
        card.dataset.interactive = 'true';
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
          const query = `Tell me more about ${featureName}`;
          console.log('[Interactive] Feature card clicked:', query);
          if (window.startCerebrasGeneration) {
            window.startCerebrasGeneration(query);
          }
        });
      }
    });
  }

  // Comparison table - click product name to see details
  if (blockType === 'comparison-table') {
    const table = section.querySelector('.comparison-table table');
    if (table) {
      const headerCells = table.querySelectorAll('thead th');
      headerCells.forEach((cell, index) => {
        if (index === 0) return; // Skip first column (spec names)
        const productName = cell.textContent?.trim();
        if (productName && !cell.dataset.interactive) {
          cell.dataset.interactive = 'true';
          cell.style.cursor = 'pointer';
          cell.addEventListener('click', () => {
            const query = `Tell me about the ${productName}`;
            console.log('[Interactive] Comparison header clicked:', query);
            if (window.startCerebrasGeneration) {
              window.startCerebrasGeneration(query);
            }
          });
        }
      });
    }
  }

  // Review carousel - add "see more" button if not already present
  if (blockType === 'review-carousel') {
    const reviewBlock = section.querySelector('.review-carousel');
    if (reviewBlock && !reviewBlock.querySelector('.review-more-cta')) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'review-carousel-actions';
      const moreBtn = document.createElement('button');
      moreBtn.className = 'review-more-cta';
      moreBtn.textContent = 'See all customer reviews';
      actionsDiv.appendChild(moreBtn);
      reviewBlock.appendChild(actionsDiv);
      moreBtn.addEventListener('click', () => {
        const query = 'Show me more customer reviews';
        console.log('[Interactive] More reviews clicked');
        if (window.startCerebrasGeneration) {
          window.startCerebrasGeneration(query);
        }
      });
    }
  }

  // Price comparison - click tier to see options
  if (blockType === 'price-comparison') {
    section.querySelectorAll('.price-tier').forEach((tier) => {
      const tierName = tier.querySelector('.price-tier-name')?.textContent?.trim();
      if (tierName && !tier.dataset.interactive) {
        tier.dataset.interactive = 'true';
        tier.style.cursor = 'pointer';
        tier.addEventListener('click', () => {
          const query = `Show me ${tierName.toLowerCase()} Vitamix options`;
          console.log('[Interactive] Price tier clicked:', query);
          if (window.startCerebrasGeneration) {
            window.startCerebrasGeneration(query);
          }
        });
      }
    });
  }
}

/**
 * Check if we're on a generation page
 */
function isGenerationPage() {
  const params = new URLSearchParams(window.location.search);
  return params.has('q') || params.has('cerebras');
}

/**
 * Create or get the conversation bar container
 */
function ensureConversationBar() {
  let barWrapper = document.querySelector('.conversation-bar-wrapper');
  if (barWrapper) return barWrapper;

  // Create conversation bar container
  barWrapper = document.createElement('div');
  barWrapper.className = 'conversation-bar-wrapper';
  barWrapper.innerHTML = `
    <div class="conversation-bar block" data-block-name="conversation-bar">
      <div><div>Ask me anything about Vitamix...</div></div>
      <div><div></div></div>
    </div>
  `;

  document.body.appendChild(barWrapper);
  document.body.classList.add('has-conversation-bar');

  // Decorate and load the block
  const block = barWrapper.querySelector('.conversation-bar');
  decorateBlock(block);
  loadBlock(block);

  return barWrapper;
}

/**
 * Update conversation bar with new follow-up suggestions
 */
function updateConversationBarSuggestions(suggestions) {
  if (window.updateConversationSuggestions) {
    window.updateConversationSuggestions(suggestions);
  }
}

/**
 * Cache of rendered pages for browser history navigation
 */
const pageCache = new Map();

/**
 * Render the generative page by streaming from SSE
 * Always replaces content (no append mode)
 */
async function renderGenerativePage() {
  const main = document.querySelector('main');
  if (!main) return;

  const params = new URLSearchParams(window.location.search);
  const query = params.get('q') || params.get('cerebras');
  if (!query) return;

  const slug = generateSlug(query);
  const startTime = Date.now();

  // Always replace mode: clear and start fresh
  main.innerHTML = `
    <div id="generation-content">
      <div class="generating-container">
        <h1 class="generating-title">Finding answers for you...</h1>
        <p class="generating-query">"${query}"</p>
        <div class="progress-indicator">
          <div class="progress-dot"></div>
          <div class="progress-dot"></div>
          <div class="progress-dot"></div>
        </div>
      </div>
    </div>
  `;
  const content = main.querySelector('#generation-content');
  // Reset blocks storage
  originalBlocksData = [];

  // Build session context
  const contextParam = SessionContextManager.buildEncodedContextParam();
  const journeyStage = SessionContextManager.getJourneyStage();
  const selectedModel = SessionContextManager.getModel();
  const ragEnabled = SessionContextManager.getRAGEnabled();

  // Connect to SSE stream
  const streamUrl = `${WORKER_URL}/api/stream?slug=${encodeURIComponent(slug)}&query=${encodeURIComponent(query)}&ctx=${contextParam}&stage=${journeyStage}&model=${selectedModel}&rag=${ragEnabled}`;
  const eventSource = new EventSource(streamUrl);

  console.log(`[Generative] Using model: ${selectedModel}, RAG: ${ragEnabled ? 'enabled' : 'disabled'}`);

  console.log(`[Generative] Starting SSE stream for: ${query}`);

  let firstBlockReceived = false;
  let followUpSuggestions = [];

  eventSource.addEventListener('block-content', async (e) => {
    // Remove loading indicator on first block
    if (!firstBlockReceived) {
      firstBlockReceived = true;
      const loadingContainer = content.querySelector('.generating-container');
      if (loadingContainer) {
        loadingContainer.remove();
      }
    }

    const data = JSON.parse(e.data);
    originalBlocksData.push(data);

    // Capture follow-up suggestions but don't render the block
    // (they'll go in the conversation bar instead)
    if (data.blockType === 'follow-up') {
      // Extract suggestions from follow-up block HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = data.html;
      const links = tempDiv.querySelectorAll('a');
      followUpSuggestions = [...links].map((a) => a.textContent.trim());
      console.log('[Generative] Captured follow-up suggestions:', followUpSuggestions);
      return;
    }

    await renderBlockSection(data, content);
  });

  eventSource.addEventListener('image-ready', (e) => {
    const data = JSON.parse(e.data);
    const { imageId, url } = data;

    const img = content.querySelector(`img[data-gen-image="${imageId}"]`);
    if (img && url) {
      let resolvedUrl = url;
      if (url.startsWith('/')) {
        resolvedUrl = `${WORKER_URL}${url}`;
      }
      img.src = `${resolvedUrl}?_t=${Date.now()}`;
      img.classList.add('loaded');
    }
  });

  eventSource.addEventListener('generation-complete', (e) => {
    eventSource.close();
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`[Generative] Complete in ${totalTime}s`);

    // Parse intent data and follow-up suggestions
    let intent = null;
    if (e.data) {
      try {
        const data = JSON.parse(e.data);
        intent = data.intent;
        if (data.followUps && data.followUps.length > 0) {
          followUpSuggestions = data.followUps;
        }
      } catch {
        // No intent data
      }
    }

    // Record this query in session context
    SessionContextManager.addQuery({
      query,
      timestamp: Date.now(),
      intent: intent?.primary || 'general',
      entities: intent?.entities || { products: [], useCases: [] },
      generatedPath: `/discover/${slug}`,
    });

    // Update page title
    const h1 = content.querySelector('h1');
    if (h1) {
      document.title = `${h1.textContent} | Vitamix`;
    }

    // Cache this page content for browser history navigation
    const currentUrl = window.location.href;
    pageCache.set(currentUrl, {
      html: content.innerHTML,
      title: document.title,
      query,
    });

    // Ensure conversation bar exists and update suggestions
    ensureConversationBar();
    if (followUpSuggestions.length > 0) {
      updateConversationBarSuggestions(followUpSuggestions);
    }

    // Dispatch event for conversation bar to reset its state
    window.dispatchEvent(new CustomEvent('generation-complete'));
  });

  eventSource.addEventListener('error', (e) => {
    if (e.data) {
      const data = JSON.parse(e.data);
      main.innerHTML = `
        <div class="section error-container">
          <h1>Something went wrong</h1>
          <p style="color: #c00;">${data.message}</p>
          <p><a href="/">Try again</a></p>
        </div>
      `;
    }
    eventSource.close();
    window.dispatchEvent(new CustomEvent('generation-complete'));
  });

  eventSource.onerror = () => {
    if (eventSource.readyState === EventSource.CLOSED) {
      console.log('[Generative] SSE connection closed');
    }
  };
}

/**
 * Start generation from anywhere on the page
 * Each query replaces the current page, and users can navigate back with browser back button
 * @param {string} query - The search query
 */
function startGeneration(query) {
  if (!query.trim()) return;

  console.log(`[Generative] Starting generation for: "${query}"`);

  // Cache current page content before navigation (if we have generated content)
  const currentUrl = window.location.href;
  const currentContent = document.querySelector('#generation-content');
  if (currentContent && currentContent.innerHTML && !pageCache.has(currentUrl)) {
    pageCache.set(currentUrl, {
      html: currentContent.innerHTML,
      title: document.title,
      query: new URLSearchParams(window.location.search).get('q'),
    });
  }

  // Update URL and push to history stack
  const newUrl = `/?q=${encodeURIComponent(query)}`;
  window.history.pushState({ query, fromGeneration: true }, '', newUrl);

  // Load generative CSS
  loadCSS('/styles/generative.css');

  // Render the page
  renderGenerativePage();
}

/**
 * Restore a cached page from browser history
 */
function restoreFromCache(url) {
  const cached = pageCache.get(url);
  if (!cached) return false;

  const main = document.querySelector('main');
  if (!main) return false;

  console.log(`[Generative] Restoring from cache: ${cached.query}`);

  // Restore the content
  main.innerHTML = `<div id="generation-content">${cached.html}</div>`;
  document.title = cached.title;

  // Re-attach interactivity to restored blocks
  const content = main.querySelector('#generation-content');
  content.querySelectorAll('.section').forEach((section) => {
    const block = section.querySelector('.block');
    if (block) {
      const blockType = block.className.split(' ')[0];
      attachBlockInteractivity(section, blockType);
    }
  });

  // Ensure conversation bar exists
  ensureConversationBar();

  return true;
}

/**
 * Handle browser back/forward navigation
 */
function handlePopState(event) {
  const url = window.location.href;
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q');

  console.log('[Generative] popstate event:', { url, query, state: event.state });

  // If we're going back to home page (no query)
  if (!query) {
    // Reload the home page
    window.location.reload();
    return;
  }

  // Try to restore from cache first
  if (restoreFromCache(url)) {
    return;
  }

  // If not in cache, regenerate the content
  loadCSS('/styles/generative.css');
  renderGenerativePage();
}

/**
 * Setup header search interception
 */
function setupHeaderSearch() {
  // Capture form submissions in header
  document.addEventListener('submit', (e) => {
    const form = e.target;
    const header = form.closest('header');
    if (!header) return;

    const input = form.querySelector('input[type="text"], input[type="search"], input:not([type])');
    if (!input) return;

    const query = input.value.trim();
    if (query) {
      e.preventDefault();
      e.stopImmediatePropagation();
      startGeneration(query);
    }
  }, true);

  console.log('[Generative] Header search handlers attached');
}

/**
 * Initialize
 */
async function init() {
  // Always setup header search
  setupHeaderSearch();

  // Setup browser history navigation handler
  window.addEventListener('popstate', handlePopState);

  // Check if this is a generation request
  if (isGenerationPage()) {
    await loadCSS('/styles/generative.css');
    await renderGenerativePage();
  }
}

// Expose globally
window.startCerebrasGeneration = startGeneration;
window.SessionContextManager = SessionContextManager;

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { startGeneration, SessionContextManager };
