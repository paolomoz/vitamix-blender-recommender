/**
 * Proactive Insight Block
 *
 * Displays unexpected valuable insights to the user.
 *
 * Structure:
 * <div class="proactive-insight">
 *   <div><div>hidden-value</div></div>
 *   <div><div>All Vitamix blenders include a 10-year warranty...</div></div>
 * </div>
 */

const INSIGHT_ICONS = {
  'cross-sell': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
  'hidden-value': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  comparative: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
  'use-case': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>',
  'buying-tip': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  default: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
};

const INSIGHT_LABELS = {
  'cross-sell': 'Good to know',
  'hidden-value': 'Did you know?',
  comparative: 'Worth noting',
  'use-case': 'Pro tip',
  'buying-tip': 'Smart shopping',
  default: 'Insight',
};

export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 2) return;

  // Extract type and insight text
  const type = rows[0]?.querySelector('div')?.textContent?.trim() || 'default';
  const insight = rows[1]?.querySelector('div')?.textContent?.trim() || '';

  if (!insight) return;

  const icon = INSIGHT_ICONS[type] || INSIGHT_ICONS.default;
  const label = INSIGHT_LABELS[type] || INSIGHT_LABELS.default;

  // Build the insight card
  block.innerHTML = `
    <button class="proactive-insight-card" data-type="${type}">
      <div class="proactive-insight-icon">${icon}</div>
      <div class="proactive-insight-content">
        <span class="proactive-insight-label">${label}</span>
        <p class="proactive-insight-text">${insight}</p>
      </div>
      <div class="proactive-insight-action">Learn more →</div>
    </button>
  `;

  // Add click handler
  const card = block.querySelector('.proactive-insight-card');
  if (card) {
    card.addEventListener('click', () => {
      const query = `Tell me more about: ${insight}`;
      console.log('[Interactive] Insight clicked:', query);
      if (window.startCerebrasGeneration) {
        window.startCerebrasGeneration(query);
      } else {
        window.location.href = `/?q=${encodeURIComponent(query)}`;
      }
    });
  }

  // Add loaded class with delay for animation
  setTimeout(() => {
    block.classList.add('loaded');
  }, 100);
}
