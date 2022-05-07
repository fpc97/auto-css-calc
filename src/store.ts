import { StateObject } from "./ts"
import { Observable } from "./utils"

const state: StateObject = Object.seal({
  sizeUnit: 'px',
  viewportUnit: 'vw',
  sizes: [
    [200, 14],
    [400, 21]
  ],
  toPxConversion: 16
})

const observable = new Observable<StateObject>()

function modifyData(newProps: Partial<StateObject>) {
  const newData: Partial<StateObject> = {}

  const entries = Object.entries(newProps) as [keyof StateObject, any][]

  entries.forEach(([key, value]) => {
    if (state[key] !== value) {
      newData[key] = value
    }
  })

  if (Object.entries(newData).length === 0) {
    return
  }

  Object.assign(state, newData)
  observable.notify(state)
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