import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import * as api from '@/api/projects'
import ProjectListView from '../ProjectListView.vue'
import type { Project } from '@/types/project'

vi.mock('@/api/projects')

const project: Project = {
  id: 1,
  name: 'Site institucional',
  client: 'Acme',
  start_date: '2024-09-01',
  end_date: '2024-12-12',
  favorite: false,
  cover_url: null,
}

async function mountView() {
  const wrapper = mount(ProjectListView, { global: { stubs: { RouterLink: RouterLinkStub } } })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.resetAllMocks()
})

describe('ProjectListView', () => {
  it('shows the toolbar with the total and the project cards', async () => {
    vi.mocked(api.listProjects).mockResolvedValue({ projects: [project], meta: { total: 9 } })

    const wrapper = await mountView()

    expect(wrapper.get('h1').text()).toBe('Projetos (9)')
    expect(wrapper.findAll('article')).toHaveLength(1)
    expect(wrapper.text()).toContain('Site institucional')
  })

  it('shows only the empty state when there are no projects', async () => {
    vi.mocked(api.listProjects).mockResolvedValue({ projects: [], meta: { total: 0 } })

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Nenhum projeto')
    expect(wrapper.find('h1').exists()).toBe(false)
    expect(wrapper.text()).toContain('Novo projeto')
  })

  it('shows a message when the favorites filter returns nothing', async () => {
    vi.mocked(api.listProjects)
      .mockResolvedValueOnce({ projects: [project], meta: { total: 1 } })
      .mockResolvedValueOnce({ projects: [], meta: { total: 1 } })

    const wrapper = await mountView()
    await wrapper.get('[role="switch"]').trigger('click')
    await flushPromises()

    expect(api.listProjects).toHaveBeenLastCalledWith(expect.objectContaining({ favorite: true }))
    expect(wrapper.find('h1').exists()).toBe(true)
    expect(wrapper.text()).toContain('Nenhum projeto favorito')
  })

  it('favorites a project through the store', async () => {
    vi.mocked(api.listProjects).mockResolvedValue({ projects: [project], meta: { total: 1 } })
    vi.mocked(api.favoriteProject).mockResolvedValue({ ...project, favorite: true })

    const wrapper = await mountView()
    await wrapper.get('[aria-label="Favoritar Site institucional"]').trigger('click')
    await flushPromises()

    expect(api.favoriteProject).toHaveBeenCalledWith(1)
    expect(wrapper.find('[aria-label="Desfavoritar Site institucional"]').exists()).toBe(true)
  })
})
