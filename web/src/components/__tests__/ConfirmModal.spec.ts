import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'

import ConfirmModal from '../ConfirmModal.vue'

let wrapper: VueWrapper

function mountModal(props: Record<string, unknown> = {}) {
  wrapper = mount(ConfirmModal, {
    props: { open: true, title: 'Remover projeto', ...props },
    slots: { default: '<p>Essa ação removerá definitivamente o projeto:</p>' },
    attachTo: document.body,
  })
  return wrapper
}

const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]')
const button = (text: string) =>
  Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent?.trim() === text)

afterEach(() => wrapper.unmount())

describe('ConfirmModal', () => {
  it('renders nothing when closed', () => {
    mountModal({ open: false })

    expect(dialog()).toBeNull()
  })

  it('renders an accessible dialog in the body', () => {
    mountModal()

    const element = dialog()!
    expect(element.parentElement?.parentElement).toBe(document.body)
    expect(element.getAttribute('aria-modal')).toBe('true')

    const title = document.getElementById(element.getAttribute('aria-labelledby')!)
    expect(title?.textContent).toBe('Remover projeto')

    const description = document.getElementById(element.getAttribute('aria-describedby')!)
    expect(description?.textContent).toContain('Essa ação removerá definitivamente o projeto:')
  })

  it('moves focus into the modal and restores it when closed', async () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()

    mountModal({ open: false })
    await wrapper.setProps({ open: true })
    await flushPromises()
    expect(document.activeElement).toBe(button('Cancelar'))

    await wrapper.setProps({ open: false })
    await flushPromises()
    expect(document.activeElement).toBe(opener)

    opener.remove()
  })

  it('emits confirm', async () => {
    mountModal()

    button('Confirmar')!.click()

    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })

  it('emits cancel from the button, Escape and the backdrop', async () => {
    mountModal()

    button('Cancelar')!.click()
    dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    document.body.querySelector<HTMLElement>('[data-test="backdrop"]')!.click()

    expect(wrapper.emitted('cancel')).toHaveLength(3)
  })

  it('does not cancel on a click inside the panel', () => {
    mountModal()

    dialog()!.click()

    expect(wrapper.emitted('cancel')).toBeUndefined()
  })

  it('disables confirm and ignores cancel while loading', () => {
    mountModal({ loading: true })

    expect(button('Confirmar')!.disabled).toBe(true)

    dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    document.body.querySelector<HTMLElement>('[data-test="backdrop"]')!.click()

    expect(wrapper.emitted('cancel')).toBeUndefined()
  })

  it('shows the error message', () => {
    mountModal({ error: 'Não foi possível remover o projeto.' })

    expect(document.body.querySelector('[role="alert"]')?.textContent).toBe(
      'Não foi possível remover o projeto.',
    )
  })
})
