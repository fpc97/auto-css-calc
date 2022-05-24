import GraphCanvas from "./canvas"
import { LocalModel, StateObject, Store } from "./ts"

const DEFAULT_CANVAS_WIDTH = 800
const DEFAULT_CANVAS_HEIGHT = 400

const model: LocalModel = {
  isInitialized: false
}

const canvasHTMLElement = <HTMLCanvasElement>document.getElementById('graph')
if (typeof canvasHTMLElement === 'undefined') {
  throw new Error()
}

type Canvas = {
  isInitialized: false;
  object: null;
} | {
  isInitialized: true;
  object: GraphCanvas;
}
const canvas: Canvas = {
  isInitialized: false,
  object: null
}

function update(newData: StateObject) {
  if (canvas.isInitialized) {
    canvas.object.update(newData)
  } else {
    const htmlWidth = canvasHTMLElement.getAttribute('width')
    const htmlHeight = canvasHTMLElement.getAttribute('height')

    const width = htmlWidth ? parseInt(htmlWidth) : DEFAULT_CANVAS_WIDTH
    const height = htmlHeight ? parseInt(htmlHeight) : DEFAULT_CANVAS_HEIGHT

    const object = new GraphCanvas(canvasHTMLElement, width, height, newData)

    Object.assign(canvas, { object, isInitialized: true })

    if (model.isInitialized) {
      object.onChange = model.set
    } else {
      console.error('LocalModel for graph not initialized')
    }
  }
}

export default {
  initModel(thisModel: Store) {
    Object.assign(model, {set: thisModel.set, isInitialized: true})
    // model.set = thisModel.set
    // model.isInitialized = true
    Object.freeze(model)
  },
  update
}
