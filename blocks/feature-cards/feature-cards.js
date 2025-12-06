/**
 * Feature Cards Block
 * Displays feature benefit cards in a grid layout
 */

export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length === 0) return;

  // First row is the title
  const titleRow = rows[0];
  const title = titleRow.querySelector('div')?.textContent?.trim() || 'Key Features';

  // Remaining rows are feature cards
  const features = rows.slice(1).map((row) => {
    const cells = [...row.children];
    return {
      name: cells[0]?.textContent?.trim() || '',
      description: cells[1]?.textContent?.trim() || '',
      benefit: cells[2]?.textContent?.trim() || '',
    };
  }).filter((f) => f.name);

  block.innerHTML = `
    <div class="feature-cards-content">
      <h2 class="feature-cards-title">${title}</h2>
      <div class="feature-cards-grid">
        ${features.map((f) => `
          <div class="feature-card">
            <h3 class="feature-card-name">${f.name}</h3>
            <p class="feature-card-description">${f.description}</p>
            ${f.benefit ? `<p class="feature-card-benefit">${f.benefit}</p>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;

  setTimeout(() => block.classList.add('loaded'), 100);
}
