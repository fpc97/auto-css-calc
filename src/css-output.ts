import { StateObject } from "./ts"
import { Calc } from "./utils/calc"

const baseDOMElement = document.getElementById('css-output')
if (typeof baseDOMElement === 'undefined') {
  throw new Error()
}

function writeCalc<Content extends string>(content: Content): `calc(${Content})` {
  return `calc(${content})`
}

function update(newData: StateObject) {
  if (baseDOMElement === null) {
    return
  }

  const text = baseDOMElement.getElementsByClassName('text')[0]

  const calc = new Calc(newData.sizes[0], newData.sizes[1], newData.sizeUnit, newData.viewportUnit)

  text.textContent = calc.render()
}

export default {
  update
}