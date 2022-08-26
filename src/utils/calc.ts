import { removeTrailingZeros, compose } from ".";
import { StateObject } from "../ts";
import { LinearFunction } from "../lib/linear-algebra";
import { renderSpanClass } from "./dom";

/**
 * Class representing an object that renders a CSS calc() function
 */
export class Calc{
  private static readonly CLASSNAME_FUNCTION = 'func';
  private static readonly CLASSNAME_AT_RULE = 'at-rule';
  private static readonly CLASSNAME_SELECTOR = 'selec';
  private static readonly CLASSNAME_PROPERTY = 'prop';
  private static readonly CLASSNAME_VALUE = 'val';

  private _config: StateObject | null;
  // private incrementPercentage: number
  
  private _linearFunction: LinearFunction | null;

  /**
   * Create new calc object
   * @param {StateObject} config Properties to be used to create the CSS code
   */
  constructor(
    config?: StateObject,
    linearFunction?: LinearFunction
  ) {
    this._linearFunction = linearFunction || null

    this._config = config || null
  }

  set linearFunction(newLinearFunction: LinearFunction | null) {
    this._linearFunction = newLinearFunction || null
  }
  get linearFunction(): LinearFunction | null {
    return this._linearFunction
  }

  set config(newConfig: StateObject | null) {
    this._config = newConfig
  }
  get config(): StateObject | null {
    return this._config
  }

  /**
   * Generate CSS property
   * 
   * @param {string} content CSS to be contained by this element
   * @returns {string} The resulting property
   */
  private renderProperty(content: string) {
    return `${
      renderSpanClass(this.config?.propertyName || '', Calc.CLASSNAME_PROPERTY)
    }: ${
      content
    };`
  }

  /**
   * Generate CSS selector with block
   * 
   * @param {string} content CSS to be contained by this element
   * @returns {string} The resulting CSS selector
   */
  private renderSelector(content: string) {
    return `${
      renderSpanClass(this.config?.selectorName || '', Calc.CLASSNAME_SELECTOR)
    } {${content}}`
  }

  /**
   * Generate media query at minimum viewport size
   * 
   * @param {string} content CSS to be contained by this element
   * @returns {string} The resulting media query
   */
  // private renderMediaQueryMin(content: string) {
  //   return `${
  //     renderSpanClass('@media', Calc.CLASSNAME_AT_RULE)
  //   } (${
  //     renderSpanClass('min-width', Calc.CLASSNAME_SELECTOR)
  //   }: ${
  //     renderSpanClass(
  //       (this.config?.sizes[0][1].toString() || '')
  //       + (this.config?.growthUnit || ''),
  //       Calc.CLASSNAME_VALUE)
  //   }) {${content}}`
  // }

  private renderMediaQuery(content: string, max: boolean = false) {
    const size = max ? this.config?.sizes[1][0] : this.config?.sizes[0][0]

    return `${
      renderSpanClass('@media', Calc.CLASSNAME_AT_RULE)
    } (${
      renderSpanClass('min-width', Calc.CLASSNAME_PROPERTY)
    }: ${
      renderSpanClass(
        (size?.toString() || '')
        + (this.config?.sizeUnit || ''),
        Calc.CLASSNAME_VALUE)
    }) {${content}}`
  }
  
  /**
   * Generate media query at maximum viewport size
   * 
   * @param {string} content CSS to be contained by this element
   * @returns {string} The resulting media query
   */
  // private renderMediaQueryMax(content: string) {
  //   return `${
  //     renderSpanClass('@media', Calc.CLASSNAME_AT_RULE)
  //   } (${
  //     renderSpanClass('min-width', Calc.CLASSNAME_SELECTOR)
  //   }: ${
  //     renderSpanClass(
  //       (this.config?.sizes[1][1].toString() || '')
  //       + (this.config?.growthUnit || ''),
  //       Calc.CLASSNAME_VALUE)
  //   }) {${content}}`
  // }

  private renderMediaQueryMin(content: string) {
    return this.renderMediaQuery(content, false)
  }
  private renderMediaQueryMax(content: string) {
    return this.renderMediaQuery(content, true)
  }

  /**
   * Generate sizing system using media queries
   * 
   * Decides which media queries and base values are to be used
   * according to the config
   * 
   * @param {string} content CSS to be contained by this element
   * @returns {string} The resulting media query
   */
  private renderMediaQueries() {
    // Media queries
    const isSelectorInside = this.config?.useSelector
      && !this.config?.selectorOutside
    const renderVals = isSelectorInside
      ? compose.call(this, this.renderSelector, this.renderProperty)
        .bind(this)
      : this.renderProperty.bind(this)

    const minVal = renderVals(
        renderSpanClass(`${
          this.config?.sizes[0][1]
        }${
          this.config?.sizeUnit
        }`,
        `${Calc.CLASSNAME_VALUE}`
      )
    )
    const maxVal = renderVals(
      renderSpanClass(
        `${
          this.config?.sizes[1][1]
        }${
          this.config?.sizeUnit
        }`,
        `${Calc.CLASSNAME_VALUE}`
      )
    )
    const calc = renderVals(this.renderCalc())

    let cssOutput = ''
    
    if (this.config?.isClampedMin) {
      cssOutput += minVal
      cssOutput += this.renderMediaQueryMin(calc)
    } else {
      cssOutput += calc
    }

    if (this.config?.isClampedMax) {
      cssOutput += this.renderMediaQueryMax(maxVal)
    }

    return cssOutput
  }

  /**
   * Generate string with nested min() and max() functions
   * 
   * @param {string} content CSS to be contained by this element
   * @returns {string} The resulting min(max()) combination
   */
  private renderMinMax(content: string) {
    let css = content

    const minVal = renderSpanClass(`${
      this.config?.sizes[0][0]
    }${
      this.config?.sizeUnit
    }`, Calc.CLASSNAME_VALUE)

    const maxVal = renderSpanClass(`${
      this.config?.sizes[1][0]
    }${
      this.config?.sizeUnit
    }`, Calc.CLASSNAME_VALUE)

    if (this.config?.isClampedMin) {
      css = `${
        renderSpanClass('max', Calc.CLASSNAME_FUNCTION)
      }(${
        minVal
      }, ${
        css
      })`
    }

    if (this.config?.isClampedMax) {
      css = `${
        renderSpanClass('min', Calc.CLASSNAME_FUNCTION)
      }(${
        css
      }, ${
        maxVal
      })`
    }

    return css
  }

  /**
   * Generate string with sum of CSS units
   * 
   * @returns {string} The resulting sum of CSS units
   */
  private renderGrowthFunction() {
    const intercept = this.linearFunction?.intercept || 0
    const slope = this.linearFunction?.slope || 0

    const sign = slope >= 0 ? '+' : '-'

    const base = `${
        removeTrailingZeros(intercept.toFixed(3))
      }${
        this.config?.sizeUnit
      }`
    const increment = `${
        removeTrailingZeros(Math.abs(slope * 100).toFixed(3))
      }${
        this.config?.growthUnit
      }`

    // NOTE: even when there's no growth the calc() will be rendered all
    // the same since the user might want to tweak something on their own and
    // it might become bothersome that the app doesn't always render the
    // function as expected. The code below will remain commented out just
    // in case that turns out not to be the case and needs to be implemented
    // if (this.linearFunction?.slope === 0) {
    //   return base
    // } else if (Math.abs(this.linearFunction?.intercept || Infinity) === Infinity) {
    //   return increment
    // } else {
    //   return `${base} ${sign} ${increment}`
    // }

    return `${base} ${sign} ${increment}`
  }

  /**
   * Generate string with clamp() CSS function
   * 
   * @returns {string} The resulting clamp() CSS function
   */
  private renderClamp() {
    const growthFunction = this.renderGrowthFunction()
    const minSize = `${
        this.config?.isClampedMin
        ? this.config?.sizes[0][0]
        : '0'
      }${
        this.config?.sizeUnit
      }`
    const maxSize = this.config?.isClampedMax
      ? `${
        this.config?.sizes[1][0]
      }${
        this.config?.sizeUnit
      }`
      : 'auto'

    return `${
      renderSpanClass('clamp', Calc.CLASSNAME_FUNCTION)
    }(${
      renderSpanClass(minSize, Calc.CLASSNAME_VALUE)
    }, ${
      renderSpanClass(growthFunction, Calc.CLASSNAME_VALUE)
    }, ${
      renderSpanClass(maxSize, Calc.CLASSNAME_VALUE)
    })`
  }

  /**
   * Generate string with calc() CSS function
   * 
   * @returns {string} The resulting calc() CSS function
   */
  private renderCalc() {
    const growthFunction = this.renderGrowthFunction()

    return `${
      renderSpanClass('calc', Calc.CLASSNAME_FUNCTION)
    }(${
      renderSpanClass(growthFunction, Calc.CLASSNAME_VALUE)
    })`
  }

  /**
   * Add line-breaks and indentations to CSS code
   * 
   * @param {string} cssCode String with CSS code to be processed
   * @returns {string} CSS code with corresponding line breaks and indentations
   */
  private indentCSS(cssCode: string) {
    console.log(this.config?.clampMethod)

    if (
      !(this.config?.useSelector || this.config?.clampMethod === 'media-query')
    ) {
      return cssCode
    }

    let i = 0
    let indentN = 0
    let parsedCSS = ''

    /** Indicates that the current character is at the beginning of new line */
    let newLine = false
    while (i < cssCode.length) {
      let char = cssCode[i]

      /** Calls for a linebreak after current character */
      let lineBreak = false

      // 1. Modify indentN
      if (char === '{') {
        indentN++
        lineBreak = true
      } else if (char === '}') {
        indentN--
        lineBreak = true
      } else if (char === ';') {
        lineBreak = true
      }

      // 3. (Yes, last) Apply indentation if newLine
      if (newLine) {
        char = '\t'.repeat(indentN) + char
        newLine = false
      }

      // 2. Close current line span, apply linebreak, open new line span
      if (lineBreak) {
        newLine = lineBreak
        char += '\n'
      }

      parsedCSS += char
      i++
    }

    return parsedCSS
  }
  
  /**
   * Generate minified CSS code
   * 
   * @returns {string} String representation of CSS code
   */
  public renderRaw() {
    if (!this.linearFunction) {
      console.error('Linear function not initialized. Unable to render CSS')
      return ''
    }
    if (!this.config) {
      console.error('Config not initialized. Unable to render CSS')
      return ''
    }

    // There are 5 chunks to check to compose the operation:
    //   1. CSS Function | 2. CSS Property | 3. Selector
    // | 4. Media query | 5. Selector out of media query 
    const operations = []

    // 1. CSS Function
    if (!this.config.isClampedMin && !this.config.isClampedMax) {
      operations.push(this.renderCalc)
    } else if (this.config.clampMethod === 'clamp') {
      operations.push(this.renderClamp)
    } else {
      operations.push(this.renderCalc, this.renderMinMax)
    }

    // 2. CSS Property
    if (this.config.useProperty) {
      operations.push(this.renderProperty)
    }

    // 3. Selector
    if (this.config.useSelector && !this.config.selectorOutside) {
      operations.push(this.renderSelector)
    }

    // 4. Media query
    if (this.config.clampMethod === 'media-query') {
      operations.push(this.renderMediaQueries)
    }

    // 5. Selector out of media query
    if (this.config.useSelector && this.config.selectorOutside) {
      operations.push(this.renderSelector)
    }

    return compose.call(this, ...operations.reverse())()
  }

  /**
   * Generate CSS code
   * 
   * @returns {string} String representation of CSS code
   */
  public render() {
    return this.indentCSS(this.renderRaw())
  }
}