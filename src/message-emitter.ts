const wrapperElement = document.getElementById('emitted-message')
const paragraphElement = wrapperElement?.firstElementChild

// Delete className leftover from previous session
if (wrapperElement?.classList.contains('start')) {
  wrapperElement.classList.remove('start')
}

const possibleTypes = ['success', 'error', 'warning'] as const
type PossibleTypes = typeof possibleTypes

/**
 * Show a pop-up message at the top of the screen
 * @param {string} content Content of the message
 * @param {string} type The type of message it is
 */
export async function emitMessage(content: string, type: PossibleTypes[number] = possibleTypes[0]) {
  if (!paragraphElement || !wrapperElement) {
    console.warn(`Unable to emit ${type} message: ${content}`)
    return
  }

  if (wrapperElement.classList.contains('start')) {
    // 1. Remove className containing animation
    wrapperElement.classList.remove('start')
    // 2. Trigger a reflow (this allows us to do everything in the same loop
    // instead of using a timeout)
    void wrapperElement.offsetWidth
  } else {
    // If there isn't a 'start' className we ensure the listener is set only
    // once - eventually dispatched when the animation has ended by itself
    // (and not when interrupted by a trigger when it's still running)
    wrapperElement.addEventListener('animationend', () => {
      wrapperElement.classList.remove('start')
    }, { once: true })
  }

  // Set content after removing class 
  // Prevent flash with new message during previous animation
  paragraphElement.textContent = content

  // The previous type className is only removed if it needs to be changed
  if (!wrapperElement.classList.contains(type)) {
    possibleTypes.forEach(
      messageType => messageType === type
      ? wrapperElement.classList.add(messageType)
      : wrapperElement.classList.remove(messageType)
    )
  }

  // 3. Reassign class containing animation to trigger it
  wrapperElement.classList.add('start')
}