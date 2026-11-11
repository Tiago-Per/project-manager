import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'

import SortSelect from '../SortSelect.vue'
import type { ProjectSort } from '@/types/project'

let wrapper: VueWrapper

function mountSelect(modelValue: ProjectSort = 'name') {
  wrapper = mount(SortSelect, {
    props: {
      modelValue,
      'onUpdate:modelValue': (value: ProjectSort) => wrapper.setProps({ modelValue: value }),
    },
    attachTo: document.body,
  })
  return wrapper
}

const listbox = () => wrapper.get('[role="listbox"]')
const trigger = () => wrapper.get('[role="combobox"]')

afterEach(() => wrapper.unmount())

describe('SortSelect', () => {
  it('shows the label of the current value', () => {
    mountSelect('deadline')

    expect(trigger().text()).toBe('Prazo mais próximo')
    expect(trigger().attributes('aria-expanded')).toBe('false')
    expect(listbox().isVisible()).toBe(false)
  })

  it('opens on click and emits the chosen option', async () => {
    mountSelect()

    await trigger().trigger('click')
    expect(listbox().isVisible()).toBe(true)

    await wrapper.get('[role="option"]:nth-child(2)').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['recent']])
    expect(listbox().isVisible()).toBe(false)
  })

  it('selects with the keyboard', async () => {
    mountSelect()

    await trigger().trigger('keydown', { key: 'ArrowDown' })
    expect(listbox().isVisible()).toBe(true)

    await trigger().trigger('keydown', { key: 'ArrowDown' })
    await trigger().trigger('keydown', { key: 'ArrowDown' })
    expect(trigger().attributes('aria-activedescendant')).toBe(
      wrapper.findAll('[role="option"]')[2]?.attributes('id'),
    )

    await trigger().trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update:modelValue')).toEqual([['deadline']])
    expect(listbox().isVisible()).toBe(false)
    expect(document.activeElement).toBe(trigger().element)
  })

  it('closes on Escape without changing the value', async () => {
    mountSelect()

    await trigger().trigger('click')
    await trigger().trigger('keydown', { key: 'ArrowDown' })
    await trigger().trigger('keydown', { key: 'Escape' })

    expect(listbox().isVisible()).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('closes on outside click', async () => {
    mountSelect()

    await trigger().trigger('click')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(listbox().isVisible()).toBe(false)
  })
})
