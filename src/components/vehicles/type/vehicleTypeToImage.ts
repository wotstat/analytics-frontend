
import { FunctionalComponent, SVGAttributes } from 'vue'

export type VehicleType = 'MT' | 'LT' | 'HT' | 'AT' | 'SPG' | 'mediumtank' | 'lighttank' | 'heavytank' | 'at-spg' | 'spg' | 'any'

const components = import.meta.glob<{ default: FunctionalComponent<SVGAttributes> }>('./images/*.svg', { eager: true })
const raw = import.meta.glob<{ default: FunctionalComponent<SVGAttributes> }>('./images/*.svg', { eager: true, query: 'raw' })
const url = import.meta.glob<{ default: FunctionalComponent<SVGAttributes> }>('./images/*.svg', { eager: true, query: 'url' })

const vehicleTypeName: Record<VehicleType, string> = {
  MT: 'mediumtank',
  LT: 'lighttank',
  HT: 'heavytank',
  AT: 'at-spg',
  SPG: 'spg',
  mediumtank: 'mediumtank',
  lighttank: 'lighttank',
  heavytank: 'heavytank',
  'at-spg': 'at-spg',
  spg: 'spg',
  any: 'any'
};


export function vehicleTypeToImage(type: VehicleType, format?: 'component'): FunctionalComponent<SVGAttributes>
export function vehicleTypeToImage(type: VehicleType, format?: 'raw'): string
export function vehicleTypeToImage(type: VehicleType, format?: 'url'): string
export function vehicleTypeToImage(type: VehicleType, format: 'url' | 'raw' | 'component' = 'component'): any {

  const name = vehicleTypeName[type] || vehicleTypeName['any'];

  if (format === 'component') return components[`./images/${name}.svg`];
  if (format === 'raw') return raw[`./images/${name}.svg`].default;
  if (format === 'url') return url[`./images/${name}.svg`].default;
}
