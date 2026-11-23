import '@testing-library/jest-dom/jest-globals'
import { cleanup } from '@testing-library/react'
import { afterEach, jest } from '@jest/globals'
import * as mockReact from 'react'
import type * as ReactTypes from 'react'

afterEach(cleanup)

type MockButtonProps = ReactTypes.ComponentPropsWithoutRef<'button'> & {
  variant?: string
  size?: string
  startIcon?: ReactTypes.ReactNode
  endIcon?: ReactTypes.ReactNode
}

type MockLoadingIndicatorProps = ReactTypes.HTMLAttributes<HTMLSpanElement> & {
  size?: number
}

type MockCircularIndicatorProps = ReactTypes.SVGAttributes<SVGSVGElement> & {
  size?: number
  shape?: string
}

jest.mock('m3-expressive-react', () => {
  const Button = mockReact.forwardRef<HTMLButtonElement, MockButtonProps>(function MockButton(
    { variant, size, startIcon, endIcon, children, ...props },
    ref,
  ) {
    void variant
    void size

    return mockReact.createElement('button', { ...props, ref }, startIcon, children, endIcon)
  })

  function LoadingIndicator({ size, ...props }: MockLoadingIndicatorProps) {
    void size

    return mockReact.createElement('span', { ...props, 'data-testid': 'loading-indicator' })
  }

  function CircularProgressIndicator({ size, shape, ...props }: MockCircularIndicatorProps) {
    void size
    void shape

    return mockReact.createElement('svg', { ...props, 'data-testid': 'circular-indicator' })
  }

  return { Button, LoadingIndicator, CircularProgressIndicator }
})
