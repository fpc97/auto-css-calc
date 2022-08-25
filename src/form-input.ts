import {
  CSSSizeUnits,
  FormInput,
  LocalModel,
  StateObject,
  Store
} from "./ts"
import { isPxOrRelativeMatch, kebabToCamelCase } from "./utils"

const model = <LocalModel>{
  isInitialized: false
}

// Form
const form = <FormInput>document.getElementById('form-input')
const formInputElements = <Array<[string, HTMLInputElement]>>Array.from(form.elements)
  .filter(element => element?.hasAttribute('name'))
  .map(element => [element.getAttribute('name'), element])

// UI control
namespace SetAvailable{
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

  export function selectorOutside(state: boolean) {
    const selectorOutsideInput = form['selector-outside']

    if (!state) {
      selectorOutsideInput.setAttribute('disabled', 'true')
    } else {
      selectorOutsideInput.removeAttribute('disabled')
    }
  }

  export function selectorName(state: boolean) {
    const selectorNameInput = form['selector-name']

    if (!state) {
      selectorNameInput.setAttribute('disabled', 'true')
    } else {
      selectorNameInput.removeAttribute('disabled')
    }
  }

  export function clampMethods(state: boolean) {
    const methodRadioElements = form['clamp-method']
    
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
// function handleFormChange(e: Event) {
//   const currentTarget = <typeof e.currentTarget & HTMLFormElement>e.currentTarget

//   if (currentTarget === null || !model.isInitialized) {
//     return
//   }

//   const target = <HTMLInputElement>e.target
//   const targetName = target.getAttribute('name')

//   if (!targetName) {
//     return
//   }

//   const propertyKey = kebabToCamelCase(targetName) as keyof StateObject
//   const newDataObject = <StateObject>{}

//   switch(targetName) {
//     case 'size-0':
//     case 'size-1':
//     case 'viewport-0':
//     case 'viewport-1':
//       newDataObject.sizes = [
//         [parseFloat(currentTarget['viewport-0'].value), parseFloat(currentTarget['size-0'].value)],
//         [parseFloat(currentTarget['viewport-1'].value), parseFloat(currentTarget['size-1'].value)]
//       ]
//       break
//     case 'viewport-unit':
//     case 'size-unit':
//       const currentValue = target.value as CSSSizeUnits
//       const camelCaseName = propertyKey as 'sizeUnit' | 'viewportUnit'

//       if (currentTarget['follow-conversion'].checked) {
//         const prevData = model.get && model.get()
//         const isConversion = prevData && !isPxOrRelativeMatch(prevData[camelCaseName], currentValue)
  
//         if (isConversion) {
//           const conversionRate = target.value === 'px'
//             ? parseFloat(currentTarget['conversion-rate'].value)
//             : 1 / parseFloat(currentTarget['conversion-rate'].value)
  
//           const sizeIndex = targetName === 'viewport-unit' ? 0 : 1
          
//           newDataObject.sizes = prevData.sizes
//           newDataObject.sizes[0][sizeIndex] *= conversionRate
//           newDataObject.sizes[1][sizeIndex] *= conversionRate
  
//           currentTarget[`${targetName === 'viewport-unit' ? 'viewport' : 'size'}-0`].value = newDataObject.sizes[0][sizeIndex].toString()
//           currentTarget[`${targetName === 'viewport-unit' ? 'viewport' : 'size'}-1`].value = newDataObject.sizes[1][sizeIndex].toString()
//         }
//       }

//       newDataObject[camelCaseName] = currentValue
//       break
//     case 'follow-conversion':
//     case 'use-property':
//     case 'use-selector':
//     case 'selector-outside':
//     case 'is-clamped-min':
//     case 'is-clamped-max':
//       Object.assign(newDataObject, { [propertyKey]: target.checked })
//       break
//     case 'conversion-rate':
//     case 'property-name':
//     case 'selector-name':
//     case 'growth-unit':
//     case 'clamp-method':
//       Object.assign(newDataObject, { [propertyKey]: target.value })
//       break
//     default:
//       return
//   }

//   if (Object.values(newDataObject).length > 0 && model.isInitialized) {
//     model.set(newDataObject)
//   }
// }

function applyChangedFields(e: Event) {
  const newDataObject = <StateObject>{}
  const prevData = model.isInitialized && model.get && JSON.parse(JSON.stringify(model.get()))

  if (typeof prevData !== 'object') {
    return
  }

  formInputElements.forEach(([name, inputElement]) => {
    const inputValue = inputElement.value
    const inputIsChecked = inputElement.checked
    const camelCaseName = <keyof StateObject>kebabToCamelCase(name)

    let applyChanges = false

    switch(name) {
      case 'size-0':
      case 'size-1':
      case 'viewport-0':
      case 'viewport-1':
        const index0 = name.endsWith('0') ? 0 : 1
        const index1 = name.startsWith('viewport') ? 0 : 1

        applyChanges = prevData.sizes[index0][index1] !== parseFloat(inputValue)

        if (applyChanges) {
          newDataObject.sizes = prevData.sizes
          newDataObject.sizes[index0][index1] = parseFloat(inputValue)
        }
        break
        // const currentValue = target.value as CSSSizeUnits
        // const camelCaseName = propertyKey as 'sizeUnit' | 'viewportUnit'
  
        // if (currentTarget['follow-conversion'].checked) {
        //   // const prevData = model.get && model.get()
        //   const isConversion = prevData && !isPxOrRelativeMatch(prevData[camelCaseName], currentValue)
    
        //   if (isConversion) {
        //     const conversionRate = target.value === 'px'
        //       ? parseFloat(currentTarget['conversion-rate'].value)
        //       : 1 / parseFloat(currentTarget['conversion-rate'].value)
    
        //     const sizeIndex = targetName === 'viewport-unit' ? 0 : 1
            
        //     newDataObject.sizes = prevData.sizes
        //     newDataObject.sizes[0][sizeIndex] *= conversionRate
        //     newDataObject.sizes[1][sizeIndex] *= conversionRate
    
        //     currentTarget[`${targetName === 'viewport-unit' ? 'viewport' : 'size'}-0`].value = newDataObject.sizes[0][sizeIndex].toString()
        //     currentTarget[`${targetName === 'viewport-unit' ? 'viewport' : 'size'}-1`].value = newDataObject.sizes[1][sizeIndex].toString()
        //   }
        // }
  
        // newDataObject[camelCaseName] = currentValue
        // break
      case 'follow-conversion':
      case 'use-property':
      case 'use-selector':
      case 'selector-outside':
      case 'is-clamped-min':
      case 'is-clamped-max':
        applyChanges = inputIsChecked !== prevData[camelCaseName]
        if (applyChanges) {
          Object.defineProperty(newDataObject, camelCaseName, { value: inputIsChecked, enumerable: true })
        }
        break
      case 'growth-unit':
      case 'clamp-method':
        if (!inputIsChecked) {
          break
        }
      case 'viewport-unit':
      case 'size-unit':
      case 'property-name':
      case 'selector-name':
        applyChanges = inputValue !== prevData[camelCaseName]
        
        if (applyChanges) {
          Object.defineProperty(newDataObject, camelCaseName, { value: inputValue, enumerable: true })
        }
        break
      case 'conversion-rate':
        applyChanges = parseFloat(inputValue) !== prevData[camelCaseName]
        if (applyChanges) {
          Object.defineProperty(newDataObject, camelCaseName, { value: parseFloat(inputValue), enumerable: true })
        }
        break
      default:
        throw new Error(`Input name ${name} not expected`)
    }
  })

  if (Object.values(newDataObject).length > 0 && model.isInitialized) {
    model.set(newDataObject)
  }
}

// function applyChangedFields(e: Event) {
//   const newDataObject = <StateObject>{}

//   formInputElements.forEach((inputElement, name) => {
//     switch(name) {
//       case 'size-0':
//       case 'size-1':
//       case 'viewport-0':
//       case 'viewport-1':
//         break
//       case 'viewport-unit':
//       case 'size-unit':
//         const currentValue = target.value as CSSSizeUnits
//         const camelCaseName = propertyKey as 'sizeUnit' | 'viewportUnit'
  
//         if (currentTarget['follow-conversion'].checked) {
//           const prevData = model.get && model.get()
//           const isConversion = prevData && !isPxOrRelativeMatch(prevData[camelCaseName], currentValue)
    
//           if (isConversion) {
//             const conversionRate = target.value === 'px'
//               ? parseFloat(currentTarget['conversion-rate'].value)
//               : 1 / parseFloat(currentTarget['conversion-rate'].value)
    
//             const sizeIndex = targetName === 'viewport-unit' ? 0 : 1
            
//             newDataObject.sizes = prevData.sizes
//             newDataObject.sizes[0][sizeIndex] *= conversionRate
//             newDataObject.sizes[1][sizeIndex] *= conversionRate
    
//             currentTarget[`${targetName === 'viewport-unit' ? 'viewport' : 'size'}-0`].value = newDataObject.sizes[0][sizeIndex].toString()
//             currentTarget[`${targetName === 'viewport-unit' ? 'viewport' : 'size'}-1`].value = newDataObject.sizes[1][sizeIndex].toString()
//           }
//         }
  
//         newDataObject[camelCaseName] = currentValue
//         break
//       case 'follow-conversion':
//       case 'use-property':
//       case 'use-selector':
//       case 'selector-outside':
//       case 'is-clamped-min':
//       case 'is-clamped-max':
//         Object.assign(newDataObject, { [propertyKey]: target.checked })
//         break
//       case 'conversion-rate':
//       case 'property-name':
//       case 'selector-name':
//       case 'growth-unit':
//       case 'clamp-method':
//         Object.assign(newDataObject, { [propertyKey]: target.value })
//         break
//       default:
//         return
//     }
//   })
// }

function handleInputDependency(this: HTMLFormElement, e: Event) {
  const target = <typeof e.target & HTMLInputElement>e.target

  const targetName = target.getAttribute('name')
  const isChecked = target.checked

  switch(targetName) {
    case 'viewport-unit':
    case 'size-unit':
      const currentValue = <CSSSizeUnits | null>target.value
      const name = <string>target.getAttribute('name')
      const camelCaseName = <'viewportUnit' | 'sizeUnit'>kebabToCamelCase(name)

      if (this['follow-conversion'].checked && model.isInitialized && currentValue !== null) {
        const prevData = model.get && model.get()
        const isConversion = prevData && !isPxOrRelativeMatch(prevData[camelCaseName], currentValue)
  
        if (isConversion) {
          const conversionRate = target.value === 'px'
            ? parseFloat(this['conversion-rate'].value)
            : 1 / parseFloat(this['conversion-rate'].value)
  
          const sizeIndex = targetName === 'viewport-unit' ? 0 : 1
          
          // newDataObject.sizes = prevData.sizes
          // newDataObject.sizes[0][sizeIndex] *= conversionRate
          // newDataObject.sizes[1][sizeIndex] *= conversionRate
  
          this[`${targetName === 'viewport-unit' ? 'viewport' : 'size'}-0`].value = (prevData.sizes[0][sizeIndex] * conversionRate).toString()
          this[`${targetName === 'viewport-unit' ? 'viewport' : 'size'}-1`].value = (prevData.sizes[1][sizeIndex] * conversionRate).toString()
        }
      }

      // newDataObject[camelCaseName] = currentValue

      break
    case 'follow-conversion':
      SetAvailable.conversionRate(target.checked)
      break
    case 'use-property':
      SetAvailable.propertyName(isChecked)

      if (!isChecked) {
        SetAvailable.propertyName(false)

        SetAvailable.selectorOutside(false)
        this['selector-outside'].checked = false

        SetAvailable.selectorName(false)
        this['use-selector'].checked = false

        // SetAvailable.clampMethods(false)

        if (this['clamp-method'].value === 'media-query') {
          this['is-clamped-min'].checked = false
          this['is-clamped-max'].checked = false
        }
      }
      break
    case 'use-selector':
      SetAvailable.selectorName(isChecked)

      if (isChecked) {
        SetAvailable.propertyName(true)

        this['use-property'].checked = true
      } else {
        this['selector-outside'].checked = false
      }
      break
    case 'selector-outside':
      if (isChecked) {
        this['use-selector'].checked = true
        SetAvailable.selectorName(true)

        this['use-property'].checked = true
        SetAvailable.propertyName(true)
      }
      break
    case 'is-clamped-min':
    case 'is-clamped-max':
      const isOneClampChecked = this['is-clamped-min'].checked || this['is-clamped-max'].checked

      SetAvailable.clampMethods(isOneClampChecked)

      if (isOneClampChecked) {
        if (this['clamp-method'].value === 'media-query') {
          this['use-property'].checked = true
          SetAvailable.propertyName(true)
          SetAvailable.selectorOutside(true)
        }
      } else {
        SetAvailable.selectorOutside(false)
        this['is-clamped-min'].checked = false
        this['is-clamped-max'].checked = false

        this['selector-outside'].checked = false
      }
      break
    case 'clamp-method':
      if (isChecked) {
        SetAvailable.propertyName(true)
        // SetAvailable.clampMethods(true)
        
        if (this['clamp-method'].value === 'media-query') {
          this['use-property'].checked = true
          SetAvailable.selectorOutside(true)
        } else {
          SetAvailable.selectorOutside(false)
        }
      } else if (
        !this['is-clamped-min'].checked
        && !this['is-clamped-max'].checked
      ) {
        SetAvailable.clampMethods(false)
      }
      break
    default:
      return
  }
}

// function toggleDisplayFieldsetOf(inputElement: HTMLInputElement, hide?: boolean) {
//   let currentElement: HTMLElement = inputElement
//   while (currentElement.tagName !== 'FIELDSET' && currentElement.parentElement !== null) {
//     currentElement = currentElement.parentElement
//   }
//   if (currentElement.tagName !== 'FIELDSET') {
//     return
//   }

//   const isHide = hide !== null
//     ? hide
//     : currentElement.style.display !== 'none'

//   if (isHide) {
//     currentElement.style.display = 'none'
//     inputElement.setAttribute('disabled', 'disabled')
//   } else {
//     currentElement.style.display = ''
//     inputElement.removeAttribute('disabled')
//   }
// }

// form.addEventListener('change', handleInputDependency)
// form.addEventListener('change', applyChangedFields)

form.addEventListener('change', function(e: Event) {
  handleInputDependency.call(this, e)
  applyChangedFields.call(this, e)
})

// Update
function update(newData: StateObject) {
  form['size-0'].value = newData.sizes[0][1].toString()
  form['size-1'].value = newData.sizes[1][1].toString()
  form['viewport-0'].value = newData.sizes[0][0].toString()
  form['viewport-1'].value = newData.sizes[1][0].toString()

  Array.from(form['size-unit'].options)
    .forEach(option => option.value === newData.sizeUnit
      ? option.selected = true
      : option.selected = false)
  Array.from(form['viewport-unit'].options)
    .forEach(option => option.value === newData.viewportUnit
      ? option.selected = true
      : option.selected = false)

  form['growth-unit'].forEach(radioNode => radioNode.value === newData.growthUnit
    ? radioNode.checked = true
    : radioNode.checked = false)
  
  form['follow-conversion'].checked = newData.followConversion
  SetAvailable.conversionRate(newData.followConversion)
  form['conversion-rate'].value = newData.conversionRate.toString()

  form['use-property'].checked = newData.useProperty
  form['use-selector'].checked = newData.useSelector
  SetAvailable.selectorOutside((newData.isClampedMax || newData.isClampedMin)
    && newData.clampMethod === 'media-query')
  form['selector-outside'].checked = newData.selectorOutside
  
  form['is-clamped-min'].checked = newData.isClampedMin
  form['is-clamped-max'].checked = newData.isClampedMax

  SetAvailable.clampMethods(newData.isClampedMin || newData.isClampedMax)
  form['clamp-method'].forEach(radioNode => radioNode.value === newData.clampMethod
    ? radioNode.checked = true
    : radioNode.checked = false)

  SetAvailable.propertyName(newData.useProperty)
  form['property-name'].value = newData.propertyName
  
  SetAvailable.selectorName(newData.useSelector)
  form['selector-name'].value = newData.selectorName

  return newData
}


export default {
  initModel(thisModel: Store) {
    Object.assign(model, { set: thisModel.set, get: thisModel.get, isInitialized: true })
    Object.freeze(model)

    update(thisModel.get())
  },
  update
}