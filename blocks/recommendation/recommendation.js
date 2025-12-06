/**
 * Recommendation Block
 * Displays a product recommendation with empathetic response structure:
 * Validation -> Understanding -> Recommendation with reasoning -> Outcome visualization
 */

export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length === 0) return;

  // Parse rows dynamically based on type markers
  let title = 'Our Recommendation';
  let validation = null;
  let understanding = null;
  let image = null;
  let name = '';
  let price = '';
  let reasoning = '';
  let visualization = null;
  let ctaLink = null;

  // Process each row
  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 0) return;

    const firstCell = cells[0]?.textContent?.trim().toLowerCase();

    // Check for typed rows (empathetic components)
    if (firstCell === 'validation' && cells[1]) {
      validation = cells[1].textContent?.trim();
    } else if (firstCell === 'understanding' && cells[1]) {
      understanding = cells[1].textContent?.trim();
    } else if (firstCell === 'proof' && cells[1]) {
      reasoning = cells[1].textContent?.trim();
    } else if (firstCell === 'reasoning' && cells[1]) {
      reasoning = cells[1].textContent?.trim();
    } else if (firstCell === 'visualization' && cells[1]) {
      visualization = cells[1].textContent?.trim();
    } else if (row.querySelector('img')) {
      image = row.querySelector('img');
    } else if (row.querySelector('a')) {
      ctaLink = row.querySelector('a');
    } else {
      // Determine type by content pattern
      const text = cells[0]?.textContent?.trim() || '';

      if (text.match(/^(our recommendation|recommended|for you)/i)) {
        title = text;
      } else if (text.match(/^\$\d+/)) {
        price = text;
      } else if (text.match(/^ascent|^vitamix|^e310|^5200|explorian/i)) {
        name = text;
      } else if (!name && text.length > 0 && !text.includes('$')) {
        // Likely the product name
        name = text;
      }
    }
  });

  // Build the HTML with empathetic structure
  let html = '<div class="recommendation-content">';

  html += `<p class="recommendation-label">${title}</p>`;

  // Validation: "I hear you, this is a real challenge"
  if (validation) {
    html += `<p class="recommendation-validation">${validation}</p>`;
  }

  // Understanding: "You need X. The product delivers exactly that."
  if (understanding) {
    html += `<p class="recommendation-understanding">${understanding}</p>`;
  }

  // Product image
  if (image) {
    html += `<div class="recommendation-image"><img src="${image.src}" alt="${image.alt || name}"></div>`;
  }

  // Product name and price
  html += `<h2 class="recommendation-name">${name}</h2>`;
  html += `<p class="recommendation-price">${price}</p>`;

  // Reasoning/proof point
  if (reasoning) {
    html += `<p class="recommendation-reasoning">${reasoning}</p>`;
  }

  // Visualization: "Imagine..."
  if (visualization) {
    html += `<p class="recommendation-visualization">${visualization}</p>`;
  }

  // CTA
  if (ctaLink) {
    html += `<a href="${ctaLink.href}" class="recommendation-cta">${ctaLink.textContent}</a>`;
  }

  html += '</div>';

  block.innerHTML = html;

  // Add click handlers for interactive follow-up
  const productName = name;
  if (productName) {
    block.querySelectorAll('.recommendation-cta').forEach((cta) => {
      cta.addEventListener('click', (e) => {
        // Track the click for session context
        if (window.SessionContextManager) {
          window.SessionContextManager.trackProductClick(productName);
        }
      });
    });
  }

  setTimeout(() => block.classList.add('loaded'), 100);
}
