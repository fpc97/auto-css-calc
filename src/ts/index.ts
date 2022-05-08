import { Observable as ObservableClass } from "../utils"
import store from '../store'

export type Observable = (typeof ObservableClass)['prototype']

export type Store = typeof store

export type CSSSizeUnits = 'px' | 'rem' | 'em'

export type CSSViewportUnits = 'vw' | 'vh'

export type DimensionUnitPair = [dimension: number, unit: number]

export type StateObject = {
  sizeUnit: CSSSizeUnits;
  viewportUnit: CSSViewportUnits;
  sizes: [DimensionUnitPair, DimensionUnitPair];
  toPxConversion: number;
  isClampedMin: boolean;
  isClampedMax: boolean;
}

export type LocalModel = {
  isInitialized: false;
} | {
  isInitialized: true;
  set(newVal: Partial<StateObject>): void;
}

export type StoreInterface = {
  subscribe(newData: StateObject, initialize?: boolean): void;
  unsubscribe: Observable['unsubscribe'];
  get(): StateObject;
  set(newData: StateObject): void;
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

/** Utilities */
export type KeysOrType<T> = T extends {[k: string | number | symbol]: unknown}
  ? {[K in keyof T]: T[K]}
  : T