import { StateObject } from "./ts";

const baseDOMElement = document.getElementById('css-output')
if (typeof baseDOMElement === 'undefined') {
  throw new Error()
}

function update(newData: StateObject) {

}

export default {
  update
}