import { StateObject } from "./ts"
import { compareProps } from "./utils"
import { Calc } from "./utils/calc"
import { LinearFunction } from "./lib/linear-algebra"
import { emitMessage } from "./message-emitter"
import { copyToClipboard } from "./utils/dom"

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

async function copyCSS() {
  const cssCode = baseDOMElement?.textContent

  if (typeof cssCode !== 'string') {
    emitMessage(
      'There has been an error copying the CSS code. Please, try again',
      'error'
    )
    return
  }

  const status = await copyToClipboard(cssCode)

  if (status.success) {
    emitMessage('✅ CSS copied successfully!')
  } else {
    emitMessage(
      'There has been an error copying the CSS code. Please, try again',
      'error'
    )
  }
}

document.getElementById('button-css-clipboard')
  ?.addEventListener('click', copyCSS)

export default {
  update
}