import { describe, expect, it } from '@jest/globals'

import { describeUpdatedAt, getProjectProgress } from './projectSummary.js'

describe('getProjectProgress', () => {
  it('returns the completed share of all cards', () => {
    expect(getProjectProgress({ taskCount: 4, completedTaskCount: 1 })).toBeCloseTo(0.25)
  })

  it('returns zero for a board without cards', () => {
    expect(getProjectProgress({ taskCount: 0, completedTaskCount: 0 })).toBe(0)
  })

  it('clamps values into the 0..1 range', () => {
    expect(getProjectProgress({ taskCount: 2, completedTaskCount: 5 })).toBe(1)
    expect(getProjectProgress({ taskCount: 2, completedTaskCount: -1 })).toBe(0)
  })
})

describe('describeUpdatedAt', () => {
  const now = new Date(2026, 10, 20, 15, 0, 0)

  it('recognizes today', () => {
    expect(describeUpdatedAt(new Date(2026, 10, 20, 9, 30).toISOString(), now)).toBe('Обновлён сегодня')
  })

  it('recognizes yesterday', () => {
    expect(describeUpdatedAt(new Date(2026, 10, 19, 22, 0).toISOString(), now)).toBe('Обновлён вчера')
  })

  it('shows the day and month for older dates', () => {
    expect(describeUpdatedAt(new Date(2026, 10, 3, 12, 0).toISOString(), now)).toContain('ноября')
  })

  it('handles an invalid date', () => {
    expect(describeUpdatedAt('not-a-date', now)).toBe('Дата обновления неизвестна')
  })
})
