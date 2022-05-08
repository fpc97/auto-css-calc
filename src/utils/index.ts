import { KeysOrType } from "../ts"

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
 * @returns A number in the range [min, max]
 */
export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}

/**
 * Generate array with adjacent array members paired into subarrays
 * 
 * i.e: [1, 2, 3, 4] -> [[1, 2], [2, 3], [3, 4]]
 * @param {array} arr Array
 * @returns Array with subarrays with paired elements
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
 * @returns String in camel case
 */
export function kebabToCamelCase(str: string): string {
  const arr = str.split('-')
  const capital = arr.map((item, index) => index ? item.charAt(0).toUpperCase() + item.slice(1).toLowerCase() : item.toLowerCase())
  const capitalString = capital.join("")

  return capitalString
}