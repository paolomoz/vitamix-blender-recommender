/**
 * Price Comparison Block
 * Displays products organized by price tier
 */

export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length === 0) return;

  // First row is the title
  const titleRow = rows[0];
  const title = titleRow.querySelector('div')?.textContent?.trim() || 'Find Your Price Range';

  // Remaining rows are price tiers (tier name | range | product | price)
  const tiers = rows.slice(1).map((row) => {
    const cells = [...row.children];
    return {
      tier: cells[0]?.textContent?.trim() || '',
      range: cells[1]?.textContent?.trim() || '',
      product: cells[2]?.textContent?.trim() || '',
      price: cells[3]?.textContent?.trim() || '',
    };
  }).filter((t) => t.tier);

  block.innerHTML = `
    <div class="price-comparison-content">
      <h2 class="price-comparison-title">${title}</h2>
      <div class="price-comparison-tiers">
        ${tiers.map((t) => `
          <div class="price-comparison-tier">
            <div class="price-tier-header">
              <span class="price-tier-name">${t.tier}</span>
              <span class="price-tier-range">${t.range}</span>
            </div>
            <div class="price-tier-product">
              <span class="price-tier-product-name">${t.product}</span>
              <span class="price-tier-price">${t.price}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  setTimeout(() => block.classList.add('loaded'), 100);
}
