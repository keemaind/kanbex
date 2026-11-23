import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { EmptyState } from './EmptyState.js'

describe('EmptyState', () => {
  it('renders icon, description and an action', () => {
    const onAction = jest.fn()

    render(
      <EmptyState
        title="Проектов пока нет"
        description="Создайте первый проект."
        icon={<span aria-hidden="true">▦</span>}
        actionLabel="Создать проект"
        onAction={onAction}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Проектов пока нет' })).toBeInTheDocument()
    expect(screen.getByText('Создайте первый проект.')).toBeInTheDocument()
    expect(screen.getByText('▦')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Создать проект' }))
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('supports a secondary action and hides the action row when it is empty', () => {
    const { rerender } = render(
      <EmptyState title="Ничего не найдено" secondaryAction={<a href="/boards">К проектам</a>} />,
    )

    expect(screen.getByRole('link', { name: 'К проектам' })).toBeInTheDocument()

    rerender(<EmptyState title="Пусто" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
