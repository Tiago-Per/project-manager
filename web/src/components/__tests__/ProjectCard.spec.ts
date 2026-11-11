import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import ProjectCard from '../ProjectCard.vue'
import type { Project } from '@/types/project'

const project: Project = {
  id: 1,
  name: 'Site institucional',
  client: 'Acme',
  start_date: '2024-09-01',
  end_date: '2024-12-12',
  favorite: false,
  cover_url: null,
}

function mountCard(overrides: Partial<Project> = {}) {
  return mount(ProjectCard, { props: { project: { ...project, ...overrides } } })
}

describe('ProjectCard', () => {
  it('renders the name, client and formatted dates', () => {
    const wrapper = mountCard()

    expect(wrapper.get('h2').text()).toBe('Site institucional')
    expect(wrapper.text()).toContain('Cliente: Acme')
    expect(wrapper.text()).toContain('01 de setembro de 2024')
    expect(wrapper.text()).toContain('12 de dezembro de 2024')
  })

  it('shows the cover image when there is one', () => {
    const wrapper = mountCard({ cover_url: 'http://localhost:3000/cover.png' })

    expect(wrapper.get('[data-test="cover"]').attributes('src')).toBe(
      'http://localhost:3000/cover.png',
    )
  })

  it('shows the placeholder when there is no cover', () => {
    const wrapper = mountCard()

    expect(wrapper.get('[data-test="cover"]').attributes('src')).toContain('cover-placeholder')
  })

  it('labels the star button by favorite state', () => {
    const notFavorite = mountCard().get('[aria-pressed]')
    expect(notFavorite.attributes('aria-label')).toBe('Favoritar Site institucional')
    expect(notFavorite.attributes('aria-pressed')).toBe('false')

    const favorite = mountCard({ favorite: true }).get('[aria-pressed]')
    expect(favorite.attributes('aria-label')).toBe('Desfavoritar Site institucional')
    expect(favorite.attributes('aria-pressed')).toBe('true')
  })

  it('emits toggle-favorite with the project when the star is clicked', async () => {
    const wrapper = mountCard()

    await wrapper.get('[aria-label="Favoritar Site institucional"]').trigger('click')

    expect(wrapper.emitted('toggle-favorite')).toEqual([[project]])
  })
})
