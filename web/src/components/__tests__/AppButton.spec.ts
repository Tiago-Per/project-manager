import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import AppButton from '../AppButton.vue'

describe('AppButton', () => {
  it('shows a spinner and blocks clicks while loading', async () => {
    const wrapper = mount(AppButton, { props: { loading: true }, slots: { default: 'Salvar' } })
    const button = wrapper.get('button')

    expect(button.find('[data-test="spinner"]').exists()).toBe(true)
    expect(button.element.disabled).toBe(true)
    expect(button.attributes('aria-busy')).toBe('true')

    await button.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('has no spinner when idle', () => {
    const wrapper = mount(AppButton, { slots: { default: 'Salvar' } })

    expect(wrapper.find('[data-test="spinner"]').exists()).toBe(false)
    expect(wrapper.get('button').element.disabled).toBe(false)
    expect(wrapper.get('button').attributes('aria-busy')).toBeUndefined()
  })

  it('stays disabled when disabled even without loading', () => {
    const wrapper = mount(AppButton, { props: { disabled: true } })

    expect(wrapper.get('button').element.disabled).toBe(true)
  })
})
