import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import CardMenu from '../CardMenu.vue'

let wrapper: VueWrapper

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/projects/:id/edit', name: 'project-edit', component: { template: '<div />' } },
  ],
})

function mountMenu(open = false) {
  wrapper = mount(CardMenu, {
    props: {
      open,
      'onUpdate:open': (value: boolean) => wrapper.setProps({ open: value }),
      label: 'Mais ações para Projeto 01',
      editTo: { name: 'project-edit', params: { id: 1 } },
    },
    global: { plugins: [router] },
    attachTo: document.body,
  })
  return wrapper
}

const trigger = () => wrapper.get('[aria-haspopup="menu"]')
const menu = () => wrapper.find('[role="menu"]')
const items = () => wrapper.findAll('[role="menuitem"]')

afterEach(() => wrapper.unmount())

describe('CardMenu', () => {
  it('is closed by default', () => {
    mountMenu()

    expect(trigger().attributes('aria-label')).toBe('Mais ações para Projeto 01')
    expect(trigger().attributes('aria-expanded')).toBe('false')
    expect(menu().exists()).toBe(false)
  })

  it('opens on click and focuses the first option', async () => {
    mountMenu()

    await trigger().trigger('click')
    await flushPromises()

    expect(wrapper.emitted('update:open')).toEqual([[true]])
    expect(trigger().attributes('aria-expanded')).toBe('true')
    expect(items().map((item) => item.text())).toEqual(['Editar', 'Remover'])
    expect(document.activeElement).toBe(items()[0]?.element)
  })

  it('links "Editar" to the edit page and closes after choosing it', async () => {
    mountMenu(true)
    await flushPromises()

    const editLink = items()[0]!
    expect(editLink.attributes('href')).toBe('/projects/1/edit')

    await editLink.trigger('click')

    expect(menu().exists()).toBe(false)
  })

  it('emits remove, closes and returns focus to the trigger', async () => {
    mountMenu(true)
    await flushPromises()

    await items()[1]?.trigger('click')

    expect(wrapper.emitted('remove')).toHaveLength(1)
    expect(menu().exists()).toBe(false)
    expect(document.activeElement).toBe(trigger().element)
  })

  it('moves between options with the arrow keys', async () => {
    mountMenu(true)
    await flushPromises()

    await menu().trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(items()[1]?.element)

    await menu().trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(items()[0]?.element)

    await menu().trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement).toBe(items()[1]?.element)
  })

  it('closes on Escape and focuses the trigger', async () => {
    mountMenu(true)
    await flushPromises()

    await menu().trigger('keydown', { key: 'Escape' })

    expect(menu().exists()).toBe(false)
    expect(document.activeElement).toBe(trigger().element)
  })

  it('closes on outside click', async () => {
    mountMenu(true)
    await flushPromises()

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flushPromises()

    expect(menu().exists()).toBe(false)
  })
})
