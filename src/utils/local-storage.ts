import { StateObject } from "../ts"

const defaultData: StateObject = {
  sizes: [[200, 16], [400, 21]],
  sizeUnit: 'px',
  viewportUnit: 'px',
  followConversion: false,
  conversionRate: 16,
  growthUnit: 'vw',
  useProperty: false,
  propertyName: 'font-size',
  useSelector: false,
  selectorOutside: false,
  selectorName: '.container',
  isClampedMin: false,
  isClampedMax: false,
  clampMethod: 'media-query'
}
Object.seal(defaultData)

const dataKeys = Object.keys(defaultData) as Array<keyof StateObject>

export function retrieveDefaultData(): StateObject {
  return defaultData
}

export function retrieveLocalData(): StateObject | null {
  try {
    let missingData = false

    const retrievedDataEntries = dataKeys.map(dataName => {
      const dataRaw = localStorage.getItem(dataName)

      if (dataRaw === null) {
        missingData = true
      }

      const dataParsed = dataRaw === null || typeof defaultData[dataName] === 'string'
        ? dataRaw
        : JSON.parse(dataRaw)
      
      return [dataName, dataParsed]
    })

    return missingData ? null : Object.fromEntries(retrievedDataEntries)
  } catch(e) {
    console.error('There was an error retrieving data from localStorage', e)
    return null
  }
}

export function saveLocalData(newData: StateObject) {
  try {
    dataKeys.map(dataName => {
      const dataString = typeof newData[dataName] === 'object'
        ? JSON.stringify(newData[dataName])
        : newData[dataName].toString()
  
      localStorage.setItem(dataName, dataString)
    })
  } catch(e) {
    console.error('There was an error saving data to localStorage', e)
  }
}