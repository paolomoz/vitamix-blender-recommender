/**
 * Product Spotlight Block
 *
 * Highlights a single product with image, name, price, and key details.
 *
 * Actual HTML structure from worker:
 * <div class="product-spotlight">
 *   <div><div><img src="..." alt="..."></div></div>     -- row 0: image
 *   <div><div>Product Name</div></div>                   -- row 1: name
 *   <div><div>Tagline</div></div>                        -- row 2: tagline
 *   <div><div>$699.95</div></div>                        -- row 3: price
 *   <div><div>Features...</div></div>                    -- row 4: features
 *   <div><div>10 years warranty</div></div>              -- row 5: warranty
 *   <div><div><a href="...">Shop Now</a></div></div>     -- row 6: CTA
 * </div>
 */

export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 2) return;

  // Extract content from rows
  const imageRow = rows[0];
  const nameRow = rows[1];
  const taglineRow = rows[2];
  const priceRow = rows[3];
  const featuresRow = rows[4];
  const warrantyRow = rows[5];
  const ctaRow = rows[6];

  // Get product name for actions
  const productName = nameRow?.querySelector('div')?.textContent?.trim() || '';

  // Build structured HTML
  const img = imageRow?.querySelector('img');
  const ctaLink = ctaRow?.querySelector('a');

  block.innerHTML = `
    <div class="product-spotlight-layout">
      <div class="product-spotlight-image">
        ${img ? `<img src="${img.src}" alt="${img.alt || productName}" loading="eager">` : ''}
      </div>
      <div class="product-spotlight-content">
        <h2 class="product-spotlight-name">${productName}</h2>
        ${taglineRow ? `<p class="product-spotlight-tagline">${taglineRow.querySelector('div')?.textContent?.trim() || ''}</p>` : ''}
        ${priceRow ? `<p class="product-spotlight-price">${priceRow.querySelector('div')?.innerHTML || ''}</p>` : ''}
        ${featuresRow ? `<p class="product-spotlight-features">${featuresRow.querySelector('div')?.textContent?.trim() || ''}</p>` : ''}
        ${warrantyRow ? `<p class="product-spotlight-warranty">${warrantyRow.querySelector('div')?.textContent?.trim() || ''}</p>` : ''}
        ${ctaLink ? `<p class="product-spotlight-cta"><a href="${ctaLink.href}" class="button primary">${ctaLink.textContent}</a></p>` : ''}
        <div class="spotlight-actions">
          <button class="spotlight-cta primary" data-action="compare">Compare with others</button>
          <button class="spotlight-cta secondary" data-action="specs">See full specs</button>
          <button class="spotlight-cta secondary" data-action="reviews">Customer reviews</button>
        </div>
      </div>
    </div>
  `;

  // Add click handlers for action buttons
  if (productName) {
    block.querySelectorAll('.spotlight-cta').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        let query = '';
        if (action === 'compare') query = `Compare ${productName} with other Vitamix models`;
        if (action === 'specs') query = `${productName} specifications`;
        if (action === 'reviews') query = `${productName} customer reviews`;
        console.log('[Interactive] Spotlight CTA clicked:', query);
        if (window.startCerebrasGeneration) {
          window.startCerebrasGeneration(query);
        } else {
          window.location.href = `/?q=${encodeURIComponent(query)}`;
        }
      });
    });
  }

  // Add loaded class for animation
  setTimeout(() => {
    block.classList.add('loaded');
  }, 100);
}
