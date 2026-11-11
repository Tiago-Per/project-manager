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

  it('shows the total of the favorites when filtering by them', async () => {
    const favorite = { ...project, id: 2, name: 'App mobile', favorite: true }
    vi.mocked(api.listProjects)
      .mockResolvedValueOnce({ projects: [project, favorite], meta: { total: 2 } })
      .mockResolvedValueOnce({ projects: [favorite], meta: { total: 1 } })

    const wrapper = await mountView()
    expect(wrapper.get('h1').text()).toBe('Projetos (2)')

    await wrapper.get('[role="switch"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Projetos (1)')
    expect(wrapper.findAll('article')).toHaveLength(1)
  })

  it('updates the total when a project is unfavorited while filtering by favorites', async () => {
    const favorite = { ...project, favorite: true }
    vi.mocked(api.listProjects)
      .mockResolvedValueOnce({ projects: [favorite], meta: { total: 1 } })
      .mockResolvedValueOnce({ projects: [favorite], meta: { total: 1 } })
    vi.mocked(api.unfavoriteProject).mockResolvedValue(project)

    const wrapper = await mountView()
    await wrapper.get('[role="switch"]').trigger('click')
    await flushPromises()
    await wrapper.get('[aria-label="Desfavoritar Site institucional"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Projetos (0)')
    expect(wrapper.text()).toContain('Nenhum projeto favorito')
  })

  it('shows a message when the favorites filter returns nothing', async () => {
    vi.mocked(api.listProjects)
      .mockResolvedValueOnce({ projects: [project], meta: { total: 1 } })
      .mockResolvedValueOnce({ projects: [], meta: { total: 0 } })

    const wrapper = await mountView()
    await wrapper.get('[role="switch"]').trigger('click')
    await flushPromises()

    expect(api.listProjects).toHaveBeenLastCalledWith(expect.objectContaining({ favorite: true }))
    expect(wrapper.find('h1').exists()).toBe(true)
    expect(wrapper.text()).toContain('Nenhum projeto favorito')
  })

  it('removes a project after confirming in the modal', async () => {
    const other = { ...project, id: 2, name: 'App mobile' }
    vi.mocked(api.listProjects).mockResolvedValue({
      projects: [project, other],
      meta: { total: 2 },
    })
    vi.mocked(api.deleteProject).mockResolvedValue()

    const wrapper = await mountView()
    await wrapper.get('[aria-label="Mais ações para Site institucional"]').trigger('click')
    await flushPromises()
    await wrapper.findAll('[role="menuitem"]')[1]?.trigger('click')
    await flushPromises()

    const dialog = document.body.querySelector('[role="dialog"]')
    expect(dialog?.textContent).toContain('Site institucional')

    Array.from(dialog!.querySelectorAll('button'))
      .find((b) => b.textContent?.trim() === 'Confirmar')!
      .click()
    await flushPromises()

    expect(api.deleteProject).toHaveBeenCalledWith(1)
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    expect(wrapper.findAll('article')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Projetos (1)')

    wrapper.unmount()
  })

  it('keeps the modal open with an error when removal fails', async () => {
    vi.mocked(api.listProjects).mockResolvedValue({ projects: [project], meta: { total: 1 } })
    vi.mocked(api.deleteProject).mockRejectedValue(new Error('network'))

    const wrapper = await mountView()
    await wrapper.get('[aria-label="Mais ações para Site institucional"]').trigger('click')
    await flushPromises()
    await wrapper.findAll('[role="menuitem"]')[1]?.trigger('click')
    await flushPromises()

    const confirm = Array.from(document.body.querySelectorAll('[role="dialog"] button')).find(
      (b) => b.textContent?.trim() === 'Confirmar',
    ) as HTMLButtonElement
    confirm.click()
    await flushPromises()

    expect(document.body.querySelector('[role="alert"]')?.textContent).toContain(
      'Não foi possível remover o projeto',
    )
    expect(confirm.disabled).toBe(false)
    expect(wrapper.findAll('article')).toHaveLength(1)

    wrapper.unmount()
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
