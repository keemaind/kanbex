import { createRef } from 'react'

import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react'

import { AppButton } from './AppButton.js'

describe('AppButton', () => {
  it('renders content, icons, forwards the ref and handles clicks', () => {
    const onClick = jest.fn()
    const ref = createRef<HTMLButtonElement>()

    render(
      <AppButton
        ref={ref}
        variant="tonal"
        size="lg"
        startIcon={<span aria-hidden="true">+</span>}
        endIcon={<span aria-hidden="true">!</span>}
        onClick={onClick}
      >
        Создать
      </AppButton>,
    )

    const button = screen.getByRole('button')

    expect(button).toHaveTextContent('+Создать!')
    expect(ref.current).toBe(button)

    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('stretches to the full width and keeps custom styles', () => {
    render(
      <AppButton fullWidth style={{ color: 'red' }}>
        Войти
      </AppButton>,
    )

    const button = screen.getByRole('button')

    expect(button).toHaveStyle({ width: '100%' })
    expect(button.getAttribute('style')).toContain('color: red')
  })
})
