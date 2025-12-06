/**
 * Conversation Bar Block
 *
 * Sticky bottom input bar for continuous conversation.
 * Always visible, allowing users to ask follow-up questions or type new queries.
 *
 * Structure:
 * <div class="conversation-bar">
 *   <div><div>Ask me anything about Vitamix...</div></div>
 *   <div><div>Compare to X4|Show recipes|What's included</div></div>
 * </div>
 */

export default function decorate(block) {
  const rows = [...block.children];

  // Extract content
  const placeholder = rows[0]?.querySelector('div')?.textContent?.trim()
    || 'Ask me anything about Vitamix...';
  const suggestionsText = rows[1]?.querySelector('div')?.textContent?.trim() || '';

  // Parse suggestions (pipe-separated)
  const suggestions = suggestionsText
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

  // Get current model from session
  const currentModel = window.SessionContextManager?.getModel() || 'claude';

  // Build the conversation bar UI
  block.innerHTML = `
    <div class="conversation-bar-inner">
      <div class="conversation-bar-top-row">
        <div class="conversation-bar-suggestions">
          ${suggestions.map((s) => `
            <button type="button" class="conversation-chip" data-query="${s}">
              ${s}
            </button>
          `).join('')}
        </div>
        <div class="model-selector">
          <button type="button" class="model-option ${currentModel === 'cerebras' ? 'active' : ''}" data-model="cerebras" title="Cerebras Llama 3.3 70B - Fast inference">
            <span class="model-icon">&#x26A1;</span>
            <span class="model-name">Cerebras</span>
          </button>
          <button type="button" class="model-option ${currentModel === 'claude' ? 'active' : ''}" data-model="claude" title="Claude Opus 4.5 - Advanced reasoning">
            <span class="model-icon">&#x2728;</span>
            <span class="model-name">Claude</span>
          </button>
        </div>
      </div>
      <form class="conversation-bar-form" id="conversation-form">
        <div class="conversation-bar-input-wrapper">
          <input
            type="text"
            class="conversation-bar-input"
            placeholder="${placeholder}"
            autocomplete="off"
            aria-label="${placeholder}"
          />
          <button type="submit" class="conversation-bar-submit" aria-label="Send">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13"/>
              <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  `;

  // Get elements
  const form = block.querySelector('#conversation-form');
  const input = block.querySelector('.conversation-bar-input');
  const submitBtn = block.querySelector('.conversation-bar-submit');
  const chips = block.querySelectorAll('.conversation-chip');
  const modelButtons = block.querySelectorAll('.model-option');

  // Model selector click handlers
  modelButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const model = btn.dataset.model;
      if (window.SessionContextManager) {
        window.SessionContextManager.setModel(model);
      }
      // Update UI
      modelButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Listen for model changes from elsewhere
  window.addEventListener('model-changed', (e) => {
    const { model } = e.detail;
    modelButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.model === model);
    });
  });

  // Handle query submission
  const handleSubmit = (query) => {
    if (!query.trim()) {
      input.focus();
      return;
    }

    // Show loading state
    input.disabled = true;
    submitBtn.disabled = true;
    chips.forEach((c) => { c.disabled = true; });
    block.classList.add('loading');

    // Start generation (always replaces content, back button navigates to previous)
    if (window.startCerebrasGeneration) {
      window.startCerebrasGeneration(query);
    } else {
      // Fallback: navigate with query param
      window.location.href = `/?q=${encodeURIComponent(query)}`;
    }
  };

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit(input.value);
  });

  // Chip clicks
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      handleSubmit(chip.dataset.query);
    });
  });

  // Reset state when generation completes
  window.addEventListener('generation-complete', () => {
    input.disabled = false;
    submitBtn.disabled = false;
    input.value = '';
    block.classList.remove('loading');
    chips.forEach((c) => { c.disabled = false; });
  });

  // Focus input on keyboard shortcut (/)
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
    }
  });

  // Add loaded class
  setTimeout(() => {
    block.classList.add('loaded');
  }, 100);
}

/**
 * Update the conversation bar with new suggestions
 * Called dynamically after each generation
 */
export function updateSuggestions(suggestions) {
  const container = document.querySelector('.conversation-bar-suggestions');
  if (!container) return;

  container.innerHTML = suggestions.map((s) => `
    <button type="button" class="conversation-chip" data-query="${s}">
      ${s}
    </button>
  `).join('');

  // Re-attach handlers
  container.querySelectorAll('.conversation-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const query = chip.dataset.query;
      if (window.startCerebrasGeneration) {
        window.startCerebrasGeneration(query);
      }
    });
  });
}

// Expose update function globally
window.updateConversationSuggestions = updateSuggestions;
