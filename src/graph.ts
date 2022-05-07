import GraphCanvas from "./canvas"
import { StateObject, Store } from "./ts"

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 400

const model: {
  set?: (newData: any) => void,
  initialized: boolean
} = {
  initialized: false
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
    object.refresh()

    Object.assign(canvas, { object, isInitialized: true })
  }
}

export default {
  initModel(thisModel: Store) {
    model.set = thisModel.set
    model.initialized = true
    Object.freeze(model)
  },
  update
}
