import { describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'

import ProjectGrid from '../ProjectGrid.vue'
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

function mountGrid(props: { projects: Project[]; loading?: boolean }) {
  return mount(ProjectGrid, { props, global: { stubs: { RouterLink: RouterLinkStub } } })
}

describe('ProjectGrid', () => {
  it('shows skeleton cards while loading an empty list', () => {
    const wrapper = mountGrid({ projects: [], loading: true })

    expect(wrapper.get('ul').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('ul').attributes('aria-label')).toBe('Carregando projetos')
    expect(wrapper.findAll('li').length).toBeGreaterThan(0)
    expect(wrapper.find('article').exists()).toBe(false)
  })

  it('keeps the cards visible but busy while reloading', () => {
    const wrapper = mountGrid({ projects: [project], loading: true })

    expect(wrapper.findAll('article')).toHaveLength(1)
    expect(wrapper.get('ul').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('ul').classes()).toContain('opacity-60')
  })

  it('is not busy when loaded', () => {
    const wrapper = mountGrid({ projects: [project] })

    expect(wrapper.get('ul').attributes('aria-busy')).toBeUndefined()
    expect(wrapper.get('ul').classes()).not.toContain('opacity-60')
  })
})
