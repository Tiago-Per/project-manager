import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import * as api from '@/api/projects'
import SearchView from '../SearchView.vue'
import type { Project } from '@/types/project'

vi.mock('@/api/projects')

const project: Project = {
  id: 1,
  name: 'Projeto 01',
  client: 'Acme',
  start_date: '2024-09-01',
  end_date: '2024-12-12',
  favorite: false,
  cover_url: null,
}

async function mountView(q: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'projects', component: { template: '<div />' } },
      { path: '/search', name: 'search', component: SearchView },
      { path: '/projects/:id/edit', name: 'project-edit', component: { template: '<div />' } },
    ],
  })
  await router.push({ name: 'search', query: { q } })
  const wrapper = mount(SearchView, { props: { q }, global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.resetAllMocks()
})

describe('SearchView', () => {
  it('searches the term from the URL and highlights it in the names', async () => {
    vi.mocked(api.listProjects).mockResolvedValue({ projects: [project], meta: { total: 1 } })

    const wrapper = await mountView('projet')

    expect(api.listProjects).toHaveBeenCalledWith({ search: 'projet', sort: 'name' })
    expect(wrapper.get('h1').text()).toBe('Resultado da busca')
    expect(wrapper.get('a').text()).toBe('Voltar')
    expect(wrapper.get('a').attributes('href')).toBe('/')
    expect(wrapper.findAll('article')).toHaveLength(1)
    expect(wrapper.get('article h2 mark').text()).toBe('Projet')
    expect(wrapper.find('[role="switch"]').exists()).toBe(false)
  })

  it('searches again when the term changes', async () => {
    vi.mocked(api.listProjects).mockResolvedValue({ projects: [project], meta: { total: 1 } })
    const wrapper = await mountView('Proj')

    await wrapper.setProps({ q: 'Projeto' })
    await flushPromises()

    expect(api.listProjects).toHaveBeenLastCalledWith({ search: 'Projeto', sort: 'name' })
    expect(wrapper.get('article h2 mark').text()).toBe('Projeto')
  })

  it('shows skeleton cards while searching', async () => {
    vi.mocked(api.listProjects).mockReturnValue(new Promise(() => {}))

    const wrapper = await mountView('Projeto')

    expect(wrapper.get('[aria-label="Carregando projetos"]').attributes('aria-busy')).toBe('true')
    expect(wrapper.text()).not.toContain('Nenhum projeto encontrado')
  })

  it('shows a message when nothing matches', async () => {
    vi.mocked(api.listProjects).mockResolvedValue({ projects: [], meta: { total: 0 } })

    const wrapper = await mountView('xyz')

    expect(wrapper.find('article').exists()).toBe(false)
    expect(wrapper.text()).toContain('Nenhum projeto encontrado')
    expect(wrapper.text()).toContain('“xyz”')
  })

  it('offers a retry when the search fails', async () => {
    vi.mocked(api.listProjects)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ projects: [project], meta: { total: 1 } })
    const wrapper = await mountView('Projeto')

    expect(wrapper.text()).toContain('Não foi possível buscar os projetos')

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('article')).toHaveLength(1)
  })
})
