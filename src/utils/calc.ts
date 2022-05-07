import { DimensionUnitPair } from "../ts";
import { LinearFunction } from "./linear-algebra";

/**
 * Class representing an object that renders a CSS calc() function
 */
export class Calc extends LinearFunction{
  private sizeUnit: string;
  private viewportUnit: string;

  /**
   * Create new calc object
   * @param {DimensionUnitPair} dimensionUnitPair1 Tuple P1 with a size P1[1] expected at a viewport size P1[0]
   * @param {DimensionUnitPair} dimensionUnitPair2 Tuple P2 with a size P2[1] expected at a viewport size P2[0]
   * @param {string} sizeUnit Unit to be used
   * @param {string} viewportUnit Unit for the ference viewport size
   */
  constructor(dimensionUnitPair1: DimensionUnitPair, dimensionUnitPair2: DimensionUnitPair, sizeUnit: string, viewportUnit: string) {
    super({
      x: dimensionUnitPair1[0],
      y: dimensionUnitPair1[1]
    }, {
      x: dimensionUnitPair2[0],
      y: dimensionUnitPair2[1]
    })

    this.sizeUnit = sizeUnit
    this.viewportUnit = viewportUnit
  }

  /**
   * Render the final calc() function
   * @returns {string} A string representing the calc() function
   */
  render() {
    const base = `${this.intercept.toFixed(3).replace(/\.0+$/,'')}${this.sizeUnit}`
    const increment = `${this.slope.toFixed(3).replace(/\.0+$/,'')}${this.viewportUnit}`

    if (this.slope === 0) {
      return base
    } else if (this.intercept === 0) {
      return increment
    } else {
      return `calc(${base} + ${increment})`
    }
  }
}