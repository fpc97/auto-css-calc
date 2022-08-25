import { Observable as ObservableClass } from "../utils"
import store from '../store'

export type Observable = (typeof ObservableClass)['prototype']

export type Store = typeof store

export type CSSSizeUnits = 'px' | 'rem' | 'em'

export type CSSViewportUnits = 'vw' | 'vh'

export type ClampMethods = 'media-query' | 'min-max' | 'clamp'

export type DimensionUnitPair = [dimension: number, unit: number]

export type StateObject = {
  sizes: [DimensionUnitPair, DimensionUnitPair];
  sizeUnit: CSSSizeUnits;
  viewportUnit: CSSSizeUnits;
  followConversion: boolean;
  conversionRate: number;
  growthUnit: CSSViewportUnits;
  useProperty: boolean;
  propertyName: string;
  useSelector: boolean;
  selectorOutside: boolean;
  selectorName: string;
  isClampedMin: boolean;
  isClampedMax: boolean;
  clampMethod: 'media-query' | 'min-max' | 'clamp';
}

export type LocalModel = {
  isInitialized: false;
} | {
  isInitialized: true;
  set(newVal: Partial<StateObject>): void;
  get?: () => StateObject;
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
  'size-unit': { value: CSSSizeUnits; checked: boolean }[] & HTMLSelectElement;
  'viewport-unit': { value: CSSSizeUnits; checked: boolean }[] & HTMLSelectElement;
  'conversion-rate': HTMLInputElement;

  'growth-unit': { value: CSSViewportUnits; checked: boolean }[] & RadioNodeList & HTMLElement[];
  'use-property': HTMLInputElement;
  'font-size': HTMLInputElement;
  'use-selector': HTMLInputElement;
  'selector-outside': HTMLInputElement;
  'selector-name': HTMLInputElement;
  'clamp-at-min': HTMLInputElement;
  'clamp-at-max': HTMLInputElement;
  'clamp-method': { value: ClampMethods; checked: boolean }[] & RadioNodeList & HTMLElement[];
}

export type Point = {
  x: number;
  y: number;
}

/** Utilities */
export type KeysOrType<T> = T extends {[k: string | number | symbol]: unknown}
  ? {[K in keyof T]: T[K]}
  : T