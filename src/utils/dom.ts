/**
 * Render HTML for a span element with a specified class name
 * @param {string} content Text content of the element
 * @param {string} className Class name of the element
 * @returns {string} Final markup code
 */
export function renderSpanClass(content: string, className?: string) {
  return `<span${className ? ` class="${className}"` : ''}>${content}</span>`
}

/**
 * Copy text to clipboard
 * @param {string} content Content to copy
 * @returns {Promise} Promise containing status of the operation
 */
export async function copyToClipboard(content: string): Promise<
  { success: true }
  | { success: false, error: any }
> {
  try {
    await navigator.clipboard.writeText(content)

    return { success: true }
  } catch(error) {
    return { success: false, error }
  }
}