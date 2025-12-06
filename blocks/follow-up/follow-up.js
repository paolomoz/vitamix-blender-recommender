/**
 * Follow-up Block
 *
 * Displays suggested next questions or actions to guide the user journey.
 *
 * Structure:
 * <div class="follow-up">
 *   <div>
 *     <div>What would you like to explore next?</div>
 *   </div>
 *   <div>
 *     <div><a href="..." data-query="...">Compare X5 vs X4</a></div>
 *   </div>
 *   <div>
 *     <div><a href="..." data-query="...">Show me budget options</a></div>
 *   </div>
 * </div>
 */

export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length === 0) return;

  // First row is the prompt/title
  const titleRow = rows[0];
  const title = titleRow.querySelector('div')?.textContent?.trim() || 'What would you like to explore next?';

  // Remaining rows are suggestion chips
  const suggestions = rows.slice(1).map((row) => {
    const link = row.querySelector('a');
    const text = row.querySelector('div')?.textContent?.trim();

    if (link) {
      return {
        text: link.textContent.trim(),
        query: link.dataset.query || link.textContent.trim(),
        href: link.href,
      };
    } else if (text) {
      return {
        text,
        query: text,
        href: null,
      };
    }
    return null;
  }).filter(Boolean);

  // Build the UI
  block.innerHTML = `
    <div class="follow-up-content">
      <p class="follow-up-title">${title}</p>
      <div class="follow-up-suggestions">
        ${suggestions.map((s) => `
          <button class="follow-up-chip" data-query="${s.query}">
            <span>${s.text}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  // Add click handlers for chips
  block.querySelectorAll('.follow-up-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const query = chip.dataset.query;
      if (window.startCerebrasGeneration) {
        window.startCerebrasGeneration(query);
      } else {
        // Fallback: navigate with query param
        window.location.href = `/?cerebras=${encodeURIComponent(query)}`;
      }
    });
  });

  // Add loaded class
  setTimeout(() => {
    block.classList.add('loaded');
  }, 100);
}
