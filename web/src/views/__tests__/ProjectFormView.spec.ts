import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import * as api from '@/api/projects'
import ProjectFormView from '../ProjectFormView.vue'
import type { Project } from '@/types/project'

vi.mock('@/api/projects', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/projects')>()
  return {
    ApiError: actual.ApiError,
    getProject: vi.fn<typeof actual.getProject>(),
    createProject: vi.fn<typeof actual.createProject>(),
    updateProject: vi.fn<typeof actual.updateProject>(),
  }
})

const project: Project = {
  id: 7,
  name: 'Site institucional',
  client: 'Acme',
  start_date: '2024-09-01',
  end_date: '2024-12-12',
  favorite: false,
  cover_url: null,
}

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'projects', component: { template: '<div />' } },
      { path: '/projects/new', name: 'project-new', component: ProjectFormView },
      {
        path: '/projects/:id/edit',
        name: 'project-edit',
        component: ProjectFormView,
        props: (route) => ({ id: Number(route.params.id) }),
      },
    ],
  })
}

async function mountView(props: { id?: number } = {}) {
  const router = makeRouter()
  await router.push(props.id ? `/projects/${props.id}/edit` : '/projects/new')
  const wrapper = mount(ProjectFormView, { props, global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

async function fill(wrapper: Awaited<ReturnType<typeof mountView>>['wrapper']) {
  const inputs = wrapper.findAll('input:not([type="file"])')
  await inputs[0]!.setValue('Site institucional')
  await inputs[1]!.setValue('Acme')
  await inputs[2]!.setValue('2024-09-01')
  await inputs[3]!.setValue('2024-12-12')
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.resetAllMocks()
})

describe('ProjectFormView', () => {
  it('creates a project and goes back to the list', async () => {
    vi.mocked(api.createProject).mockResolvedValue(project)
    const { wrapper, router } = await mountView()

    expect(wrapper.get('h1').text()).toBe('Novo projeto')

    await fill(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(api.createProject).toHaveBeenCalledWith({
      name: 'Site institucional',
      client: 'Acme',
      start_date: '2024-09-01',
      end_date: '2024-12-12',
    })
    expect(router.currentRoute.value.name).toBe('projects')
  })

  it('shows 422 errors on the fields and stays on the page', async () => {
    vi.mocked(api.createProject).mockRejectedValue(
      new api.ApiError(422, { errors: { end_date: ["can't be before start date"] } }),
    )
    const { wrapper, router } = await mountView()

    await fill(wrapper)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain("can't be before start date")
    expect(router.currentRoute.value.name).toBe('project-new')
  })

  it('loads the project and updates it', async () => {
    vi.mocked(api.getProject).mockResolvedValue(project)
    vi.mocked(api.updateProject).mockResolvedValue(project)
    const { wrapper, router } = await mountView({ id: 7 })

    expect(api.getProject).toHaveBeenCalledWith(7)
    expect(wrapper.get('h1').text()).toBe('Editar projeto')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Site institucional')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(api.updateProject).toHaveBeenCalledWith(7, expect.objectContaining({ client: 'Acme' }))
    expect(router.currentRoute.value.name).toBe('projects')
  })

  it('shows a loader while the project loads', async () => {
    vi.mocked(api.getProject).mockReturnValue(new Promise(() => {}))
    const { wrapper } = await mountView({ id: 7 })

    expect(wrapper.get('[role="status"]').text()).toBe('Carregando projeto...')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('shows "Salvando..." on the button while saving', async () => {
    let resolve!: (value: Project) => void
    vi.mocked(api.createProject).mockReturnValue(new Promise((r) => (resolve = r)))
    const { wrapper } = await mountView()

    await fill(wrapper)
    await wrapper.get('form').trigger('submit')

    const button = wrapper.get<HTMLButtonElement>('button[type="submit"]')
    expect(button.text()).toBe('Salvando...')
    expect(button.element.disabled).toBe(true)
    expect(button.attributes('aria-busy')).toBe('true')

    resolve(project)
    await flushPromises()
  })

  it('shows a message when the project does not exist', async () => {
    vi.mocked(api.getProject).mockRejectedValue(
      new api.ApiError(404, { error: 'Project not found' }),
    )
    const { wrapper } = await mountView({ id: 99 })

    expect(wrapper.text()).toContain('Projeto não encontrado')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('links back to the list', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.get('a').attributes('href')).toBe('/')
    expect(wrapper.get('a').text()).toBe('Voltar')
  })
})
