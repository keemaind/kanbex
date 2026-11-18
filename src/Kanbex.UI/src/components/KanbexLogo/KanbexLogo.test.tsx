import { render, screen } from '@testing-library/react'
import { describe, expect, it } from '@jest/globals'
import { KanbexLogo } from './KanbexLogo.js'

describe('KanbexLogo', () => {
  it('renders the accessible logo with the brand palette', () => {
    render(<KanbexLogo />)

    const logo = screen.getByRole('img', { name: 'Kanbex' })
    expect(logo).toHaveClass('kb-logo')
    expect(logo).toHaveAttribute('viewBox', '105 65 754 154')
    expect(logo).toHaveStyle({ height: '32px' })
    expect(logo.querySelectorAll('path')).toHaveLength(12)
    expect(logo.querySelector('path[fill="#7979FF"]')).toBeInTheDocument()
    expect(logo.querySelector('path[fill="#FE4B4B"]')).toBeInTheDocument()
    expect(logo.querySelector('path[fill="#00C30D"]')).toBeInTheDocument()
  })

  it('supports a custom height, label and class name', () => {
    render(<KanbexLogo height={48} label="Логотип Kanbex" className="kb-logo--header" />)

    const logo = screen.getByRole('img', { name: 'Логотип Kanbex' })
    expect(logo).toHaveClass('kb-logo', 'kb-logo--header')
    expect(logo).toHaveStyle({ height: '48px' })
  })
})
