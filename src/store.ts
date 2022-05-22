import { StateObject } from "./ts"
import { Observable } from "./utils"
import { retrieveLocalData, saveLocalData } from "./utils/local-storage"


const state: StateObject = retrieveLocalData() || {
  sizeUnit: 'px',
  viewportUnit: 'vw',
  sizes: [
    [200, 14],
    [400, 21]
  ],
  toPxConversion: 16,
  isClampedMin: false,
  isClampedMax: false
}
Object.seal(state)

const observable = new Observable<StateObject>()

function modifyData(newProps: Partial<StateObject>) {
  const newData: Partial<StateObject> = {}

  const entries = Object.entries(newProps) as [keyof StateObject, any][]

  entries.forEach(([key, value]) => {
    if (JSON.stringify(state[key]) !== JSON.stringify(value)) {
      newData[key] = value
    }
  })

  if (newData.sizes) {
    newData.sizes[0][0] = parseFloat(newData.sizes[0][0].toFixed(2))
    newData.sizes[0][1] = parseFloat(newData.sizes[0][1].toFixed(2))
    newData.sizes[1][0] = parseFloat(newData.sizes[1][0].toFixed(2))
    newData.sizes[1][1] = parseFloat(newData.sizes[1][1].toFixed(2))
  }

  if (Object.entries(newData).length === 0) {
    return
  }

  Object.assign(state, newData)
  observable.notify(state)
  saveLocalData(state)
}

export default {
  subscribe(cb: (newData: StateObject) => void, initialize: boolean = true) {
    observable.subscribe.call(observable, cb)

    if (initialize) {
      cb(state)
    }
  },
  unsubscribe: observable.unsubscribe.bind(observable),
  get() {
    return state
  },
  set: modifyData
}