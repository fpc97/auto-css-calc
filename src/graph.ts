const model: {
  set?: (newData: any) => void,
  initialized: boolean
} = {
  initialized: false
}

function update(newData: any) {

  return newData
}


export default {
  initModel(thisModel: { set(newData: any): void }) {
    model.set = thisModel.set
    model.initialized = true
    Object.freeze(model)
  },
  update
}
