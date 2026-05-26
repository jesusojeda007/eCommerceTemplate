import { render, screen, fireEvent } from '@testing-library/react'
import { VariantSelector } from '@/components/product/VariantSelector'
import type { ProductOption, ProductVariant } from '@/lib/data/types'

const sOptions: ProductOption[] = [
  {
    id: 'opt1',
    name: 'Talle',
    position: 0,
    values: [
      { id: 'v1', value: 'S', position: 0, optionId: 'opt1' },
      { id: 'v2', value: 'M', position: 1, optionId: 'opt1' },
      { id: 'v3', value: 'L', position: 2, optionId: 'opt1' },
    ],
  },
]

const sVariants: ProductVariant[] = [
  { id: 'var1', productId: 'p1', sku: null, price: 25, compareAtPrice: null, stock: 10, optionValues: [{ id: 'v1', value: 'S', position: 0, optionId: 'opt1' }] },
  { id: 'var2', productId: 'p1', sku: null, price: 25, compareAtPrice: null, stock: 0,  optionValues: [{ id: 'v2', value: 'M', position: 1, optionId: 'opt1' }] },
  { id: 'var3', productId: 'p1', sku: null, price: 30, compareAtPrice: null, stock: 5,  optionValues: [{ id: 'v3', value: 'L', position: 2, optionId: 'opt1' }] },
]

describe('VariantSelector', () => {
  it('renders option name and all values', () => {
    render(<VariantSelector options={sOptions} variants={sVariants} selectedVariant={null} onSelect={jest.fn()} />)
    expect(screen.getByText('Talle')).toBeInTheDocument()
    expect(screen.getByText('S')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByText('L')).toBeInTheDocument()
  })

  it('calls onSelect with matching variant when value clicked', () => {
    const onSelect = jest.fn()
    render(<VariantSelector options={sOptions} variants={sVariants} selectedVariant={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('S'))
    expect(onSelect).toHaveBeenCalledWith(sVariants[0])
  })

  it('marks out-of-stock value as disabled', () => {
    render(<VariantSelector options={sOptions} variants={sVariants} selectedVariant={null} onSelect={jest.fn()} />)
    const mBtn = screen.getByText('M').closest('button')
    expect(mBtn).toBeDisabled()
  })

  it('does not call onSelect when clicking disabled button', () => {
    const onSelect = jest.fn()
    render(<VariantSelector options={sOptions} variants={sVariants} selectedVariant={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('M'))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('renders hex color values as circle buttons without text', () => {
    const colorOptions: ProductOption[] = [{
      id: 'opt2',
      name: 'Color',
      position: 0,
      values: [
        { id: 'c1', value: '#000000', position: 0, optionId: 'opt2' },
        { id: 'c2', value: '#ffffff', position: 1, optionId: 'opt2' },
      ],
    }]
    const colorVariants: ProductVariant[] = [
      { id: 'var4', productId: 'p1', sku: null, price: 25, compareAtPrice: null, stock: 5, optionValues: [{ id: 'c1', value: '#000000', position: 0, optionId: 'opt2' }] },
      { id: 'var5', productId: 'p1', sku: null, price: 25, compareAtPrice: null, stock: 3, optionValues: [{ id: 'c2', value: '#ffffff', position: 1, optionId: 'opt2' }] },
    ]
    const { container } = render(
      <VariantSelector options={colorOptions} variants={colorVariants} selectedVariant={null} onSelect={jest.fn()} />
    )
    // Hex values should NOT appear as text
    expect(screen.queryByText('#000000')).not.toBeInTheDocument()
    // Should have color circle buttons with data-color-swatch attribute
    const colorBtns = container.querySelectorAll('[data-color-swatch]')
    expect(colorBtns.length).toBe(2)
  })

  it('shows selected value name next to option label', () => {
    render(
      <VariantSelector
        options={sOptions}
        variants={sVariants}
        selectedVariant={sVariants[0]}
        onSelect={jest.fn()}
      />
    )
    expect(screen.getByText(': S')).toBeInTheDocument()
  })
})
