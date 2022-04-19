export type KeysOrType<T> = T extends {[k: string | number | symbol]: unknown}
  ? {[K in keyof T]: T[K]}
  : T

export type CSSSizeUnits = 'px' | 'rem' | 'em'

export type CSSViewportUnits = 'vw' | 'vh'

export type DimensionUnitPair = [number, number]

export type StateObject = {
  sizeUnit: CSSSizeUnits;
  viewportUnit: CSSViewportUnits;
  sizes: [DimensionUnitPair, DimensionUnitPair];
  toPxConversion: number;
}

export interface FormInput extends HTMLFormElement{
  'size-0': HTMLInputElement;
  'size-1': HTMLInputElement;
  'viewport-0': HTMLInputElement;
  'viewport-1': HTMLInputElement;
  'size-unit': { value: CSSSizeUnits; checked: boolean }[] & RadioNodeList;
  'viewport-unit': { value: CSSViewportUnits; checked: boolean }[] & RadioNodeList;
  'to-px-conversion': HTMLInputElement;
}

export type Point = {
  x: number;
  y: number;
}