/**
 * Render HTML for a span element with a specified class name
 * @param {string} content Text content of the element
 * @param {string} className Class name of the element
 * @returns {string} Final markup code
 */
export function renderSpanClass(content: string, className?: string) {
  return `<span${className ? ` class="${className}"` : ''}>${content}</span>`
}

export function renderDivBlock(content: string) {
  return `<span class='block'>${content}</span>`
}