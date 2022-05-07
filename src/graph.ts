import GraphCanvas from "./canvas"
import { LocalModel, StateObject, Store } from "./ts"

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 400

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
    const object = new GraphCanvas(canvasHTMLElement, CANVAS_WIDTH, CANVAS_HEIGHT, newData)

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
