/**
 * Comparison Table Block
 *
 * Side-by-side comparison of 2-4 products with key attributes.
 *
 * Structure:
 * <div class="comparison-table">
 *   <div><!-- Header row: empty | Product 1 | Product 2 | ... --></div>
 *   <div><!-- Attribute row: Label | Value 1 | Value 2 | ... --></div>
 *   ...
 * </div>
 */

export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length === 0) return;

  // First row is header with product names/images
  const headerRow = rows[0];
  headerRow.classList.add('comparison-header');

  const headerCells = [...headerRow.children];
  headerCells.forEach((cell, index) => {
    if (index === 0) {
      cell.classList.add('comparison-label-cell');
    } else {
      cell.classList.add('comparison-product-header');

      // Style product image if present
      const img = cell.querySelector('img');
      if (img) {
        img.loading = 'lazy';
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'comparison-product-image';
        img.parentNode.insertBefore(imgWrapper, img);
        imgWrapper.appendChild(img);
      }

      // Style product name
      const h3 = cell.querySelector('h3');
      if (h3) h3.classList.add('comparison-product-name');
    }
  });

  // Remaining rows are attribute comparisons
  rows.slice(1).forEach((row, rowIndex) => {
    row.classList.add('comparison-row');
    if (rowIndex % 2 === 1) row.classList.add('comparison-row-alt');

    const cells = [...row.children];
    cells.forEach((cell, cellIndex) => {
      if (cellIndex === 0) {
        cell.classList.add('comparison-label');
      } else {
        cell.classList.add('comparison-value');

        // Check for check/x marks or special values
        const text = cell.textContent.trim().toLowerCase();
        if (text === '✓' || text === 'yes' || text === 'true') {
          cell.innerHTML = '<span class="comparison-check">✓</span>';
          cell.classList.add('comparison-yes');
        } else if (text === '✗' || text === 'no' || text === 'false' || text === '-') {
          cell.innerHTML = '<span class="comparison-x">✗</span>';
          cell.classList.add('comparison-no');
        }
      }
    });
  });

  // Wrap in scrollable container for mobile
  const wrapper = document.createElement('div');
  wrapper.className = 'comparison-table-wrapper';
  block.parentNode.insertBefore(wrapper, block);
  wrapper.appendChild(block);

  // Add loaded class
  setTimeout(() => {
    block.classList.add('loaded');
  }, 100);
}
