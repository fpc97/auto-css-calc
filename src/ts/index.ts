export type KeysOrType<T> = T extends {[k: string | number | symbol]: unknown} ? {[K in keyof T]: any} : T

export type DimensionUnitPair = [number, number]

export type StateObject = {
  unit: 'px' | 'rem' | 'em';
  sizes: [DimensionUnitPair, DimensionUnitPair];
  toPxConversion: number;
}

export interface FormInput extends HTMLFormElement{
  'size-0': HTMLInputElement;
  'size-1': HTMLInputElement;
  'viewport-0': HTMLInputElement;
  'viewport-1': HTMLInputElement;
  'unit': { value: string; checked: boolean }[] & RadioNodeList;
  'to-px-conversion': HTMLInputElement;
}