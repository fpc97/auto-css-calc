import {
  CSSSizeUnits,
  CSSViewportUnits,
  FormInput,
  LocalModel,
  StateObject,
  Store
} from "./ts"
// import { kebabToCamelCase } from "./utils"

const model = <LocalModel>{
  isInitialized: false
}

// Form
const form = <FormInput>document.getElementById('form-input')

// UI control
namespace SetDisabled{
  export function conversionRate(state: boolean) {
    const conversionRateInput = form['conversion-rate']

    if (!state) {
      conversionRateInput.setAttribute('disabled', 'true')
    } else {
      conversionRateInput.removeAttribute('disabled')
    }
  }

  export function propertyName(state: boolean) {
    const propertyNameInput = form['property-name']

    // propertyNameInput.setAttribute('disabled', `${state}`)
    if (!state) {
      propertyNameInput.setAttribute('disabled', 'true')
    } else {
      propertyNameInput.removeAttribute('disabled')
    }
  }

  export function clampMethods(state: boolean) {
    const methodRadioElements: RadioNodeList & HTMLElement[] = form['clamp-method']
    
    const methodLegend = methodRadioElements[0]
      .parentElement
      ?.getElementsByTagName('LEGEND')[0]
    
    Array.from(methodRadioElements).forEach(radioElement => {
      // radioElement.setAttribute('disabled', `${state}`)
      if (!state) {
        radioElement.setAttribute('disabled', 'true')
      } else {
        radioElement.removeAttribute('disabled')
      }
    })

    if (methodLegend) {
      if (state) {
        methodLegend.classList.add('disabled')
      } else {
        methodLegend.classList.remove('disabled')
      }
    }
  }
}

// User input
function handleFormChange(this: HTMLFormElement, e: Event) {
  const currentTarget = <typeof e.currentTarget & HTMLInputElement>e.target

  if (currentTarget === null || !model.isInitialized) {
    return
  }
  const newDataObject = <StateObject>{}

  const currentTargetName = currentTarget.getAttribute('name')

  switch(currentTargetName) {
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
    case 'viewport-unit':

      break
    case 'size-unit':

      break
    case 'follow-conversion':
      
      // Form UI disable/enable
      SetDisabled.conversionRate(currentTarget.checked)
      break
    case 'conversion-rate':
      newDataObject.toPxConversion = parseFloat(currentTarget.value)
      break
    // case 'size-unit':
    //   newDataObject.sizeUnit = <CSSSizeUnits>currentTarget.value

    //   const conversionInput = this['to-px-conversion']
    //   const isHideConversion = currentTarget.value === 'px'

    //   toggleDisplayFieldsetOf(conversionInput, isHideConversion)
    //   break
    // case 'viewport-unit':
    //   newDataObject.viewportUnit = <CSSViewportUnits>currentTarget.value
    //   break
    case 'growth-unit':

      break
    case 'use-property':
      // Form UI disable/enable
      SetDisabled.propertyName(currentTarget.checked)

      if (!currentTarget.checked) {
        SetDisabled.clampMethods(false)
        form['is-clamped-min'].checked = false
        form['is-clamped-max'].checked = false
      }
      break
    case 'property-name':

      break
    case 'is-clamped-min':
    case 'is-clamped-max':
      const key = currentTargetName === 'is-clamped-max' ? 'isClampedMax' : 'isClampedMin'
      newDataObject[key] = <boolean>currentTarget.checked

      // Form UI disable/enable
      if (currentTarget.checked) {
        SetDisabled.propertyName(true)
        SetDisabled.clampMethods(true)
        form['use-property'].checked = true
      } else if (
        !form['is-clamped-min'].checked
        && !form['is-clamped-max'].checked
      ) {
        SetDisabled.clampMethods(false)
      }
      break
    case 'clamp-method':

      break
    default:
      return
  }
  
  if (Object.values(newDataObject).length > 0 && model.isInitialized) {
    model.set(newDataObject)
  }
}

function toggleDisplayFieldsetOf(inputElement: HTMLInputElement, hide?: boolean) {
  let currentElement: HTMLElement = inputElement
  while (currentElement.tagName !== 'FIELDSET' && currentElement.parentElement !== null) {
    currentElement = currentElement.parentElement
  }
  if (currentElement.tagName !== 'FIELDSET') {
    return
  }

  const isHide = hide !== null
    ? hide
    : currentElement.style.display !== 'none'

  if (isHide) {
    currentElement.style.display = 'none'
    inputElement.setAttribute('disabled', 'disabled')
  } else {
    currentElement.style.display = ''
    inputElement.removeAttribute('disabled')
  }
}

form.addEventListener('change', handleFormChange)

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