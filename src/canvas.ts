import { CSSSizeUnits, DimensionUnitPair, StateObject } from "./ts";
import { clamp, getArrayPairsOf } from "./utils";
import { LinearFunction, Point } from "./utils/linear-algebra";

/* This deals in 2 coord systems:
Virtual units   - Axis system representation    - 1 unit =/= 1px
Element units   - Position relative to element  - 1 unit =   1px

Sometimes the term "Relative unit" is used to refer to units that
can be applied to both systems
*/

export default class GraphCanvas{
  // Macros ---
  /** Virtual unit */
  private static readonly MAX_VIRTUAL_WIDTH = 1600;
  /** Virtual unit */
  private static readonly MAX_VIRTUAL_HEIGHT = 1000;
  /** Virtual unit */
  private static readonly MIN_VIRTUAL_WIDTH = 100;
  /** Virtual unit */
  private static readonly MIN_VIRTUAL_HEIGHT = 1;
  /** 
   * Element unit
   * 
   * Delimits the space where the x ruler will be placed */
  private static readonly MARGIN_BOTTOM = 20;
  /**
   * Element unit
   * 
   * Delimits the space where the y ruler will be placed */
  private static readonly MARGIN_LEFT = 40;
  /**
   * Element unit
   * 
   * Distance at which cursor snaps to points */
  private static readonly SNAP_DISTANCE_POINT = 15;
  /**
   * Element unit
   * 
   * Distance at which cursor snaps to lines */
  private static readonly SNAP_DISTANCE_LINE = 8;

  /**
   * Virtual unit
   * 
   * Base multiplier to define the virtual ruler numbers with.
   * Currently set to 25/(2^8) which when multiplied by powers of 2
   * returns (respectively, starting from 2^8):
   * 
   * 0.1953125; 0.390625; 0.78125; 1.5625; 3.125; 6.25; 12.5; 25; 50; 100; ...
   */
  private static readonly GRID_SIZE_MULTIPLIER = 10 / 256;
  /**
   * Element unit
   * 
   * Minimum space (in px) rulers can have between markings */
  private static readonly MIN_RULER_SPACING = 40;
  private static readonly RULER_MARKING_LENGTH = 8;
  private static readonly RULER_MARKING_THICKNESS = 1;

  /**
   * Relative unit
   * 
   * Multiplier to use to generate margin in the UI for extending virtual dimensions
   */
  private static readonly EXTENSION_MARGIN_MULTIPLIER = .05;
  /**
   * Viewport unit
   */
  private static readonly VIEWPORT_MODIFY_INCREMENT = .01;

  // Canvas elements ---
  private readonly htmlElement: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  // Points set by internal handlers ---
  /** Virtual unit */
  private p1: Point;
  /** Virtual unit */
  private p2: Point;
  /** Virtual unit */
  private pStart: Point;
  /** Virtual unit */
  private pEnd: Point;
  /**
   * Element unit
   * 
   * Cursor coordinates
   */
  private cursorCoords: Point;
  /**
   * Element unit
   * 
   * When cursor is snapped to a line this point indicates
   * where the snapped position is*/
  private lineSnappedCursor: Point | null;

  // Point info
  private highlightedPoint: 'p1' | 'p2' | null;
  private get nonHighlightedPoint() {
    return this.highlightedPoint === 'p1' ? 'p2' : 'p1'
  }
  private isPointSelected: boolean;

  // Dimensions
  /**
   * Element unit
   * 
   * @property {number} x The x coordinate of the HTML Element's origin within the viewport
   * @property {number} y The y coordinate of the HTML Element's origin within the viewport
   * @property {number} width The width of HTML Element
   * @property {number} height The height of HTML Element
   * @property {number} top The distance between the top of the HTML Element and the top of the viewport (same as y)
   * @property {number} left The distance between the left of the HTML Element and the left of the viewport (same as x)
   * @property {number} right The distance between the right of the HTML Element and the left of the viewport (same as x + width)
   * @property {number} bottom The distance between the bottom of the HTML Element and the top of the viewport (same as y + height)
   */
  private boundingRect: DOMRect;
  /**
   * Virtual unit
   * 
   * Width of the representation of the axis system
   */
  private virtualWidth: number;
  /**
   * Virtual unit
   * 
   * Height of the representation of the axis system
   */
  private virtualHeight: number;

  // Properties passed exclusively externally
  private isClampedMin: boolean;
  private isClampedMax: boolean;
  private cssUnit: CSSSizeUnits;

  // Cursor info
  /** Indicates if cursor is hovering the canvas */
  private isCursorIn: boolean;
  /** Indicates if mouse is currently pressed */
  // private isMouseDown: boolean;
  /** Indicates if mouse is currently pressed after being pressed while hovering canvas */
  // private isCursorDrag: boolean;

  // Drawing info
  /** Indicates if refresh has been triggered in the current tick */
  private isRefreshTriggered: boolean;
  /**
   * Virtual unit
   * 
   * Space between each ruler marking
   */
  private rulerSpacing: { x: number, y: number };
  /** Indicates if extension function is looping */
  // private isExtendLooping: boolean;

  /** The ID of the interval in charge of the extension */
  private extendIntervalId: number | null;
  /** Indicates if virtual width is being extended */
  private isExtendX: boolean;
  /** Indicates if virtual height is being extended */
  private isExtendY: boolean;
  /** Indicates if virtual width is being reduced */
  private isReduceX: boolean;
  /** Indicates if virtual height is being reduced */
  private isReduceY: boolean;

  // Getters
  /**
   * Element unit
   * 
   * Width of the section of the canvas belonging to the axis system
   */
  private get gridWidth() {
    return this.boundingRect.width - GraphCanvas.MARGIN_LEFT
  }
  /**
   * Element unit
   * 
   * Height of the section of the canvas belonging to the axis system
   */
  private get gridHeight() {
    return this.boundingRect.height - GraphCanvas.MARGIN_BOTTOM
  }

  // Change listeners
  private changeListeners: ((newData: Partial<StateObject>) => void)[];
 
  /**
   * Create new GraphCanvas object
   * 
   * @param {HTMLCanvasElement} canvasHTMLElement The HTML canvas element where the UI will be displayed
   * @param {number} width Width the HTML element will have
   * @param {number} height Height the HTML element will have
   * @param {StateObject} configObject Initial state to configure the object with
   */
  constructor(
    canvasHTMLElement: HTMLCanvasElement,
    width: number,
    height: number,
    configObject: StateObject
  ) {
    const ctx = canvasHTMLElement.getContext('2d')
  
    if (!ctx) {
      throw new Error('Failed to create canvas context')
    }

    this.p1 = new Point(...configObject.sizes[0])
    this.p2 = new Point(...configObject.sizes[1])

    this.virtualWidth = 0
    this.virtualHeight = 0
    this.setVirtualDimensionsFromPoints()

    this.isClampedMin = configObject.isClampedMin
    this.isClampedMax = configObject.isClampedMax
    this.cssUnit = configObject.sizeUnit

    this.pStart = {x: 0, y: 0}
    this.pEnd = {x: 0, y: 0}
    this.updateLimitPoints()

    this.htmlElement = canvasHTMLElement
    this.htmlElement.height = height
    this.htmlElement.width = width

    this.ctx = ctx

    this.boundingRect = this.htmlElement.getBoundingClientRect()
    window.addEventListener('resize', this.updateClientRect)
    
    this.rulerSpacing = { x: 0, y: 0 }
    this.updateRulerSpacing('x')
    this.updateRulerSpacing('y')

    this.cursorCoords = new Point(-1, -1)
    this.lineSnappedCursor = null
    this.isCursorIn = false

    this.highlightedPoint = null
    this.isPointSelected = false

    this.isRefreshTriggered = false
    // this.isExtendLooping = false
    this.isExtendX = false
    this.isExtendY = false
    this.isReduceX = false
    this.isReduceY = false

    this.extendIntervalId = null

    this.changeListeners = []

    window.addEventListener('mousemove', this.handleMouseMove.bind(this))
    window.addEventListener('mousedown', this.handleMouseDown.bind(this))
    window.addEventListener('mouseup', this.handleMouseUp.bind(this))

    this.refresh()
  }

  /**
   * Update virtual width and height to cover the current p1 and p2 positions
   */
  private setVirtualDimensionsFromPoints() {
    const lowerInY = Math.min(this.p1.y, this.p2.y)
    const higherInY = Math.max(this.p1.y, this.p2.y)

    const newWidth = Math.min(this.p1.x * 2 + (this.p2.x - this.p1.x), GraphCanvas.MAX_VIRTUAL_WIDTH)
    const newHeight = Math.min(lowerInY * 2 + higherInY - lowerInY, GraphCanvas.MAX_VIRTUAL_HEIGHT)

    this.virtualWidth = newWidth
    this.virtualHeight = newHeight
  }

  /**
   * Check if selected point is within extension margins and update variables
   */
  private checkExtendVirtualDimensions() {
    if (this.highlightedPoint === null) {
      console.error('No highlighted point. Unable to extend')
      return
    }

    this.isExtendX = this[this.highlightedPoint].x > this.virtualWidth - this.virtualWidth * GraphCanvas.EXTENSION_MARGIN_MULTIPLIER
    this.isReduceX = !this.isExtendX
      && this[this.highlightedPoint].x < this.virtualWidth * GraphCanvas.EXTENSION_MARGIN_MULTIPLIER
      && this[this.nonHighlightedPoint].x < this.virtualWidth

    this.isExtendY = this[this.highlightedPoint].y > this.virtualHeight - this.virtualHeight * GraphCanvas.EXTENSION_MARGIN_MULTIPLIER
    this.isReduceY = !this.isExtendY
      && this[this.highlightedPoint].y < this.virtualHeight * GraphCanvas.EXTENSION_MARGIN_MULTIPLIER
      && this[this.nonHighlightedPoint].y < this.virtualHeight
  }

  private movePoint(pName: 'p1' | 'p2', newPosition: Point) {
    const horizontalLimits = pName === 'p1'
      ? [0, this.p2.x - 1]
      : [this.p1.x + 1, this.virtualWidth]

    const xClamped = clamp(newPosition.x, horizontalLimits[0], horizontalLimits[1])
    const yClamped = clamp(newPosition.y, 0, this.virtualHeight)
    
    this[pName] = new Point(xClamped, yClamped)
  }

  /**
   * Update the points at which the first line collides to the left and the last line collides to
   * the right of the grid
   * 
   * Must be run when p1, p2, virtualWidth, virtualHeight, isClampedMin, or isClampedMax are updated
   */
  private updateLimitPoints() {
    const centerLinearFunction = new LinearFunction(this.p1, this.p2)

    // Start ---
    const startIntercept = this.isClampedMin ? this.p1.y : centerLinearFunction.intercept
    const startIntersectionPoints = [new Point(0, startIntercept)]

    if (!this.isClampedMin) {
      const verticalLimit = centerLinearFunction.slope < 0
        ? this.virtualHeight
        : 0

      const verticalPoint = new Point(centerLinearFunction.getXFromY(verticalLimit), verticalLimit)

      startIntersectionPoints.push(verticalPoint)
      startIntersectionPoints.sort((intersectionA, intersectionB) => (
        Point.distanceBetween(intersectionA, this.p1) - Point.distanceBetween(intersectionB, this.p1)
      ))
    }

    const startNearestIntersectionPoint = startIntersectionPoints[0]

    // End ---
    const endIntercept = this.isClampedMax
      ? this.p2.y
      : centerLinearFunction.getYFromX(this.virtualWidth)
    const endIntersectionPoints = [new Point(this.virtualWidth, endIntercept)]

    if (!this.isClampedMax) {
      const verticalLimit = centerLinearFunction.slope > 0
        ? this.virtualHeight
        : 0

      const verticalPoint = new Point(centerLinearFunction.getXFromY(verticalLimit), verticalLimit)

      endIntersectionPoints.push(verticalPoint)
      endIntersectionPoints.sort((intersectionA, intersectionB) => (
        Point.distanceBetween(intersectionA, this.p1) - Point.distanceBetween(intersectionB, this.p1)
      ))
    }

    const endNearestIntersectionPoint = endIntersectionPoints[0]

    this.pStart = startNearestIntersectionPoint
    this.pEnd = endNearestIntersectionPoint
  }

  /**
   * Update coordinates of the cursor within virtual representation
   * 
   * Also updates isCursorIn
   * @param {MouseEvent} e Mouse event object
   */
  private updateCursorCoords(e: MouseEvent) {
    const cursorViewportX = e.clientX
    const cursorViewportY = e.clientY

    const cursorCanvasX = cursorViewportX - this.boundingRect.left
    const cursorCanvasY = cursorViewportY - this.boundingRect.top

    // const cursorCanvasCoords = new Point(cursorCanvasX, cursorCanvasY)

    if (
      cursorCanvasX > 0
      && cursorCanvasX > this.boundingRect.width
      && cursorCanvasY > 0
      && cursorCanvasY > this.boundingRect.height
    ) {
      this.isCursorIn = true
    } else {
      this.isCursorIn = false
    }
    
    this.cursorCoords = this.viewportToElementCoords(new Point(cursorViewportX, cursorViewportY))
  }

  private startExtensionLoop() {
    const { highlightedPoint, nonHighlightedPoint } = this

    if (this.extendIntervalId !== null) {
      console.error('Interval ID already started')
      return
    }
    if (highlightedPoint === null) {
      console.error('A point needs to be highlighted to extend virtual dimensions')
      return
    }

    const modifyVector = <[-1 | 0 | 1, -1 | 0 | 1]>[
      this.isExtendX
        ? 1
        : this.isReduceX
        ? -1
        : 0,
      this.isExtendY
        ? 1
        : this.isReduceY
        ? -1
        : 0
    ]

    this.extendIntervalId = setInterval(() => {
      if (modifyVector[0] !== 0) {
        const minLimit = highlightedPoint === 'p1'
          ? Math.max(
              this.p2.x + this.virtualWidth * GraphCanvas.EXTENSION_MARGIN_MULTIPLIER * 2,
              GraphCanvas.MIN_VIRTUAL_WIDTH
            )
          : GraphCanvas.MIN_VIRTUAL_WIDTH
        const newWidth = this.virtualWidth + this.virtualWidth * GraphCanvas.VIEWPORT_MODIFY_INCREMENT * modifyVector[0]
        const newWidthClamped = clamp(newWidth, minLimit, GraphCanvas.MAX_VIRTUAL_WIDTH)

        this.virtualWidth = newWidthClamped
        this.updateRulerSpacing('x')

        if (newWidth !== newWidthClamped) {
          modifyVector[0] = 0
        }
      }

      if (modifyVector[1] !== 0) {
        const minLimit = Math.max(
          this[nonHighlightedPoint].y + this.virtualHeight * GraphCanvas.EXTENSION_MARGIN_MULTIPLIER * 2,
          GraphCanvas.MIN_VIRTUAL_HEIGHT
        )
        const newHeight = this.virtualHeight + this.virtualHeight * GraphCanvas.VIEWPORT_MODIFY_INCREMENT * modifyVector[1]
        const newHeightClamped = clamp(newHeight, minLimit, GraphCanvas.MAX_VIRTUAL_HEIGHT)

        this.virtualHeight = newHeightClamped
        this.updateRulerSpacing('y')

        if (newHeight !== newHeightClamped) {
          modifyVector[1] = 0
        }
      }

      const virtualCursorCoords = this.elementToVirtualCoords(this.cursorCoords)

      this.movePoint(highlightedPoint, virtualCursorCoords)
      this.updateLimitPoints()

      if (!this.isRefreshTriggered) {
        this.refresh()
      }

      // If both vectors are off turn off
      if (modifyVector[0] === 0 && modifyVector[1] === 0) {
        this.stopExtensionLoop()
      }
    })
  }

  private stopExtensionLoop() {
    if (this.extendIntervalId === null) {
      console.warn('Interval ID already cleared')
      return
    }

    clearInterval(this.extendIntervalId)
    this.extendIntervalId = null
  }

  private handleMouseMove(e: MouseEvent) {
    this.updateCursorCoords(e)
    const virtualCursorCoords = this.elementToVirtualCoords(this.cursorCoords)

    /**
     * If true the canvas is redrawn
     * 
     * Used only when visual elements change.
     * This only happens if:
     * - Cursor without selected point snaps or unsnaps on lines
     * - Pressed cursor with selected point drags a point
     */
    let doRefresh = false

    // Snap cursor to nearest line
    if (!this.highlightedPoint) {
      // Only if it's not highlighting a point
      const prevSnap = this.lineSnappedCursor
      this.updateLineSnappedCursor()

      if (prevSnap !== null || this.lineSnappedCursor !== null) {
        doRefresh = true
      }
    } else if (this.lineSnappedCursor) {
      this.lineSnappedCursor = null
      doRefresh = true
    }

    if (this.isPointSelected) {
      // Drag selected point
      if (typeof this.highlightedPoint !== 'string') {
        throw new Error('Point appears as selected but highlighted point is missing')
      }

      this.movePoint(this.highlightedPoint, virtualCursorCoords)
      this.updateLimitPoints()

      this.checkExtendVirtualDimensions()

      const isExtension = this.isExtendX || this.isExtendY || this.isReduceX || this.isReduceY

      if (isExtension && !this.extendIntervalId) {
        // this.extendIntervalId = setInterval(() => {
        //   // this.isExtendLooping = true
        //   this.extendLoop()
        // }, 1/60)
        this.startExtensionLoop()
      } else if (!isExtension && this.extendIntervalId !== null) {
        // clearInterval(this.extendIntervalId)
        // this.extendIntervalId = null
        this.stopExtensionLoop()
      }

      doRefresh = true
    } else {
      // Highlight point at snap distance
      const pointDistances = [
        Point.distanceBetween(this.cursorCoords, this.virtualToElementCoords(this.p1)),
        Point.distanceBetween(this.cursorCoords, this.virtualToElementCoords(this.p2))
      ]

      if (pointDistances[0] <= GraphCanvas.SNAP_DISTANCE_POINT) {
        this.highlightedPoint = 'p1'
        doRefresh = true
      } else if (pointDistances[1] <= GraphCanvas.SNAP_DISTANCE_POINT) {
        this.highlightedPoint = 'p2'
        doRefresh = true
      } else if (this.highlightedPoint !== null) {
        this.highlightedPoint = null
        doRefresh = true
      }
    }

    if (doRefresh) {
      this.refresh()
    }
  }

  private handleMouseDown() {
    if (this.highlightedPoint !== null) {
      this.isPointSelected = true
    }
  }

  private handleMouseUp() {
    if (this.changeListeners.length > 0) {
      const newSizes: [DimensionUnitPair, DimensionUnitPair] = [
        [this.p1.x, this.p1.y],
        [this.p2.x, this.p2.y]
      ]

      this.changeListeners.map(cb => cb({ sizes: newSizes }))
    }
    
    if (this.isPointSelected) {
      this.isPointSelected = false
    }

    if (typeof this.extendIntervalId === 'number') {
      this.stopExtensionLoop()
    }
  }

  /**
   * Update cursor snap to lines
   */
  private updateLineSnappedCursor() {
    // Everything should be done outside of the virtual space since the matrix
    // is never identity thus visually the nearest distance between cursor and
    // a line is never perpendicular to that line
    const points = [this.pStart, this.p1, this.p2, this.pEnd]
    const pointsElement = points.map(point => this.virtualToElementCoords(point))

    const ranges = getArrayPairsOf(pointsElement)

    const linearFunctions = ranges.map(([start, end]) => new LinearFunction(start, end))

    const rangeDistances = linearFunctions.map((linearFunction, i) => (
      linearFunction.distanceToPointInRange(this.cursorCoords, ranges[i][0].x, ranges[i][1].x))
    )

    const isInSnappingDistance = rangeDistances.some(distance => distance <= GraphCanvas.SNAP_DISTANCE_LINE)

    if (isInSnappingDistance) {
      const nearestLineDistance = rangeDistances.map((distance, i) => [i, distance])
        .sort((distTupleA, distTupleB) => distTupleA[1] - distTupleB[1])[0]
      
      const nearestPointDistance = pointsElement
        .map(point => [point, Point.distanceBetween(point, this.cursorCoords)] as [Point, number])
        .sort((distTupleA, distTupleB) => distTupleA[1] - distTupleB[1])[0]
      
      const isCorner = nearestPointDistance[1] === nearestLineDistance[1]

      if (isCorner) {
        this.lineSnappedCursor = nearestPointDistance[0]
      } else {
        const nearestLinearFunction = linearFunctions[nearestLineDistance[0]]

        const inverseLinearFunction = LinearFunction.fromPointSlope(
          this.cursorCoords,
          nearestLinearFunction.inverse.slope
        )

        const intersectionPoint = LinearFunction.intersection(
          inverseLinearFunction,
          nearestLinearFunction
        )

        this.lineSnappedCursor = intersectionPoint
      }
    } else if (this.lineSnappedCursor !== null) {
      this.lineSnappedCursor = null
    }
  }

  private updateClientRect() {
    this.boundingRect = this.htmlElement.getBoundingClientRect()
  }

  /**
   * Transform viewport units to virtual units
   * @param {string} dimension In which dimension to transform
   * @param {number} unit Amount to transform
   * @returns {number} Respective virtual units
   */
  private elementToVirtualUnits(dimension: 'x' | 'y', absoluteElementUnit: number): number {
    const virtualSize = dimension === 'x' ? this.virtualWidth : this.virtualHeight
    const gridSize = dimension === 'x' ? this.gridWidth : this.gridHeight

    return absoluteElementUnit * (virtualSize / gridSize)
  }

  /**
   * Transform virtual units to element units
   * @param {string} dimension In which dimension to transform
   * @param {number} unit Amount to transform
   * @returns {number} Respective element units
   */
  private virtualToElementUnits(dimension: 'x' | 'y', virtualUnit: number): number {
    const virtualSize = dimension === 'x' ? this.virtualWidth : this.virtualHeight
    const gridSize = dimension === 'x' ? this.gridWidth : this.gridHeight

    return virtualUnit / (virtualSize / gridSize)
  }

  /**
   * Adapt viewport coordinates to local element coordinates
   * @param {Point} absoluteViewportCoords Point in viewport
   * @returns Respective point relative to viewport
   */
  private viewportToElementCoords(absoluteViewportCoords: Point) {
    return new Point(
      absoluteViewportCoords.x - this.boundingRect.left,
      absoluteViewportCoords.y - this.boundingRect.top
    )
  }

  /**
   * Get coordinates of virtual axis system point to its relative position in HTML Element
   * @param {Point} virtualCoords Point in virtual axis system
   * @returns Respective point in HTML Element
   */
  private virtualToElementCoords(virtualCoords: Point) {
    /** Virtual Y represented from top to bottom */
    const virtualYInverse = (this.virtualHeight - virtualCoords.y)
      // - this.elementToVirtualUnits('y', GraphCanvas.MARGIN_BOTTOM)

    const elementRelativeX = this.virtualToElementUnits('x', virtualCoords.x) + GraphCanvas.MARGIN_LEFT
    const elementRelativeY = this.virtualToElementUnits('y', virtualYInverse)

    return new Point(elementRelativeX, elementRelativeY)
  }

  private elementToVirtualCoords(elementCoords: Point) {
    /** Virtual Y represented from top to bottom */
    const virtualYInverse = this.elementToVirtualUnits('y', elementCoords.y)
    const virtualX = this.elementToVirtualUnits('x', elementCoords.x - GraphCanvas.MARGIN_LEFT)

    /** Virtual Y represented from bottom to top */
    const virtualY = this.virtualHeight - virtualYInverse

    return new Point(virtualX, virtualY)
  }

  /**
   * Update amount of space between ruler markings and, by extension, amount of ruler markings
   * according to current virtual width and height
   * @param {string} rulerSide Which ruler to update
   */
  private updateRulerSpacing(rulerSide: 'x' | 'y') {
    const minVirtualUnit = this.elementToVirtualUnits(rulerSide, GraphCanvas.MIN_RULER_SPACING)

    let thisVirtualUnit = GraphCanvas.GRID_SIZE_MULTIPLIER
    while (thisVirtualUnit < minVirtualUnit) {
      thisVirtualUnit *= 2
    }

    this.rulerSpacing[rulerSide] = thisVirtualUnit
  }

  /**
   * Draw line from point A to point B
   * @param {Point} pA Point A
   * @param {Point} pB Point B
   */
  private drawLine(pA: Point, pB: Point) {
    this.ctx.beginPath()
    this.ctx.moveTo(Math.round(pA.x), Math.round(pA.y))
    this.ctx.lineTo(Math.round(pB.x), Math.round(pB.y))
    this.ctx.closePath()
    this.ctx.stroke()
  }

  /**
   * Write text
   * @param {string} text The text to be written
   * @param {Point} p Point where to write the text
   */
  private drawText(text: string, p: Point, textAlign: CanvasTextAlign = 'left') {
    const textAlignDefault = this.ctx.textAlign

    this.ctx.textAlign = textAlign
    this.ctx.fillText(text, p.x, p.y)

    this.ctx.textAlign = textAlignDefault
  }

  /**
   * 
   * @param {Point} p Point where the center of the square will be
   * @param {number} side Length of the sides of the square
   */
  private drawPointSquare(p: Point, side: number = 20, color: typeof this.ctx.fillStyle = 'black') {
    const offsetOrigin = new Point(p.x - side/2, p.y - side/2)
    const fillStylePrev = this.ctx.fillStyle

    this.ctx.fillStyle = color
    this.ctx.fillRect(offsetOrigin.x, offsetOrigin.y, side, side)

    this.ctx.fillStyle = fillStylePrev
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.htmlElement.width, this.htmlElement.height)
    const fillStylePrev = this.ctx.fillStyle

    // Draw lines
    const pointSequence = [this.pStart, this.p1, this.p2, this.pEnd]
    pointSequence.map(p => this.virtualToElementCoords(p))
      .reduce((a, b) => {
        this.drawLine(a, b)
        return b
      })

    // Draw snapped point
    if (this.lineSnappedCursor !== null) {
      this.drawPointSquare(this.lineSnappedCursor, 10)
    }

    // Draw points
    const colors = [
      this.highlightedPoint === 'p1' ? 'red' : 'black',
      this.highlightedPoint === 'p2' ? 'red' : 'black'
    ]

    this.drawPointSquare(this.virtualToElementCoords(this.p1), 20, colors[0])
    this.drawPointSquare(this.virtualToElementCoords(this.p2), 20, colors[1])
    
    // Draw rulers
    this.ctx.fillStyle = 'white'
    this.ctx.fillRect(0, 0, GraphCanvas.MARGIN_LEFT, this.boundingRect.height)
    this.ctx.fillRect(
      0,
      this.boundingRect.height - GraphCanvas.MARGIN_BOTTOM,
      this.boundingRect.width,
      GraphCanvas.MARGIN_BOTTOM
    )
    this.ctx.fillStyle = fillStylePrev

    const markingLengthX = this.elementToVirtualUnits('y', GraphCanvas.RULER_MARKING_LENGTH)
    for (let i = 0; i < this.virtualWidth; i += this.rulerSpacing.x) {
      const lineStart = this.virtualToElementCoords(new Point(i, 0))
      const lineEnd = this.virtualToElementCoords(new Point(i, 0 - markingLengthX))

      this.drawLine(
        lineStart,
        lineEnd
      )
      this.drawText(
        i.toString(),
        new Point(lineEnd.x, lineEnd.y + 10)
      )
    }

    const markingLengthY = this.elementToVirtualUnits('x', GraphCanvas.RULER_MARKING_LENGTH)
    for (let i = 0; i < this.virtualHeight; i += this.rulerSpacing.y) {
      const lineStart = this.virtualToElementCoords(new Point(0, i))
      const lineEnd = this.virtualToElementCoords(new Point(0 - markingLengthY, i))

      this.drawLine(
        lineStart,
        lineEnd
      )
      this.drawText(
        i.toString(),
        new Point(lineEnd.x - 4, lineEnd.y),
        'right'
      )
    }
  }

  public set onChange(cb: (newData: Partial<StateObject>) => void) {
    this.changeListeners.push(cb)
  }

  public refresh() {
    // Only run if refresh hasn't been triggered at current tick
    if (!this.isRefreshTriggered) {
      this.isRefreshTriggered = true
      
      // Set to refresh in the next animation frame
      requestAnimationFrame(() => {
        this.draw()

        // Reset flag
        this.isRefreshTriggered = false
      })
    }
  }

  public update(newDataObject: StateObject) {
    if ('isClampedMin' in newDataObject) {
      this.isClampedMin = newDataObject.isClampedMin
    }
    if ('isClampedMax' in newDataObject) {
      this.isClampedMax = newDataObject.isClampedMax
    }

    if ('sizes' in newDataObject) {
      this.movePoint('p1', new Point(...newDataObject.sizes[0]))
      this.movePoint('p2', new Point(...newDataObject.sizes[1]))

      this.setVirtualDimensionsFromPoints()

      this.updateLimitPoints()
    }

    this.refresh()
  }
}