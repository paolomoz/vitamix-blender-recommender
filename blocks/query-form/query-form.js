/**
 * Query Form Block
 *
 * Main input interface with guided prompts + free-form input.
 *
 * Structure:
 * <div class="query-form">
 *   <div>
 *     <div>Find Your Perfect Vitamix</div>
 *   </div>
 *   <div>
 *     <div>What would you like to make?</div>
 *   </div>
 *   <div>
 *     <div>Daily smoothies|Compare models|Best for families|Budget-friendly</div>
 *   </div>
 * </div>
 */

export default function decorate(block) {
  const rows = [...block.children];

  // Extract content
  const title = rows[0]?.querySelector('div')?.textContent?.trim() || 'Find Your Perfect Vitamix';
  const placeholder = rows[1]?.querySelector('div')?.textContent?.trim() || 'What would you like to make?';
  const suggestionsText = rows[2]?.querySelector('div')?.textContent?.trim() || '';

  // Parse suggestions (pipe-separated)
  const suggestions = suggestionsText
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

  // Get current model from session
  const currentModel = window.SessionContextManager?.getModel() || 'claude';

  // Build the form UI
  block.innerHTML = `
    <div class="query-form-content">
      <h1 class="query-form-title">${title}</h1>

      <div class="query-form-model-selector">
        <span class="model-selector-label">AI Model:</span>
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

      <form class="query-form-input-container" id="vitamix-query-form">
        <input
          type="text"
          class="query-form-input"
          placeholder="${placeholder}"
          autocomplete="off"
          aria-label="${placeholder}"
        />
        <button type="submit" class="query-form-submit">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
            <path d="M20 3v4M22 5h-4M4 17v2M5 18H3"/>
          </svg>
          <span>Explore</span>
        </button>
      </form>

      ${suggestions.length > 0 ? `
        <div class="query-form-suggestions">
          <p class="query-form-suggestions-label">Popular questions:</p>
          <div class="query-form-chips">
            ${suggestions.map((s) => `
              <button type="button" class="query-form-chip" data-query="${s}">
                ${s}
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Get elements
  const form = block.querySelector('#vitamix-query-form');
  const input = block.querySelector('.query-form-input');
  const submitBtn = block.querySelector('.query-form-submit');
  const chips = block.querySelectorAll('.query-form-chip');
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

  // Form submission handler
  const handleSubmit = (query) => {
    if (!query.trim()) {
      input.focus();
      return;
    }

    // Disable UI during generation
    input.disabled = true;
    submitBtn.disabled = true;
    chips.forEach((c) => { c.disabled = true; });

    // Show loading state
    submitBtn.innerHTML = `
      <div class="query-form-spinner"></div>
      <span>Generating...</span>
    `;

    // Start generation
    if (window.startCerebrasGeneration) {
      window.startCerebrasGeneration(query);
    } else {
      // Fallback: navigate with query param
      window.location.href = `/?cerebras=${encodeURIComponent(query)}`;
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

  // Focus input on load
  setTimeout(() => {
    input.focus();
  }, 500);
}
