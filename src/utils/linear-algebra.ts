/** Class representing a linear function */
export class LinearFunction{
  private _slope: number;
  private _intercept: number;

  /**
   * Create linear function using a slope and an intercept
   * @param {number} slope The slope of the linear function
   * @param {number} intercept The intercept of the linear function
   */
  constructor(slope: number, intercept: number);
  /**
   * Create linear function using two points P1 and P2
   * @param {Point} p1 The point P1
   * @param {Point} p2 The point P2
   */
  constructor(p1: Point, p2: Point);
  constructor(p1OrSlope: Point | number, p2OrIntercept: Point | number) {
    if (typeof p1OrSlope === 'number' && typeof p2OrIntercept === 'number') {
      /** Create the slope using slope and intercept */
      this._slope = p1OrSlope
      this._intercept = p2OrIntercept
    } else {
      /** Create the slope using two points P1 and P2 */
      const p1 = p1OrSlope
      const p2 = p2OrIntercept
  
      if (
        typeof p1 !== 'object'
        || typeof p2 !== 'object'
        || !('x' in p1)
        || !('y' in p1)
        || !('x' in p2)
        || !('y' in p2)
      ) {
        throw new Error()
      }
  
      this._slope = (p2.y - p1.y) / (p2.x - p1.x)
      this._intercept = p1.y - this._slope * p1.x
    }
  }

  /**
   * Create linear function using a point P and a slope
   * @param {Point} p Point P
   * @param {number} slope Slope
   * @returns {LinearFunction} The linear function instance
   */
  static fromPointSlope(p: Point, slope: number) {
    const intercept = slope - slope * p.x - p.y
    return new LinearFunction(slope, intercept)
  }

  /**
   * Get the intersection between two linear functions L1 and L2
   * @param {LinearFunction} l1 Linear function L1
   * @param {LinearFunction} l2 Linear function L2
   * @returns {Point} Point instance marking the point of intersection
   */
  static intersection(l1: LinearFunction, l2: LinearFunction) {
    if (l1.slope === l2.slope) {
      console.warn('Linear functions are parallel')
    }

    const x = (l2.intercept - l1.intercept) / (l1.slope - l2.slope)
    const y = l1.getYFromX(x)

    return new Point(x, y)
  }
  
  /**
   * Get resulting value of y using x
   * @param {number} x The value of x
   * @returns {number} The value of y
   */
  getYFromX(x: number) {
    return this._slope * x + this._intercept
  }

  /**
   * Get resulting value of x using y
   * @param {number} y The value of y
   * @returns {number} The value of x
   */
  getXFromY(y: number) {
    return (y - this._intercept) / this._slope
  }

  /**
   * Calculate minimum distance to point P
   * @param {Point} p Point P
   * @returns Distance to point P
   */
  distanceFrom(p: Point) {
    const inverse = this.inverse
    const adjustedInverse = LinearFunction.fromPointSlope(p, inverse.slope)
    const intersection = LinearFunction.intersection(this, adjustedInverse)

    return Point.distanceBetween(p, intersection)
  }

  /**
   * Get inverse linear function
   * @returns {LinearFunction} The inverse linear function
   */
  get inverse() {
    return new LinearFunction(1 / this._slope, this._intercept)
  }
  
  /**
   * Get intercept
   * @returns {number} The intercept
   */
  get intercept() {
    return this._intercept
  }

  /**
   * Get slope
   * @returns {number} The slope
   */
  get slope() {
    return this._slope
  }
}

/** Class representing a point */
export class Point{
  private _x: number;
  private _y: number;

  /**
   * Create a point
   * @param {number} x Value of x
   * @param {number} y Value of y
   */
  constructor(x: number, y: number) {
    if (!(typeof x === 'number') || !(typeof y === 'number')) {
      throw new TypeError('Point needs two number arguments (x, y)')
    }
    
    this._x = x
    this._y = y
  }

  /**
   * Get value of x
   * @returns {number} The value of x
   */
  get x() {
    return this._x
  }

  /**
   * Get value of y
   * @returns {number} The value of y
   */
  get y() {
    return this._y
  }

  /**
   * Determines if an object has coordinates determined by properties 'x' and 'y' which should be both of the type 'number'
   * @param {any} p Object
   * @returns {boolean} True if it contains the properties
   */
  static hasCoords(p: any) {
    return typeof p.x === 'number' && typeof p.y === 'number'
  }

  /**
   * Calculates the distance between two points P1 and P2
   * @param {Point} p1 Point P1
   * @param {Point} p2 Point P2
   * @returns {number} The distance between points P1 and P2
   */
  static distanceBetween(p1: Point, p2: Point) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  }

  /**
   * Create point based on a relative distance to another point
   * @param {Point} p Reference point
   * @param {number} xVec Distance in x
   * @param {number} yVec Distance in y
   * @returns The new point
   */
  static createFromRelative(p: Point, xVec: number, yVec: number) {
    if (!Point.hasCoords(p)) throw new TypeError()
    return new Point(p.x + xVec, p.y + yVec)
  }
}