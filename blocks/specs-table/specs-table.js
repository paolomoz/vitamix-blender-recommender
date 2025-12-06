/**
 * Specs Table Block
 * Displays technical specifications in a clean table format
 */

export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length === 0) return;

  // First row is the title
  const titleRow = rows[0];
  const title = titleRow.querySelector('div')?.textContent?.trim() || 'Specifications';

  // Remaining rows are spec rows (label | value)
  const specs = rows.slice(1).map((row) => {
    const cells = [...row.children];
    return {
      label: cells[0]?.textContent?.trim() || '',
      value: cells[1]?.textContent?.trim() || '',
    };
  }).filter((s) => s.label);

  block.innerHTML = `
    <div class="specs-table-content">
      <h2 class="specs-table-title">${title}</h2>
      <div class="specs-table-rows">
        ${specs.map((s) => `
          <div class="specs-table-row">
            <span class="specs-table-label">${s.label}</span>
            <span class="specs-table-value">${s.value}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  setTimeout(() => block.classList.add('loaded'), 100);
}
