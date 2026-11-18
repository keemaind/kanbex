import { render, screen } from '@testing-library/react'
import { describe, expect, it } from '@jest/globals'
import { StatusBadge } from './StatusBadge.js'

describe('StatusBadge', () => {
  it('renders a neutral badge without a dot by default', () => {
    render(<StatusBadge>Черновик</StatusBadge>)

    const badge = screen.getByText('Черновик')
    expect(badge).toHaveClass('kb-badge', 'kb-badge--neutral')
    expect(badge.querySelector('.kb-badge__dot')).toBeNull()
  })

  it('maps every tone to its CSS class, renders the dot and title', () => {
    const tones = ['neutral', 'info', 'success', 'warning', 'danger'] as const

    for (const tone of tones) {
      const { unmount } = render(
        <StatusBadge tone={tone} withDot title={`Подсказка ${tone}`}>
          {tone}
        </StatusBadge>,
      )

      const badge = screen.getByTitle(`Подсказка ${tone}`)
      expect(badge).toHaveClass(`kb-badge--${tone}`)
      expect(badge.querySelector('.kb-badge__dot')).toHaveAttribute('aria-hidden', 'true')
      unmount()
    }
  })
})
