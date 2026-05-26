import { clothing } from './clothing'
import { footwear } from './footwear'
import { electronics } from './electronics'
import { food } from './food'
import type { BusinessType } from './base'

export const businessTypes: BusinessType[] = [clothing, footwear, electronics, food]

export function getBusinessType(id: string): BusinessType | undefined {
  return businessTypes.find((bt) => bt.id === id)
}

export { clothing, footwear, electronics, food }
export type { BusinessType, VariantAxis, SampleProduct, SampleProductVariant } from './base'
