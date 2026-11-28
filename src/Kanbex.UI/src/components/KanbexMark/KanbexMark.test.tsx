import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react'

import { KanbexMark } from './KanbexMark.js'

describe('KanbexMark', () => {
  it('renders the accessible compact mark with the brand cards', () => {
    render(<KanbexMark />)

    const mark = screen.getByRole('img', { name: 'Kanbex' })

    expect(mark).toHaveClass('kb-mark')
    expect(mark).toHaveAttribute('viewBox', '76 89 148 147')
    expect(mark).toHaveStyle({ height: '32px' })
    expect(mark.querySelectorAll('path')).toHaveLength(6)
    expect(mark.querySelectorAll('rect')).toHaveLength(3)
    expect(mark.querySelector('rect[fill="#A6A6FF"]')).toBeInTheDocument()
    expect(mark.querySelector('rect[fill="#FF8181"]')).toBeInTheDocument()
    expect(mark.querySelector('rect[fill="#4EFF5A"]')).toBeInTheDocument()
  })

  it('supports a custom height, label and class name', () => {
    render(<KanbexMark height={48} label="Знак Kanbex" className="kb-mark--rail" />)

    const mark = screen.getByRole('img', { name: 'Знак Kanbex' })

    expect(mark).toHaveClass('kb-mark', 'kb-mark--rail')
    expect(mark).toHaveStyle({ height: '48px' })
  })
})
