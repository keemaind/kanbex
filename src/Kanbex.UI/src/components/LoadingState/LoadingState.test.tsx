import { render, screen } from '@testing-library/react'
import { describe, expect, it } from '@jest/globals'
import { LoadingState } from './LoadingState.js'

describe('LoadingState', () => {
  it('renders the default accessible status', () => {
    render(<LoadingState />)

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText('Загрузка…')).toBeInTheDocument()
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
  })

  it('supports a custom label and compact mode', () => {
    const { container } = render(<LoadingState label="Загружаем доску…" compact />)

    expect(screen.getByText('Загружаем доску…')).toBeInTheDocument()
    expect(container.querySelector('.kb-loading')).toHaveClass('kb-loading--compact')
  })
})
