import { describe, expect, it } from '@jest/globals'

import { pluralize } from './pluralize.js'

const forms = ['проект', 'проекта', 'проектов'] as const

describe('pluralize', () => {
  it('uses the singular form for 1 and 21', () => {
    expect(pluralize(1, forms)).toBe('проект')
    expect(pluralize(21, forms)).toBe('проект')
  })

  it('uses the few form for 2–4 and 22–24', () => {
    expect(pluralize(2, forms)).toBe('проекта')
    expect(pluralize(4, forms)).toBe('проекта')
    expect(pluralize(22, forms)).toBe('проекта')
  })

  it('uses the many form for 0, 5–20 and 11–14', () => {
    expect(pluralize(0, forms)).toBe('проектов')
    expect(pluralize(5, forms)).toBe('проектов')
    expect(pluralize(11, forms)).toBe('проектов')
    expect(pluralize(14, forms)).toBe('проектов')
    expect(pluralize(25, forms)).toBe('проектов')
  })

  it('handles negative values by absolute value', () => {
    expect(pluralize(-1, forms)).toBe('проект')
    expect(pluralize(-3, forms)).toBe('проекта')
  })
})
