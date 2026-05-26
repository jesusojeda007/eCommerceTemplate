'use client'

import { useState, useEffect, useRef } from 'react'
import type { ProductOption, ProductVariant } from '@/lib/data/types'

const HEX_REGEX = /^#[0-9a-f]{3,6}$/i

function isHexColor(value: string): boolean {
  return HEX_REGEX.test(value)
}

interface VariantSelectorProps {
  options: ProductOption[]
  variants: ProductVariant[]
  selectedVariant: ProductVariant | null
  onSelect: (variant: ProductVariant | null) => void
}

function buildInitialValues(
  options: ProductOption[],
  selectedVariant: ProductVariant | null,
): Record<string, string> {
  if (!selectedVariant) return {}
  const map: Record<string, string> = {}
  for (const opt of options) {
    const match = selectedVariant.optionValues.find((ov) => ov.optionId === opt.id)
    if (match) map[opt.id] = match.id
  }
  return map
}

export function VariantSelector({ options, variants, selectedVariant, onSelect }: VariantSelectorProps) {
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>(() =>
    buildInitialValues(options, selectedVariant),
  )
  // Track whether this is the first render so we don't call onSelect on mount
  const isMounted = useRef(false)

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      return
    }

    if (Object.keys(selectedValues).length === 0) {
      onSelect(null)
      return
    }
    // All axes must be selected to resolve a variant
    const allSelected = options.every((opt) => selectedValues[opt.id])
    if (!allSelected) {
      onSelect(null)
      return
    }
    const match = variants.find((v) =>
      options.every((opt) => {
        const selectedValueId = selectedValues[opt.id]
        return v.optionValues.some((ov) => ov.id === selectedValueId)
      })
    )
    onSelect(match ?? null)
  }, [selectedValues]) // eslint-disable-line react-hooks/exhaustive-deps

  function selectValue(optionId: string, valueId: string) {
    setSelectedValues((prev) => ({ ...prev, [optionId]: valueId }))
  }

  // A value is available if there is at least one in-stock variant that:
  // 1. Has this optionValue
  // 2. Matches all OTHER currently-selected axes
  function isValueAvailable(optionId: string, valueId: string): boolean {
    return variants.some((v) => {
      if (!v.optionValues.some((ov) => ov.id === valueId)) return false
      for (const [otherOptId, otherValId] of Object.entries(selectedValues)) {
        if (otherOptId === optionId) continue
        if (!v.optionValues.some((ov) => ov.id === otherValId)) return false
      }
      return v.stock > 0
    })
  }

  return (
    <div className="space-y-4">
      {options.map((option) => {
        const selectedValueId = selectedValues[option.id]
        const selectedValue = option.values.find((v) => v.id === selectedValueId)

        return (
          <div key={option.id}>
            <p className="text-sm font-semibold mb-2">
              {option.name}
              {selectedValue && (
                <span className="font-normal text-muted-foreground">: {selectedValue.value}</span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {option.values.map((optValue) => {
                const isSelected = selectedValueId === optValue.id
                const available = isValueAvailable(option.id, optValue.id)

                if (isHexColor(optValue.value)) {
                  return (
                    <button
                      key={optValue.id}
                      data-color-swatch
                      onClick={() => available && selectValue(option.id, optValue.id)}
                      title={optValue.value}
                      aria-label={`Color ${optValue.value}${!available ? ' (sin stock)' : ''}`}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: optValue.value,
                        border: '1px solid #ddd',
                        boxShadow: isSelected
                          ? `0 0 0 2px white, 0 0 0 4px ${optValue.value}`
                          : undefined,
                        opacity: available ? 1 : 0.35,
                        cursor: available ? 'pointer' : 'not-allowed',
                        flexShrink: 0,
                      }}
                    />
                  )
                }

                return (
                  <button
                    key={optValue.id}
                    onClick={() => selectValue(option.id, optValue.id)}
                    disabled={!available}
                    className={[
                      'px-3 py-1.5 text-sm rounded-md border transition-all',
                      isSelected
                        ? 'border-2 border-foreground font-semibold'
                        : 'border-border hover:border-foreground',
                      !available ? 'opacity-40 line-through cursor-not-allowed' : 'cursor-pointer',
                    ].join(' ')}
                  >
                    {optValue.value}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
