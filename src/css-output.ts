import { StateObject } from "./ts"
import { compareProps } from "./utils"
import { Calc } from "./utils/calc"
import { LinearFunction } from "./lib/linear-algebra"
import { emitMessage } from "./message-emitter"

const baseDOMElement = document.getElementById('css-output')
if (typeof baseDOMElement === 'undefined') {
  throw new Error()
}

const calcObject = new Calc()

function update(newData: StateObject) {
  if (baseDOMElement === null) {
    return
  }
  const { sizes: [[x1, y1], [x2, y2]] } = newData

  // Update linear function
  const prevLF = calcObject.linearFunction
  const isLFChanged = !prevLF
    || prevLF.getYFromX(x1) !== y1
    || prevLF.getYFromX(x2) !== y2
  if (isLFChanged) {
    calcObject.linearFunction = new LinearFunction(
      {x: x1, y: y1},
      {x: x2, y: y2}
    )
  }

  // Update config
  const isConfigChanged = !calcObject.config
    || isLFChanged
    || !compareProps(newData, calcObject.config, [
      'sizeUnit', 'viewportUnit', 'growthUnit', 'useProperty',
      'useSelector', 'selectorOutside', 'selectorName', 'isClampedMin',
      'isClampedMax', 'clampMethod'
    ])
  if (isConfigChanged) {
    calcObject.config = {...newData}
  }

  // If linear function or config were updated re-render
  if (isLFChanged || isConfigChanged) {
    // const text = baseDOMElement.getElementsByClassName('css-output__text')[0]
    // text.innerHTML = calcObject.render()
    baseDOMElement.innerHTML = calcObject.render()
  }
}

// const ClipboardItemSaved = window.ClipboardItem

// function copyToClipboard(e: Event) {
//   console.log('CLICK')
//   const cssCode = baseDOMElement?.textContent

//   if (typeof cssCode === 'string' && cssCode.length > 0) {
//     const type = "text/plain"
//     const blob = new Blob([cssCode], { type })
//     const data = [new ClipboardItemSaved({ [type]: blob })]

//     navigator.clipboard.write(data)
//   }
// }

// function emitMessage(message: string, type: 'error' | 'success' | 'warning' = 'success') {
//   const divElement = document.createElement('div')
//   const pElement = document.createElement('p')

//   divElement.className = 'emitted-message'
//   pElement.className = 'emitted-message-text'

//   document.add
// }

async function copyToClipboard(e: Event) {
  const cssCode = baseDOMElement?.textContent

  try {
    if (typeof cssCode !== 'string') {
      throw TypeError(`Copied CSS code is incorrect type: ${typeof cssCode}`)
    }

    await navigator.clipboard.writeText(cssCode)

    emitMessage('✅ CSS copied successfully!')
  } catch (err) {
    console.error('Failed to copy: ', err)
    emitMessage(
      'There has been an error copying the CSS code. Please try again',
      'error'
    )
  }
}

document.getElementById('button-css-clipboard')
  ?.addEventListener('click', copyToClipboard)

export default {
  update
}