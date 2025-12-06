/**
 * Recipe Suggestions Block
 * Displays recipe cards based on blender capabilities
 */

export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length === 0) return;

  // First row is the title
  const titleRow = rows[0];
  const title = titleRow.querySelector('div')?.textContent?.trim() || 'Recipe Ideas';

  // Remaining rows are recipe cards
  const recipes = rows.slice(1).map((row) => {
    const cells = [...row.children];
    const image = cells[0]?.querySelector('img');
    return {
      image: image?.src || '',
      name: cells[1]?.textContent?.trim() || cells[0]?.textContent?.trim() || '',
      description: cells[2]?.textContent?.trim() || '',
    };
  }).filter((r) => r.name);

  block.innerHTML = `
    <div class="recipe-suggestions-content">
      <h2 class="recipe-suggestions-title">${title}</h2>
      <div class="recipe-suggestions-grid">
        ${recipes.map((r) => `
          <button class="recipe-card" data-recipe="${r.name}">
            ${r.image ? `<div class="recipe-card-image"><img src="${r.image}" alt="${r.name}"></div>` : ''}
            <h3 class="recipe-card-name">${r.name}</h3>
            ${r.description ? `<p class="recipe-card-description">${r.description}</p>` : ''}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  // Add click handlers
  block.querySelectorAll('.recipe-card').forEach((card) => {
    card.addEventListener('click', () => {
      const recipeName = card.dataset.recipe;
      const query = `How do I make ${recipeName} in a Vitamix?`;
      console.log('[Interactive] Recipe card clicked:', query);
      if (window.startCerebrasGeneration) {
        window.startCerebrasGeneration(query);
      } else {
        window.location.href = `/?q=${encodeURIComponent(query)}`;
      }
    });
  });

  setTimeout(() => block.classList.add('loaded'), 100);
}
