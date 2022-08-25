import { StateObject } from "./ts"
import { clamp, clampMargin, Observable } from "./utils"
import { retrieveDefaultData, retrieveLocalData, saveLocalData } from "./utils/local-storage"

export const MAX_SIZE = 9999
export const MAX_VIEWPORT = 9999

const state: StateObject = retrieveLocalData() || retrieveDefaultData()

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
    if (newData.sizes[0][0] !== state.sizes[0][0]) {
      newData.sizes[0][0] = clamp(newData.sizes[0][0], 0, newData.sizes[1][0] - 1)
    }
    if (newData.sizes[1][0] !== state.sizes[1][0]) {
      newData.sizes[1][0] = clamp(newData.sizes[1][0], newData.sizes[0][0] - 1, MAX_VIEWPORT)
    }
    
    if (newData.sizes[0][1] !== state.sizes[0][1]) {
      newData.sizes[0][1] = clamp(newData.sizes[0][1], 0, MAX_SIZE)
    }
    if (newData.sizes[1][1] !== state.sizes[1][1]) {
      newData.sizes[1][1] = clamp(newData.sizes[1][1], 0, MAX_SIZE)
    }
  }

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