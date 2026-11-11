import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import AppHeader from '../AppHeader.vue'
import { SEARCH_HISTORY_KEY } from '@/composables/useSearchHistory'

const Page = { template: '<div />' }

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'projects', component: Page, meta: { showSearch: true } },
      { path: '/search', name: 'search', component: Page, meta: { searchMode: true } },
    ],
  })
}

const mounted: VueWrapper[] = []

async function mountHeader(path = '/') {
  const router = makeRouter()
  await router.push(path)
  const wrapper = mount(AppHeader, { global: { plugins: [router] }, attachTo: document.body })
  mounted.push(wrapper)
  await flushPromises()
  return { wrapper, router }
}

async function openSearch(wrapper: VueWrapper) {
  await wrapper.get('[aria-label="Buscar projetos"]').trigger('click')
  await flushPromises()
  return wrapper.get<HTMLInputElement>('input')
}

async function type(wrapper: VueWrapper, value: string) {
  await wrapper.get('input').setValue(value)
}

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  mounted.splice(0).forEach((wrapper) => wrapper.unmount())
})

describe('AppHeader search', () => {
  it('opens search mode with the input focused', async () => {
    const { wrapper } = await mountHeader()

    const input = await openSearch(wrapper)

    expect(input.attributes('placeholder')).toBe('Digite o nome do projeto...')
    expect(document.activeElement).toBe(input.element)
    expect(wrapper.find('[aria-label="Buscar projetos"]').exists()).toBe(false)
  })

  it('searches 300 ms after the user stops typing', async () => {
    const { wrapper, router } = await mountHeader()
    await openSearch(wrapper)

    await type(wrapper, 'Pro')
    await vi.advanceTimersByTimeAsync(200)
    await type(wrapper, 'Proj')
    await vi.advanceTimersByTimeAsync(299)
    expect(router.currentRoute.value.name).toBe('projects')

    await vi.advanceTimersByTimeAsync(1)
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('search')
    expect(router.currentRoute.value.query).toEqual({ q: 'Proj' })
  })

  it('does nothing with fewer than 3 characters', async () => {
    const { wrapper, router } = await mountHeader()
    await openSearch(wrapper)

    await type(wrapper, 'Pro')
    await type(wrapper, 'Pr')
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('projects')
    expect(localStorage.getItem(SEARCH_HISTORY_KEY)).toBeNull()
  })

  it('saves the searched term, replacing a partial one', async () => {
    const { wrapper } = await mountHeader()
    await openSearch(wrapper)

    await type(wrapper, 'Proj')
    await vi.advanceTimersByTimeAsync(300)
    await type(wrapper, 'Projeto')
    await vi.advanceTimersByTimeAsync(300)

    expect(JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)!)).toEqual(['Projeto'])
  })

  it('keeps the typed text while an earlier search navigates', async () => {
    const { wrapper, router } = await mountHeader()
    await openSearch(wrapper)

    await type(wrapper, 'Proj')
    await vi.advanceTimersByTimeAsync(300)
    await type(wrapper, 'Projeto')
    await flushPromises()

    expect(router.currentRoute.value.query.q).toBe('Proj')
    expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('Projeto')
  })

  it('shows the current term in search mode on the results page', async () => {
    const { wrapper } = await mountHeader('/search?q=Projeto')

    expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('Projeto')
  })

  it('shows the history when the input is focused and empty', async () => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(['Projeto', 'Site']))
    const { wrapper } = await mountHeader()
    await openSearch(wrapper)

    const items = wrapper.findAll('[aria-label="Buscas recentes"] li')
    expect(items.map((item) => item.text())).toEqual(['Projeto', 'Site'])

    await type(wrapper, 'P')
    expect(wrapper.find('[aria-label="Buscas recentes"]').exists()).toBe(false)
  })

  it('runs the search when a history term is clicked', async () => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(['Projeto', 'Site']))
    const { wrapper, router } = await mountHeader()
    await openSearch(wrapper)

    const site = wrapper
      .findAll('[aria-label="Buscas recentes"] button')
      .find((b) => b.text() === 'Site')!
    await site.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ q: 'Site' })
    expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('Site')
    expect(JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)!)).toEqual(['Site', 'Projeto'])
  })

  it('removes a term from the history', async () => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(['Projeto', 'Site']))
    const { wrapper } = await mountHeader()
    await openSearch(wrapper)

    await wrapper.get('[aria-label="Remover Projeto do histórico"]').trigger('click')

    expect(wrapper.findAll('[aria-label="Buscas recentes"] li').map((li) => li.text())).toEqual([
      'Site',
    ])
  })

  it('leaves search mode with Escape', async () => {
    const { wrapper } = await mountHeader()
    await openSearch(wrapper)

    await wrapper.get('input').trigger('keydown', { key: 'Escape' })
    await flushPromises()

    expect(wrapper.find('input').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get('[aria-label="Buscar projetos"]').element)
  })

  it('goes back to the list with Escape on the results page', async () => {
    const { wrapper, router } = await mountHeader('/search?q=Projeto')

    await wrapper.get('input').trigger('keydown', { key: 'Escape' })
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('projects')
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('cancels a pending search when leaving search mode', async () => {
    const { wrapper, router } = await mountHeader()
    await openSearch(wrapper)

    await type(wrapper, 'Projeto')
    await wrapper.get('input').trigger('keydown', { key: 'Escape' })
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('projects')
  })
})
