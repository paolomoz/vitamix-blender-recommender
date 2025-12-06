/**
 * Hero Question Block
 *
 * Opening hero that displays the user's question/query
 * with a contextual title and subtitle.
 *
 * Structure:
 * <div class="hero-question">
 *   <div>
 *     <div>Title text</div>
 *     <div>Subtitle/query text</div>
 *   </div>
 * </div>
 */

export default function decorate(block) {
  const rows = [...block.children];

  // Extract content from rows
  const title = rows[0]?.querySelector('div')?.textContent?.trim() || '';
  const subtitle = rows[1]?.querySelector('div')?.textContent?.trim() || '';

  // Build structured content
  block.innerHTML = `
    <div class="hero-question-content">
      <h1 class="hero-question-title">${title}</h1>
      ${subtitle ? `<p class="hero-question-subtitle">${subtitle}</p>` : ''}
    </div>
  `;

  // Add animation class after a brief delay
  setTimeout(() => {
    block.classList.add('loaded');
  }, 100);
}
