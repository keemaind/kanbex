import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { AppDialog } from './AppDialog.js'

describe('AppDialog', () => {
  it('does not render anything while closed', () => {
    const { container } = render(<AppDialog open={false} title="Удалить?" onCancel={jest.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders content, confirms and cancels', () => {
    const onConfirm = jest.fn()
    const onCancel = jest.fn()

    render(
      <AppDialog
        open
        title="Удалить проект?"
        description="Действие нельзя отменить."
        confirmLabel="Удалить"
        onConfirm={onConfirm}
        onCancel={onCancel}
      >
        <span>Дополнительный текст</span>
      </AppDialog>,
    )

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('heading', { name: 'Удалить проект?' })).toBeInTheDocument()
    expect(screen.getByText('Действие нельзя отменить.')).toBeInTheDocument()
    expect(screen.getByText('Дополнительный текст')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape and on scrim click', () => {
    const onCancel = jest.fn()
    const { container } = render(<AppDialog open title="Информация" onCancel={onCancel} />)

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)

    fireEvent.mouseDown(container.querySelector('.kb-dialog__scrim') as HTMLElement)
    expect(onCancel).toHaveBeenCalledTimes(2)
  })

  it('blocks interaction while busy and can hide the cancel button', () => {
    const onCancel = jest.fn()

    render(
      <AppDialog
        open
        busy
        title="Сохранение"
        cancelLabel={null}
        onCancel={onCancel}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Отмена' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Выполняется…' })).toBeDisabled()

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('uses the default labels and does not close when the dialog content is clicked', () => {
    const onCancel = jest.fn()
    const onConfirm = jest.fn()

    render(<AppDialog open title="Подтверждение" onCancel={onCancel} onConfirm={onConfirm} />)

    fireEvent.mouseDown(screen.getByRole('dialog'))
    expect(onCancel).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Подтвердить' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
