/**
 * Needs Explorer Block
 * Displays use case cards to help users explore their needs
 */

export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length === 0) return;

  // First row is the title
  const titleRow = rows[0];
  const title = titleRow.querySelector('div')?.textContent?.trim() || 'What would you like to make?';

  // Remaining rows are use case cards
  const useCases = rows.slice(1).map((row) => {
    const cells = [...row.children];
    return {
      name: cells[0]?.textContent?.trim() || '',
      description: cells[1]?.textContent?.trim() || '',
      id: cells[2]?.textContent?.trim() || '',
    };
  }).filter((uc) => uc.name);

  block.innerHTML = `
    <div class="needs-explorer-content">
      <h2 class="needs-explorer-title">${title}</h2>
      <div class="needs-explorer-grid">
        ${useCases.map((uc) => `
          <button class="needs-explorer-card" data-use-case="${uc.id || uc.name.toLowerCase()}">
            <h3 class="needs-explorer-card-name">${uc.name}</h3>
            <p class="needs-explorer-card-description">${uc.description}</p>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  // Add click handlers
  block.querySelectorAll('.needs-explorer-card').forEach((card) => {
    card.addEventListener('click', () => {
      const useCaseName = card.querySelector('.needs-explorer-card-name').textContent;
      const query = `Best Vitamix for ${useCaseName}`;
      console.log('[Interactive] Needs card clicked:', query);
      if (window.startCerebrasGeneration) {
        window.startCerebrasGeneration(query);
      } else {
        window.location.href = `/?q=${encodeURIComponent(query)}`;
      }
    });
  });

  setTimeout(() => block.classList.add('loaded'), 100);
}
