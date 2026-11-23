import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Button } from 'm3-expressive-react'

/** Визуальные варианты кнопки, согласованные с m3-expressive-react. */
export type AppButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated'

/** Размеры кнопки по шкале Material 3 Expressive. */
export type AppButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export interface AppButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'onChange'> {
  variant?: AppButtonVariant
  size?: AppButtonSize
  startIcon?: ReactNode
  endIcon?: ReactNode
  /** Растянуть кнопку на доступную ширину контейнера. */
  fullWidth?: boolean
}

/**
 * Единая кнопка приложения. Полностью проксирует `Button` из
 * `m3-expressive-react`, чтобы основной проект не зависел от его API напрямую.
 */
export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(function AppButton(
  { variant = 'filled', size = 'sm', fullWidth = false, startIcon, endIcon, style, className, children, ...rest },
  ref,
) {
  return (
    <Button
      {...rest}
      ref={ref}
      variant={variant}
      size={size}
      startIcon={startIcon}
      endIcon={endIcon}
      className={className}
      style={fullWidth ? { width: '100%', ...style } : style}
    >
      {children}
    </Button>
  )
})
