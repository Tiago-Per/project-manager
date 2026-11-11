import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'

import ProjectForm from '../ProjectForm.vue'
import type { Project, ProjectInput } from '@/types/project'

const project: Project = {
  id: 1,
  name: 'Site institucional',
  client: 'Acme',
  start_date: '2024-09-01',
  end_date: '2024-12-12',
  favorite: false,
  cover_url: 'http://localhost:3000/cover.png',
}

beforeAll(() => {
  // jsdom does not implement object URLs, used for the cover preview.
  URL.createObjectURL = vi.fn<typeof URL.createObjectURL>(() => 'blob:preview')
  URL.revokeObjectURL = vi.fn<typeof URL.revokeObjectURL>()
})

afterAll(() => vi.restoreAllMocks())

function field(wrapper: VueWrapper, label: string) {
  const labelElement = wrapper.findAll('label').find((l) => l.text().startsWith(label))
  if (!labelElement) throw new Error(`No field labelled ${label}`)
  return wrapper.get<HTMLInputElement>(`#${CSS.escape(labelElement.attributes('for')!)}`)
}

function saveButton(wrapper: VueWrapper) {
  return wrapper.get<HTMLButtonElement>('button[type="submit"]')
}

async function fillValid(wrapper: VueWrapper) {
  await field(wrapper, 'Nome do projeto').setValue('Site institucional')
  await field(wrapper, 'Cliente').setValue('Acme')
  await field(wrapper, 'Data de Início').setValue('2024-09-01')
  await field(wrapper, 'Data Final').setValue('2024-12-12')
}

function chooseFile(wrapper: VueWrapper, file: File) {
  const input = wrapper.get<HTMLInputElement>('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  return input.trigger('change')
}

describe('ProjectForm', () => {
  it('renders the required fields and the cover upload', () => {
    const wrapper = mount(ProjectForm)

    expect(wrapper.findAll('label').map((l) => l.text().replace(/\s+/g, ' '))).toEqual([
      'Nome do projeto (Obrigatório)',
      'Cliente (Obrigatório)',
      'Data de Início (Obrigatório)',
      'Data Final (Obrigatório)',
    ])
    expect(wrapper.text()).toContain('Escolha uma imagem .jpg ou .png no seu dispositivo')
    expect(wrapper.get('input[type="file"]').attributes('accept')).toContain('.jpeg')
  })

  it('does not show errors before the user leaves a field', async () => {
    const wrapper = mount(ProjectForm)

    await field(wrapper, 'Nome do projeto').setValue('Iridium')

    expect(wrapper.text()).not.toContain('Por favor')
  })

  it('shows the design messages after blur', async () => {
    const wrapper = mount(ProjectForm)

    await field(wrapper, 'Nome do projeto').setValue('Iridium')
    await field(wrapper, 'Nome do projeto').trigger('blur')
    await field(wrapper, 'Cliente').trigger('blur')
    await field(wrapper, 'Data de Início').trigger('blur')

    const name = field(wrapper, 'Nome do projeto')
    expect(name.attributes('aria-invalid')).toBe('true')
    expect(wrapper.get(`#${CSS.escape(name.attributes('aria-describedby')!)}`).text()).toBe(
      'Por favor, digite ao menos duas palavras',
    )
    expect(wrapper.text()).toContain('Por favor, digite ao menos uma palavra')
    expect(wrapper.text()).toContain('Selecione uma data válida')
  })

  it('rejects an end date before the start date', async () => {
    const wrapper = mount(ProjectForm)

    await fillValid(wrapper)
    await field(wrapper, 'Data Final').setValue('2024-08-31')
    await field(wrapper, 'Data Final').trigger('blur')

    expect(field(wrapper, 'Data Final').attributes('aria-invalid')).toBe('true')
    expect(field(wrapper, 'Data de Início').attributes('aria-invalid')).toBeUndefined()
    expect(saveButton(wrapper).element.disabled).toBe(true)
  })

  it('keeps "Salvar projeto" disabled while the form is invalid or submitting', async () => {
    const wrapper = mount(ProjectForm)
    expect(saveButton(wrapper).element.disabled).toBe(true)

    await fillValid(wrapper)
    expect(saveButton(wrapper).element.disabled).toBe(false)

    await wrapper.setProps({ submitting: true })
    expect(saveButton(wrapper).element.disabled).toBe(true)
  })

  it('emits the trimmed values and the chosen cover on submit', async () => {
    const wrapper = mount(ProjectForm)
    const cover = new File(['image'], 'cover.png', { type: 'image/png' })

    await fillValid(wrapper)
    await field(wrapper, 'Nome do projeto').setValue('  Site institucional  ')
    await chooseFile(wrapper, cover)
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted<[ProjectInput]>('submit')).toEqual([
      [
        {
          name: 'Site institucional',
          client: 'Acme',
          start_date: '2024-09-01',
          end_date: '2024-12-12',
          cover,
        },
      ],
    ])
  })

  it('rejects files that are not .jpg or .png', async () => {
    const wrapper = mount(ProjectForm)

    await chooseFile(wrapper, new File(['gif'], 'cover.gif', { type: 'image/gif' }))

    expect(wrapper.get('[role="alert"]').text()).toBe('Selecione uma imagem .jpg ou .png')
    expect(wrapper.find('img[alt="Pré-visualização da capa"]').exists()).toBe(false)
  })

  it('fills the fields and shows the cover when editing', () => {
    const wrapper = mount(ProjectForm, { props: { project } })

    expect(field(wrapper, 'Nome do projeto').element.value).toBe('Site institucional')
    expect(field(wrapper, 'Data Final').element.value).toBe('2024-12-12')
    expect(wrapper.get('img[alt="Pré-visualização da capa"]').attributes('src')).toBe(
      project.cover_url,
    )
    expect(saveButton(wrapper).element.disabled).toBe(false)
  })

  it('sends remove_cover when the existing cover is removed', async () => {
    const wrapper = mount(ProjectForm, { props: { project } })

    await wrapper.get('[aria-label="Remover capa"]').trigger('click')
    expect(wrapper.find('img[alt="Pré-visualização da capa"]').exists()).toBe(false)

    await wrapper.get('form').trigger('submit')

    const [input] = wrapper.emitted<[ProjectInput]>('submit')![0]!
    expect(input.remove_cover).toBe(true)
    expect(input.cover).toBeUndefined()
  })

  it('replaces the existing cover without remove_cover', async () => {
    const wrapper = mount(ProjectForm, { props: { project } })
    const cover = new File(['image'], 'new.jpg', { type: 'image/jpeg' })

    await wrapper.get('[aria-label="Remover capa"]').trigger('click')
    await chooseFile(wrapper, cover)
    await wrapper.get('form').trigger('submit')

    const [input] = wrapper.emitted<[ProjectInput]>('submit')![0]!
    expect(input.cover).toBe(cover)
    expect(input.remove_cover).toBeUndefined()
  })

  it('shows server errors on the matching fields until the field is edited', async () => {
    const wrapper = mount(ProjectForm, {
      props: {
        project,
        serverErrors: { name: ['has already been taken'], cover: ['must be a JPG or PNG image'] },
      },
    })

    expect(wrapper.text()).toContain('has already been taken')
    expect(wrapper.text()).toContain('must be a JPG or PNG image')

    await field(wrapper, 'Nome do projeto').setValue('Outro nome aqui')

    expect(wrapper.text()).not.toContain('has already been taken')
  })
})
