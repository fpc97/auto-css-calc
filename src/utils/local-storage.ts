import { CSSSizeUnits, CSSViewportUnits, StateObject } from "../ts"

export function retrieveLocalData(): StateObject | null {
  try {
    const sizeUnit = <CSSSizeUnits>localStorage.getItem('sizeUnit')
  
    if (sizeUnit === null) {
      return null
    }
  
    const viewportUnit = <CSSViewportUnits>localStorage.getItem('viewportUnit')
    const size1 = <string>localStorage.getItem('size1')
    const size2 = <string>localStorage.getItem('size2')
    const viewport1 = <string>localStorage.getItem('viewport1')
    const viewport2 = <string>localStorage.getItem('viewport2')
    const toPxConversion = <string>localStorage.getItem('toPxConversion')
    const isClampedMin = <string>localStorage.getItem('isCLampedMin')
    const isClampedMax = <string>localStorage.getItem('isCLampedMax')
  
    return {
      sizeUnit,
      viewportUnit,
      sizes: [
        [parseFloat(viewport1), parseFloat(size1)],
        [parseFloat(viewport2), parseFloat(size2)]
      ],
      toPxConversion: parseFloat(toPxConversion),
      isClampedMin: (isClampedMin === 'true'),
      isClampedMax: (isClampedMax === 'true')
    }
  } catch(e) {
    console.error('There was an error fetching the local data')
    return null
  }
}

export function saveLocalData(data: StateObject) {
  localStorage.setItem('sizeUnit', data.sizeUnit)
  localStorage.setItem('viewportUnit', data.viewportUnit)
  localStorage.setItem('viewport1',data.sizes[0][0].toString())
  localStorage.setItem('viewport2',data.sizes[1][0].toString())
  localStorage.setItem('size1', data.sizes[0][1].toString())
  localStorage.setItem('size2',data.sizes[1][1].toString())
  localStorage.setItem('toPxConversion', data.toPxConversion.toString())
  localStorage.setItem('isCLampedMin', data.isClampedMin.toString())
  localStorage.setItem('isCLampedMax', data.isClampedMax.toString())
}