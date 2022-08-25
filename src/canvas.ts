import { CSSSizeUnits, CSSViewportUnits, DimensionUnitPair, StateObject } from "./ts";
import { clamp, getArrayPairsOf } from "./utils";
import { LinearFunction, Point } from "./lib/linear-algebra";
import { MAX_SIZE, MAX_VIEWPORT } from './store'

/* This deals in 2 coordinate systems:
Virtual units   - Axis system representation        - 1 unit =/= 1px
Element units   - Position relative to DOM element  - 1 unit =   1px

Sometimes the term "Relative unit" is used to refer to units that
can be applied to both systems
*/

export default class GraphCanvas{
  // Macros ---
  /** Virtual unit */
  private static readonly MAX_VIRTUAL_WIDTH = MAX_SIZE || Infinity;
  /** Virtual unit */
  private static readonly MAX_VIRTUAL_HEIGHT = MAX_VIEWPORT || Infinity;
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
   * Delimits the space where the x ruler will stop */
  private static readonly MARGIN_TOP = 30;
  /**
   * Element unit
   * 
   * Delimits the space where the y ruler will stop */
  private static readonly MARGIN_RIGHT = 40;
  /**
   * Element unit
   * 
   * Distance at which cursor snaps to points */
  private static readonly SNAP_DISTANCE_POINT = 20;
  /**
   * Element unit
   * 
   * Distance at which cursor snaps to lines */
  private static readonly SNAP_DISTANCE_LINE = 15;

  /** Element unit */
  private static readonly POINT_CIRCLE_RADIUS = 5;

  /** Element unit */
  private static readonly INFO_LABEL_WIDTH = 155;
  /** Element unit */
  private static readonly INFO_LABEL_HEIGHT = 50;

  /**
   * Virtual unit
   * 
   * Base multiplier to define the virtual ruler numbers with.
   * Currently set to 10/(2^8) which when multiplied by powers of 2
   * returns (respectively, starting from 2^8):
   * 
   * .0390625; .078125; .15625; .3125; .625; 1.25; 2.5; 5; 10; 20; 40; 80; ...
   */
  private static readonly GRID_SIZE_MULTIPLIER = 10 / 256;
  /**
   * Element unit
   * 
   * Minimum space (in px) rulers can have between markings */
  private static readonly MIN_RULER_SPACING = 40;
  private static readonly RULER_MARKING_LENGTH = 8;

  /**
   * Virtual unit
   * 
   * Minimum horizontal distance between p1 and p2
   */
  private static readonly POINT_MARGIN = 1;
  
  private static readonly COLOR_MAIN        = '#4791ff';
  private static readonly COLOR_MAIN_MID    = '#a5c9ff';
  private static readonly COLOR_MAIN_SOFT   = '#eeeeee';
  private static readonly COLOR_BACKGROUND  = '#ffffff';
  private static readonly COLOR_HIGHLIGHT   = '#FFAEA3';

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
  // private boundingRect: DOMRect;
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

  // Properties passed externally
  private isClampedMin: boolean;
  private isClampedMax: boolean;
  private cssUnitSize: CSSSizeUnits;
  private cssUnitGrowth: CSSSizeUnits;

  // Cursor info
  /** Indicates if cursor is hovering the canvas */
  // private isCursorIn: boolean;
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
   * Get DOM element's boundary box
   * 
  */
  private get boundingRect() {
    return this.htmlElement.getBoundingClientRect()
  }

  /**
   * Element unit
   * 
   * Width of the section of the canvas belonging to the axis system
   */
  private get gridWidth() {
    return this.boundingRect.width
      - GraphCanvas.MARGIN_LEFT
      - GraphCanvas.MARGIN_RIGHT
  }

  /**
   * Element unit
   * 
   * Height of the section of the canvas belonging to the axis system
   */
  private get gridHeight() {
    return this.boundingRect.height
      - GraphCanvas.MARGIN_BOTTOM
      - GraphCanvas.MARGIN_TOP
  }

  // Change listeners
  /** Function to be called when the canvas is updated */
  private changeListener: null | ((newData: Partial<StateObject>) => void);
 
  /**
   * Create new GraphCanvas object
   * 
   * @param {HTMLCanvasElement} canvasHTMLElement The HTML canvas element where the UI will be displayed
   * @param {number} width Width the HTML element will have
   * @param {number} height Height the HTML element will have
   * @param {StateObject} configObject Initial state to configure the object with
   * @returns {GraphCanvas} Graph object representation
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
    this.cssUnitSize = configObject.sizeUnit
    this.cssUnitGrowth = configObject.viewportUnit

    this.pStart = {x: 0, y: 0}
    this.pEnd = {x: 0, y: 0}
    this.updateLimitPoints()

    this.htmlElement = canvasHTMLElement
    this.htmlElement.height = height
    this.htmlElement.width = width

    this.ctx = ctx

    // this.boundingRect = this.htmlElement.getBoundingClientRect()
    // window.addEventListener('resize', this.updateClientRect)
    
    this.rulerSpacing = { x: 0, y: 0 }
    this.updateRulerSpacing('x')
    this.updateRulerSpacing('y')

    this.cursorCoords = new Point(-1, -1)
    this.lineSnappedCursor = null
    // this.isCursorIn = false

    this.highlightedPoint = null
    this.isPointSelected = false

    this.isRefreshTriggered = false
    // this.isExtendLooping = false
    this.isExtendX = false
    this.isExtendY = false
    this.isReduceX = false
    this.isReduceY = false

    this.extendIntervalId = null

    this.changeListener = null

    window.addEventListener('mousemove', this.handleMouseMove.bind(this))
    window.addEventListener('mousedown', this.handleMouseDown.bind(this))
    window.addEventListener('mouseup', this.handleMouseUp.bind(this))

    this.refresh()
  }

  /**
   * Update virtual width and height to cover the current p1 and p2 positions
   */
  private setVirtualDimensionsFromPoints() {
    const lowerY = Math.min(this.p1.y, this.p2.y)
    const higherY = Math.max(this.p1.y, this.p2.y)

    const shouldDimensionsUpdate = this.p1.x < 0
      || this.p2.x > this.virtualWidth
      || this.p1.y > this.virtualHeight + 1
      || this.p2.y > this.virtualHeight + 1
      // Or maybe the frame is too scaled out
      || this.p2.x < this.virtualWidth * .2
      || higherY < this.virtualHeight * .2

    if (!shouldDimensionsUpdate) return

    const spaceRight = Math.max(
      this.p1.x,
      this.p2.x * GraphCanvas.EXTENSION_MARGIN_MULTIPLIER * 2
    )
    const spaceTop = Math.max(
      lowerY,
      higherY * GraphCanvas.EXTENSION_MARGIN_MULTIPLIER * 2
    )

    const newWidth = clamp(
      this.p1.x + this.p2.x - this.p1.x + spaceRight,
      GraphCanvas.MIN_VIRTUAL_WIDTH,
      GraphCanvas.MAX_VIRTUAL_WIDTH
    )
    // Math.min(
    //   this.p1.x + this.p2.x - this.p1.x + spaceRight,
    //   GraphCanvas.MAX_VIRTUAL_WIDTH
    // )
    const newHeight = clamp(
      lowerY + higherY - lowerY + spaceTop,
      GraphCanvas.MIN_VIRTUAL_HEIGHT,
      GraphCanvas.MAX_VIRTUAL_HEIGHT
    )
    // Math.min(
    //   lowerY + higherY - lowerY + spaceTop,
    //   GraphCanvas.MAX_VIRTUAL_HEIGHT
    // )

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

    this.isExtendX = this[this.highlightedPoint].x
      > this.virtualWidth - this.virtualWidth * GraphCanvas.EXTENSION_MARGIN_MULTIPLIER
    this.isReduceX = !this.isExtendX
      && this[this.highlightedPoint].x < this.virtualWidth * GraphCanvas.EXTENSION_MARGIN_MULTIPLIER
      && this[this.nonHighlightedPoint].x < this.virtualWidth

    this.isExtendY = this[this.highlightedPoint].y
      > this.virtualHeight - this.virtualHeight * GraphCanvas.EXTENSION_MARGIN_MULTIPLIER
    this.isReduceY = !this.isExtendY
      && this[this.highlightedPoint].y < this.virtualHeight * GraphCanvas.EXTENSION_MARGIN_MULTIPLIER
      && this[this.nonHighlightedPoint].y < this.virtualHeight
  }

  /**
   * Move p1 or p2 to a new position
   * @param {('p1' | 'p2')} pName Name of the point to move
   * @param {Point} newCoords Coordinates to to move the point to
   * @param {boolean} isClamped Indicates if the point has to be clamped within virtual limits
   */
  private movePoint(pName: 'p1' | 'p2', newCoords: Point, isClamped: boolean = true) {
    const horizontalLimits = pName === 'p1'
      ? [0, this.p2.x - GraphCanvas.POINT_MARGIN]
      : [this.p1.x + GraphCanvas.POINT_MARGIN, this.virtualWidth]

    const xRounded = Math.round(newCoords.x * 100) / 100
    const yRounded = Math.round(newCoords.y * 100) / 100

    const xFinal = isClamped
      ? clamp(xRounded, horizontalLimits[0], horizontalLimits[1])
      : xRounded
    const yFinal = isClamped
      ? clamp(yRounded, 0, this.virtualHeight)
      : yRounded
    
    this[pName] = new Point(xFinal, yFinal)
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
    const startIntercept = this.isClampedMin
      ? this.p1.y
      : centerLinearFunction.intercept
    const startIntersectionPoints = [new Point(0, startIntercept)]

    if (!this.isClampedMin) {
      const verticalLimit = centerLinearFunction.slope < 0
        ? this.virtualHeight
        : 0

      const verticalPoint = new Point(
        centerLinearFunction.getXFromY(verticalLimit),
        verticalLimit
      )

      startIntersectionPoints.push(verticalPoint)
      startIntersectionPoints.sort((intersectionA, intersectionB) => (
        Point.distanceBetween(intersectionA, this.p1)
        - Point.distanceBetween(intersectionB, this.p1)
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

    // const cursorCanvasX = cursorViewportX - this.boundingRect.left
    // const cursorCanvasY = cursorViewportY - this.boundingRect.top

    // const cursorCanvasCoords = new Point(cursorCanvasX, cursorCanvasY)

    // if (
    //   cursorCanvasX > 0
    //   && cursorCanvasX > this.boundingRect.width
    //   && cursorCanvasY > 0
    //   && cursorCanvasY > this.boundingRect.height
    // ) {
    //   this.isCursorIn = true
    // } else {
    //   this.isCursorIn = false
    // }
    
    this.cursorCoords = this.viewportToElementCoords(
      new Point(cursorViewportX, cursorViewportY)
    )
  }

  /**
   * Start a loop that extends the dimensions without the need for external events
   * 
   * It'll start an interval and assign its ID to this.extendIntervalId
   * 
   * Can't be called if there already is a loop running. In which case
   * this.stopExtensionLoop needs to be called first
   */
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
        const newWidth = this.virtualWidth
          + this.virtualWidth * GraphCanvas.VIEWPORT_MODIFY_INCREMENT * modifyVector[0]
        const newWidthClamped = clamp(newWidth, minLimit, GraphCanvas.MAX_VIRTUAL_WIDTH)

        this.virtualWidth = newWidthClamped
        this.updateRulerSpacing('x')

        if (newWidth !== newWidthClamped) {
          modifyVector[0] = 0
        }
      }

      if (modifyVector[1] !== 0) {
        const minLimit = Math.max(
          this[nonHighlightedPoint].y
            + this.virtualHeight * GraphCanvas.EXTENSION_MARGIN_MULTIPLIER * 2,
          GraphCanvas.MIN_VIRTUAL_HEIGHT
        )
        const newHeight = this.virtualHeight
          + this.virtualHeight * GraphCanvas.VIEWPORT_MODIFY_INCREMENT * modifyVector[1]
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

  /**
   * Stop the extension loop
   * 
   * Clears the interval started by this.startExtensionLoop and assigngs
   * this.extendIntervalId to null
   */
  private stopExtensionLoop() {
    if (this.extendIntervalId === null) {
      console.warn('Extension loop interval not found')
      return
    }

    clearInterval(this.extendIntervalId)
    this.extendIntervalId = null
  }

  /**
   * Event listener for 'mousemove'
   * @param {MouseEvent} e Event object
   */
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

      const isExtendXPrev = this.isExtendX
      const isExtendYPrev = this.isExtendY
      const isReduceXPrev = this.isReduceX
      const isReduceYPrev = this.isReduceY
      this.checkExtendVirtualDimensions()

      const isExtension = this.isExtendX || this.isExtendY || this.isReduceX || this.isReduceY

      const isChange = (this.isExtendX !== isExtendXPrev)
        || (this.isExtendY !== isExtendYPrev)
        || (this.isReduceX !== isReduceXPrev)
        || (this.isReduceY !== isReduceYPrev)

      if (isExtension && !this.extendIntervalId) {
        // this.extendIntervalId = setInterval(() => {
        //   // this.isExtendLooping = true
        //   this.extendLoop()
        // }, 1/60)
        this.startExtensionLoop()
      } else if (isChange && this.extendIntervalId !== null) {
        this.stopExtensionLoop()
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

      if (
        pointDistances[0] <= GraphCanvas.SNAP_DISTANCE_POINT
        && pointDistances[0] < pointDistances[1]
      ) {
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

    // CSS - works together with mouseDown and mouseUp
    // Grabbing cursors ~ for the old dogs out there 👴
    if (this.highlightedPoint) {
      if (this.isPointSelected) {
        this.htmlElement.style.cursor = 'grabbing'  
      } else {
        this.htmlElement.style.cursor = 'grab'  
      }
    } else {
      this.htmlElement.style.cursor = 'default'
    }
  }

  /**
   * Listener for mousedown event
   */
  private handleMouseDown() {
    if (this.highlightedPoint !== null) {
      this.isPointSelected = true

      // CSS - works together with mouseMove and mouseUp
      this.htmlElement.style.cursor = 'grabbing'
    }
  }

  /**
   * Listener for mouseup event
   */
  private handleMouseUp() {
    if (this.isPointSelected) {
      this.isPointSelected = false
      
      if (this.changeListener !== null) {
        const newSizes: [DimensionUnitPair, DimensionUnitPair] = [
          [this.p1.x, this.p1.y],
          [this.p2.x, this.p2.y]
        ]

        this.changeListener({ sizes: newSizes })
      }

      if (typeof this.extendIntervalId === 'number') {
        this.stopExtensionLoop()
      }

      // CSS - works together with mouseMove and mouseDown
      if (this.highlightedPoint) {
        this.htmlElement.style.cursor = 'grab'
      } else {
        this.htmlElement.style.cursor = 'default'
      }
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
    const pointsElement = points.map(point => (
      this.virtualToElementCoords(point)
    ))

    const ranges = getArrayPairsOf(pointsElement)

    const linearFunctions = ranges.map(([start, end]) => (
      new LinearFunction(start, end))
    )

    const rangeDistances = linearFunctions.map((linearFunction, i) => (
      linearFunction.distanceToPointInRange(
        this.cursorCoords,
        ranges[i][0].x,
        ranges[i][1].x
      ))
    )

    const isInSnappingDistance = rangeDistances.some(distance => (
      distance <= GraphCanvas.SNAP_DISTANCE_LINE
    ))

    if (isInSnappingDistance) {
      const nearestLineDistance = rangeDistances
        .map((distance, i) => (
          [i, distance]
        ))
        .sort((distTupleA, distTupleB) => (
          distTupleA[1] - distTupleB[1]
        ))[0]
      
      const nearestPointDistance = pointsElement
        .map(point => (
          [point, Point.distanceBetween(point, this.cursorCoords)] as [Point, number]
        ))
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

  // private updateClientRect() {
  //   this.boundingRect = this.htmlElement.getBoundingClientRect()
  // }

  /**
   * Transform viewport units to virtual units
   * @param {string} dimension In which dimension to transform
   * @param {number} unit Amount to transform
   * @returns {number} Respective virtual units
   */
  private elementToVirtualUnits(dimension: 'x' | 'y', absoluteElementUnit: number): number {
    const virtualSize = dimension === 'x'
      ? this.virtualWidth
      : this.virtualHeight
    const gridSize = dimension === 'x'
      ? this.gridWidth
      : this.gridHeight

    return absoluteElementUnit * (virtualSize / gridSize)
  }

  /**
   * Transform virtual units to element units
   * @param {string} dimension In which dimension to transform
   * @param {number} unit Amount to transform
   * @returns {number} Respective element units
   */
  private virtualToElementUnits(dimension: 'x' | 'y', virtualUnit: number): number {
    const virtualSize = dimension === 'x'
      ? this.virtualWidth
      : this.virtualHeight
    const gridSize = dimension === 'x'
      ? this.gridWidth
      : this.gridHeight

    return virtualUnit / (virtualSize / gridSize)
  }

  /**
   * Adapt viewport coordinates to local element coordinates
   * @param {Point} absoluteViewportCoords Point in viewport
   * @returns {Point} Point's position relative to DOM element
   */
  private viewportToElementCoords(absoluteViewportCoords: Point) {
    return new Point(
      absoluteViewportCoords.x - this.boundingRect.left,
      absoluteViewportCoords.y - this.boundingRect.top
    )
  }

  /**
   * Get coordinates of virtual axis system point in its relative position in DOM element
   * @param {Point} virtualCoords Point in virtual axis system
   * @returns {Point} Point's position relative to DOM element
   */
  private virtualToElementCoords(virtualCoords: Point) {
    /** Virtual Y represented from top to bottom */
    const virtualYInverse = (this.virtualHeight - virtualCoords.y)

    const elementRelativeX = this.virtualToElementUnits('x', virtualCoords.x)
      + GraphCanvas.MARGIN_LEFT
    const elementRelativeY = this.virtualToElementUnits('y', virtualYInverse)
      + GraphCanvas.MARGIN_TOP

    return new Point(elementRelativeX, elementRelativeY)
  }

  /**
   * Get relative coordinates from DOM element in its position in virtual axis system
   * @param {Point} elementCoords Point relative to DOM element
   * @returns {Point} Point's position in virtual axis system
   */
  private elementToVirtualCoords(elementCoords: Point) {
    /** Virtual Y represented from top to bottom */
    const virtualX = this.elementToVirtualUnits('x', elementCoords.x - GraphCanvas.MARGIN_LEFT)
    const virtualYInverse = this.elementToVirtualUnits('y', elementCoords.y - GraphCanvas.MARGIN_TOP)

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
  private drawLine(
    pA: Point,
    pB: Point,
    config?: {
      color?: string | CanvasGradient | CanvasPattern,
      lineWidth?: number
    }
  ) {
    const fillStylePrev = this.ctx.fillStyle
    const lineWidthPrev = this.ctx.lineWidth
    this.ctx.strokeStyle = config?.color || fillStylePrev
    this.ctx.lineWidth = config?.lineWidth || lineWidthPrev

    this.ctx.beginPath()
    this.ctx.moveTo(Math.round(pA.x), Math.round(pA.y))
    this.ctx.lineTo(Math.round(pB.x), Math.round(pB.y))
    this.ctx.closePath()
    this.ctx.stroke()

    this.ctx.fillStyle = fillStylePrev
    this.ctx.lineWidth = lineWidthPrev
  }

  /**
   * Write text
   * @param {string} text The text to be written
   * @param {Point} p Point where to write the text
   */
  private drawText(
    text: string,
    p: Point,
    config?: {
      color?: string | CanvasGradient | CanvasPattern,
      textAlign?: CanvasTextAlign,
      font?: string
    }
  ) {
    const fillStylePrev = this.ctx.fillStyle
    const textAlignPrev = this.ctx.textAlign
    const fontPrev = this.ctx.font
    
    const color = config?.color || fillStylePrev
    const textAlign = config?.textAlign || textAlignPrev
    const font = config?.font || fontPrev

    this.ctx.fillStyle = color
    this.ctx.textAlign = textAlign
    this.ctx.font = font
    this.ctx.fillText(text, p.x, p.y)

    this.ctx.fillStyle = fillStylePrev
    this.ctx.textAlign = textAlignPrev
    this.ctx.font = fontPrev
  }

  /**
   * Draw a rectangle
   * @param {Point} topLeft Top left coordinate of the rectangle
   * @param {Point} bottomRight Bottom right coordinate of the rectangle
   */
  private drawRect(p: Point, width: number, height: number, color: typeof this.ctx.fillStyle = 'black') {
    const fillStylePrev = this.ctx.fillStyle

    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.rect(p.x, p.y, width, height)
    this.ctx.fill()

    this.ctx.fillStyle = fillStylePrev
  }

  /**
   * Draw square representing a point
   * @param {Point} p Point where the center of the square will be
   * @param {number} side Length of the sides of the square
   * @param {string} color Color of the square
   */
  // private drawPointSquare(p: Point, side: number = 20, color: typeof this.ctx.fillStyle = 'black') {
  //   const offsetOrigin = new Point(p.x - side/2, p.y - side/2)
  //   const fillStylePrev = this.ctx.fillStyle

  //   this.ctx.fillStyle = color
  //   this.ctx.fillRect(offsetOrigin.x, offsetOrigin.y, side, side)

  //   this.ctx.fillStyle = fillStylePrev
  // }

  /**
   * Draw circle representing a point
   * @param {Point} p Point where the center of the circle will be
   * @param {number} radius Length of the sides of the circle
   * @param {string} color Color of the circle
   */
  private drawPointCircle(
    p: Point,
    config?: {
      radius?: number,
      color?: string | CanvasGradient | CanvasPattern
    }
  ) {
    const fillStylePrev = this.ctx.fillStyle
    const radius = config?.radius || 20

    this.ctx.fillStyle = config?.color || fillStylePrev

    this.ctx.beginPath()
    this.ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI)
    this.ctx.closePath()

    this.ctx.fill()
    this.ctx.fillStyle = fillStylePrev
  }

  /**
   * Draw graph
   */
  private draw() {
    this.ctx.clearRect(0, 0, this.boundingRect.width, this.boundingRect.width)
    // const fillStylePrev = this.ctx.fillStyle

    // Draw rulers

    // this.ctx.fillStyle = 'white'
    // this.ctx.fillRect(0, 0, GraphCanvas.MARGIN_LEFT, this.boundingRect.height)
    // this.ctx.fillRect(
    //   0,
    //   this.boundingRect.height - GraphCanvas.MARGIN_BOTTOM,
    //   this.boundingRect.width,
    //   GraphCanvas.MARGIN_BOTTOM
    // )
    // this.ctx.fillStyle = fillStylePrev

    const markingLengthX = this.elementToVirtualUnits(
      'y',
      GraphCanvas.RULER_MARKING_LENGTH
    )
    for (let i = 0; i < this.virtualWidth; i += this.rulerSpacing.x) {
      // Markings
      const markStart = this.virtualToElementCoords(new Point(i, 0))
      const markEnd = this.virtualToElementCoords(
        new Point(i, 0 - markingLengthX)
      )

      // Don't draw first marking on X axis
      if (i) {
        this.drawLine(
          markStart,
          markEnd
        )
      }
      this.drawText(
        (Math.round(i * 100) / 100).toString(),
        new Point(markEnd.x, markEnd.y + 10)
      )

      // Lines
      if (i) {
        const lineEnd = this.virtualToElementCoords(new Point(i, this.virtualHeight))
        this.drawLine(
          markStart,
          lineEnd,
          { color: GraphCanvas.COLOR_MAIN_SOFT }
        )
      }
    }

    const markingLengthY = this.elementToVirtualUnits(
      'x',
      GraphCanvas.RULER_MARKING_LENGTH
    )
    for (let i = 0; i < this.virtualHeight; i += this.rulerSpacing.y) {
      // Markings
      const markStart = this.virtualToElementCoords(new Point(1, i))
      const markEnd = this.virtualToElementCoords(
        new Point(0 - markingLengthY, i)
      )

      this.drawLine(
        markStart,
        markEnd
      )
      this.drawText(
        (Math.round(i * 100) / 100).toString(),
        new Point(markEnd.x - 4, markEnd.y),
        { textAlign: 'right'}
      )

      // Lines
      if (i) {
        const lineEnd = this.virtualToElementCoords(new Point(this.virtualWidth, i))
        this.drawLine(
          markStart,
          lineEnd,
          { color: GraphCanvas.COLOR_MAIN_SOFT }
        )
      }
    }

    // Draw function lines
    const pointSequence = [this.pStart, this.p1, this.p2, this.pEnd]
    pointSequence.map(p => this.virtualToElementCoords(p))
      .reduce((a, b) => {
        this.drawLine(a, b, { color: GraphCanvas.COLOR_MAIN, lineWidth: 2 })
        return b
      })

    // Draw edges
    this.drawLine(
      this.virtualToElementCoords(new Point(0, 0)),
      this.virtualToElementCoords(new Point(this.virtualWidth, 0)),
      { color: 'black' }
    )
    this.drawLine(
      this.virtualToElementCoords(new Point(0, 0)),
      this.virtualToElementCoords(new Point(0, this.virtualHeight)),
      { color: 'black' }
    )

    // Draw snapped point
    if (this.lineSnappedCursor !== null) {
      this.drawPointCircle(
        this.lineSnappedCursor,
        {
          radius: GraphCanvas.POINT_CIRCLE_RADIUS,
          color: GraphCanvas.COLOR_MAIN_MID
        }
      )
    }

    // Draw points
    const colors = [
      this.highlightedPoint === 'p1'
        ? GraphCanvas.COLOR_HIGHLIGHT
        : GraphCanvas.COLOR_MAIN,
      this.highlightedPoint === 'p2'
        ? GraphCanvas.COLOR_HIGHLIGHT
        : GraphCanvas.COLOR_MAIN
    ]

    this.drawPointCircle(
      this.virtualToElementCoords(this.p1),
      { radius: GraphCanvas.POINT_CIRCLE_RADIUS, color: colors[0] }
    )
    this.drawPointCircle(
      this.virtualToElementCoords(this.p2),
      { radius: GraphCanvas.POINT_CIRCLE_RADIUS, color: colors[1] }
    )

    // const endOfXRuler = this.virtualToElementCoords(new Point(this.virtualWidth, 0))
    // const endOfYRuler = this.virtualToElementCoords(new Point(0, this.virtualHeight))

    const viewportCoords = this.virtualToElementCoords(new Point(this.virtualWidth, 0))
    this.drawText(
      `(${this.cssUnitGrowth})`,
      new Point(viewportCoords.x + 10, viewportCoords.y),
      { textAlign: 'left', font: 'bold 12px sans-serif' }
    )

    this.drawText(
      `(${this.cssUnitSize})`,
      new Point(
        GraphCanvas.MARGIN_LEFT,
        14
      ),
      { textAlign: 'right', font: 'bold 12px sans-serif' }
    )

    // Draw info label
    if (this.lineSnappedCursor || this.highlightedPoint) {
      const SPACING = 5
      const FONT_SIZE = 14

      const origin = this.lineSnappedCursor
        ? this.lineSnappedCursor
        : this.virtualToElementCoords(this[this.highlightedPoint || 'p1'])

      // const labelVirtualWidth = GraphCanvas.INFO_LABEL_WIDTH
      // const labelVirtualHeight = GraphCanvas.INFO_LABEL_HEIGHT
      const totalWidth = GraphCanvas.INFO_LABEL_WIDTH
        + GraphCanvas.POINT_CIRCLE_RADIUS
        // + SPACING
      const totalHeight = GraphCanvas.INFO_LABEL_HEIGHT
        + GraphCanvas.POINT_CIRCLE_RADIUS
        + SPACING

      // Should be drawn in the order:
      // Top Left > Top Right > Bottom Left > Bottom Right
      const isLeftSpace = origin.x - totalWidth
        > this.virtualToElementCoords(new Point(0, 0)).x
      const isTopSpace = origin.y - totalHeight
        > this.virtualToElementCoords(new Point(0, this.virtualHeight)).y

      const topLeft = new Point(
        !isLeftSpace ? origin.x /*+ SPACING * 2*/ : origin.x - totalWidth,
        !isTopSpace ? origin.y + SPACING * 2 : origin.y - totalHeight
      )

      // Box
      // const boxCoordinates = new Point(
      //   !isLeftSpace
      //     ? origin.x /*+ SPACING * 2*/
      //     : origin.x - totalWidth,
      //   !isTopSpace
      //     ? origin.y + SPACING * 2
      //     : origin.y - totalHeight
      // )

      this.drawRect(
        topLeft,
        GraphCanvas.INFO_LABEL_WIDTH,
        GraphCanvas.INFO_LABEL_HEIGHT,
        'rgba(0, 0, 0, 0.7)'
      )

      // Texts
      const DISTANCE = 3

      const textXLeft = topLeft.x + FONT_SIZE / 2
      const textXRight = topLeft.x
        + GraphCanvas.INFO_LABEL_WIDTH
        - FONT_SIZE / 2

      const textTopY = topLeft.y
        + (GraphCanvas.INFO_LABEL_HEIGHT / 2)
        - FONT_SIZE / 5
        - DISTANCE
      const textBottomY = topLeft.y
        + (GraphCanvas.INFO_LABEL_HEIGHT / 2)
        + FONT_SIZE
        + DISTANCE

      const units = this.elementToVirtualCoords(origin)

      // Unit names
      this.drawText(
        `Viewport:`,
        new Point(textXLeft, textTopY),
        {
          color: GraphCanvas.COLOR_BACKGROUND,
          font: `bold ${FONT_SIZE}px sans-serif`
        }
      )
      this.drawText(
        `Size:`,
        new Point(textXLeft, textBottomY),
        {
          color: GraphCanvas.COLOR_BACKGROUND,
          font: `bold ${FONT_SIZE}px sans-serif`
        }
      )
      
      // Values
      this.drawText(
        `${Math.round(units.x * 10) / 10}${this.cssUnitGrowth}`,
        new Point(textXRight, textTopY),
        {
          color: GraphCanvas.COLOR_BACKGROUND,
          font: `${FONT_SIZE}px sans-serif`,
          textAlign: 'right'
        }
      )
      this.drawText(
        `${Math.round(units.y * 100) / 100}${this.cssUnitSize}`,
        new Point(textXRight, textBottomY),
        {
          color: GraphCanvas.COLOR_BACKGROUND,
          font: `${FONT_SIZE}px sans-serif`,
          textAlign: 'right'
        }
      )
    }
  }

  /**
   * Redraws the canvas only when the display rerenders
   */
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

  /**
   * Sets a listener for changes in the graph
   * 
   * The argument passed to the callback is a state object containing only the
   * modified data
   */
  public set onChange(cb: (newData: Partial<StateObject>) => void) {
    this.changeListener = cb
  }

  /**
   * Updates the graph with new data
   * 
   * @param {StateObject} newDataObject The new data
   */
  public update(newDataObject: StateObject) {
    if ('isClampedMin' in newDataObject) {
      this.isClampedMin = newDataObject.isClampedMin
    }
    if ('isClampedMax' in newDataObject) {
      this.isClampedMax = newDataObject.isClampedMax
    }

    if ('sizes' in newDataObject) {
      this.movePoint('p1', new Point(...newDataObject.sizes[0]), false)
      this.movePoint('p2', new Point(...newDataObject.sizes[1]), false)

      this.setVirtualDimensionsFromPoints()

      this.updateRulerSpacing('x')
      this.updateRulerSpacing('y')

      this.updateLimitPoints()
    }

    if ('sizeUnit' in newDataObject) {
      this.cssUnitSize = newDataObject.sizeUnit
    }
    if ('viewportUnit' in newDataObject) {
      this.cssUnitGrowth = newDataObject.viewportUnit
    }

    this.refresh()
  }
}