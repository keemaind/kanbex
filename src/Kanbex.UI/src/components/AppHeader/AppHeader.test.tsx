import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import { KanbexLogo } from '../KanbexLogo/index.js'
import { AppHeader } from './AppHeader.js'

describe('AppHeader', () => {
  it('renders the minimal header without optional blocks', () => {
    const { container } = render(<AppHeader title="Kanbex" />)

    expect(screen.getByText('Kanbex')).toBeInTheDocument()
    expect(container.querySelector('nav')).toBeNull()
    expect(container.querySelector('.kb-header__actions')).toBeNull()
  })

  it('renders logo, subtitle, active navigation and actions', () => {
    const onProjectsClick = jest.fn()
    const onAccountClick = jest.fn()

    render(
      <AppHeader
        subtitle="Тренажёр Kanban-потока"
        logo={<KanbexLogo height={28} />}
        nav={[
          { label: 'Проекты', href: '/boards', active: true, onClick: onProjectsClick },
          { label: 'Учётная запись', onClick: onAccountClick },
        ]}
        actions={<button type="button">Выйти</button>}
      />,
    )

    expect(screen.getByRole('img', { name: 'Kanbex' })).toBeInTheDocument()
    expect(screen.queryByText('Kanbex')).toBeNull()
    expect(screen.getByText('Тренажёр Kanban-потока')).toBeInTheDocument()

    const projectsLink = screen.getByRole('link', { name: 'Проекты' })
    expect(projectsLink).toHaveAttribute('aria-current', 'page')

    fireEvent.click(projectsLink)
    expect(onProjectsClick).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('link', { name: 'Учётная запись' }))
    expect(onAccountClick).toHaveBeenCalledTimes(1)

    expect(screen.getByRole('button', { name: 'Выйти' })).toBeInTheDocument()
  })
})
