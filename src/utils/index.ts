import { CSSSizeUnits, KeysOrType } from "../ts"

/**
 * Class representing an observable object
 * The shape of the data can be specified as a type parameter
 */
export class Observable<Data>{
  /** Array of callbacks to be called every time the data is updated */
  private observers: ((updatedData: any) => void)[]

  /**
   * Create new instance of observable which will store a list of callbacks to be called
   * when a specific data object is updated
   */
  constructor() {
    this.observers = []
  }
  
  /**
   * Add callback to be called when the data is updated
   * @param cb Function which takes a parameter with the shape of the modified data object
   */
  subscribe(cb: (updatedData: KeysOrType<Data>) => void) {
    this.observers.push(cb)
  }

  /**
   * Remove previously added callback from the list
   * @param cb Exact same function object added previously
   */
  unsubscribe(cb: (updatedData: KeysOrType<Data>) => void) {
    this.observers = this.observers.filter(observer => observer !== cb)
  }

  /**
   * Call all the subscribed callbacks with the updated data
   * @param data Updated data object
   */
  notify(data: KeysOrType<Data>) {
    this.observers.forEach(observer => observer(data))
  }
}

/**
 * Returns a number whose value is limited to the given range
 * @param {number} n The number to be clamped
 * @param {number} min The lower boundary of the output range
 * @param {number} max The upper boundary of the output range
 * @returns {number} A number in the range [min, max]
 */
export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}

/**
 * Returns a number whose value is limited to the given range with a specified
 * margin
 * @param {number} n The number to be clamped
 * @param {number} min The lower boundary of the output range
 * @param {number} max The upper boundary of the output range
 * @param {number} margin Distance away from the limits the final result will be
 * @returns {number} A number in the range [min, max]
 */
export function clampMargin(n: number, min: number, max: number, margin: number) {
  return Math.min(Math.max(n, min + margin), max - margin)
}

/**
 * Generate array with adjacent array members paired into subarrays
 * 
 * i.e: [1, 2, 3, 4] -> [[1, 2], [2, 3], [3, 4]]
 * @param {array} arr Array
 * @returns {array} Array with subarrays with paired elements
 */
export function getArrayPairsOf<T>(arr: T[]): [T, T][] {
  const pairs = arr.map((element, i, array) => (
    i < array.length ? [element, array[i + 1]] : [element, element]
  ) as [typeof element, typeof element])
  pairs.pop()

  return pairs
}

/**
 * Transform text in kebab case to camel case
 * 
 * i.e: my-kebab-text -> myKebabText
 * @param {string} str String to change
 * @returns {string} String in camel case
 */
export function kebabToCamelCase(str: string): string {
  const arr = str.split('-')
  const capital = arr.map((item, index) => index ? item.charAt(0).toUpperCase() + item.slice(1).toLowerCase() : item.toLowerCase())
  const capitalString = capital.join("")

  return capitalString
}

/**
 * Remove trailing zeros from a string representation of a number
 * 
 * i.e:
 * - "1.450" -> "1.45"
 * - "26.000" -> "26"
 * @param {string} str String representing a number 
 * @returns {string} String with number's trailing zeros removed
 */
export function removeTrailingZeros(str: string): string {
  const strFloat = parseFloat(str)

  if (typeof strFloat !== 'number') {
    throw new TypeError('String provided does not represent a number')
  }

  return strFloat.toString()
}

/**
 * Returns true if the two values are either both 'px' or both one of 'em' and 'rem'
 * 
 * i.e:
 * - ("em", "rem") -> true
 * - ("em", "em") -> true
 * - ("px", "px") -> true
 * - ("px", "rem") -> false
 * @param {CSSSizeUnits} v1 First unit
 * @param {CSSSizeUnits} v2 Second unit
 * @returns {boolean} Boolean indicating if the units match
 */
export function isPxOrRelativeMatch(v1: CSSSizeUnits, v2: CSSSizeUnits) {
  return (v1 === 'px' && v2 === 'px') || (v1.endsWith('em') && v2.endsWith('em'))
}

/**
 * Composes many functions to run one after the other
 * 
 * Tweaked from the regular 'compose' to apply the parent's 'this'
 * 
 * @param {Function[]} fns All the functions
 * @returns {Function} A function that's composed of all the functions passed as arguments
 */
export function compose(this: any, ...fns: Function[]) {
  const that = this
  return function (...args: any[]) {
    return fns.reduceRight((res, fn) => {
      return [fn.call(that, ...res)]
    }, args)[0]
  }
}

/**
 * Compares specified properties between two objects
 * 
 * Returns 'true' if they're all equal and 'false' if at least one property has different values between the two objects
 * 
 * If one or both objects are missing a specified property that property is not counted
 * 
 * i.e:
 * - ({a: 1}, {a: 1}, ['a']) -> true
 * - ({a: 1}, {b: 1}, ['a']) -> true
 * - ({b: 1}, {b: 1}, ['a']) -> true
 * - ({a: 2}, {a: 1}, ['a']) -> false
 * 
 * @param {Object} obj1 Object 1
 * @param {Object} obj2 Object 2
 * @param {Array} propNames Names of all properties to be compared
 * @returns {Function} A function that's composed of all the functions passed as arguments
 */
export function compareProps(
  obj1: {[k: string|number]: any},
  obj2: {[k: string|number]: any},
  propNames: Array<string|number>
) {
  return !propNames.some(propName =>
    obj1[propName] !== 'undefined'
    && obj2[propName] !== 'undefined'
    && JSON.stringify(obj1[propName]) !== JSON.stringify(obj2[propName])
  )
}

/**
 * If it exists, removes semicolon at the end of string
 * 
 * @param {string} str String that may have semicolon at the end
 * @returns String without semicolon at the end
 */
export function removeFinalSemicolon(str: string) {
  return str[str.length - 1] !== ';' ? str : str.slice(0, str.length - 2)
}