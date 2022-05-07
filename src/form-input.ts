import { CSSSizeUnits, CSSViewportUnits, FormInput, LocalModel, StateObject, Store } from "./ts"

const model = <LocalModel>{
  isInitialized: false
}

// Form
const form = <FormInput>document.getElementById('form-input')

// User input
form.addEventListener('change', e => {
  const currentTarget = <typeof e.currentTarget & HTMLInputElement>e.target

  if (currentTarget === null || !model.isInitialized) {
    return
  }
  const newDataObject = <StateObject>{}

  switch(currentTarget.getAttribute('name')) {
    case 'size-0':
    case 'size-1':
    case 'viewport-0':
    case 'viewport-1':
      const target = <FormInput>e.currentTarget
      newDataObject.sizes = [
        [parseInt(target['viewport-0'].value), parseInt(target['size-0'].value)],
        [parseInt(target['viewport-1'].value), parseInt(target['size-1'].value)]
      ]
      break
    case 'to-px-conversion':
      newDataObject.toPxConversion = parseFloat(currentTarget.value)
      break
    case 'size-unit':
      newDataObject.sizeUnit = <CSSSizeUnits>currentTarget.value
      break
    case 'viewport-unit':
      newDataObject.viewportUnit = <CSSViewportUnits>currentTarget.value
      break
    default:
      return
  }
  
  if (Object.values(newDataObject).length > 0 && model.isInitialized) {
    model.set(newDataObject)
  }
})

// Update
function update(newData: StateObject) {
  form['size-0'].value = newData.sizes[0][1].toString()
  form['size-1'].value = newData.sizes[1][1].toString()
  form['viewport-0'].value = newData.sizes[0][0].toString()
  form['viewport-1'].value = newData.sizes[1][0].toString()

  // form['unit'].value = newData.unit.toString()
  // Array.from(form['unit']).find(radioNode => radioNode.value === newData.unit)
  form['size-unit'].forEach(radioNode => radioNode.value === newData.sizeUnit
    ? radioNode.checked = true
    : radioNode.checked = false)

  form['viewport-unit'].forEach(radioNode => radioNode.value === newData.viewportUnit
    ? radioNode.checked = true
    : radioNode.checked = false)

  form['to-px-conversion'].value = newData.toPxConversion.toString()

  return newData
}


export default {
  initModel(thisModel: Store) {
    Object.assign(model, { set: thisModel.set, isInitialized: true })
    Object.freeze(model)

    update(thisModel.get())
  },
  update
}