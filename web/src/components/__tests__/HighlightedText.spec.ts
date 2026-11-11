import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import HighlightedText from '../HighlightedText.vue'

function render(text: string, query?: string) {
  // A wrapper element, since the component renders only text and <mark> nodes.
  return mount(
    {
      components: { HighlightedText },
      props: ['text', 'query'],
      template: '<h2><HighlightedText :text="text" :query="query" /></h2>',
    },
    { props: { text, query } },
  )
}

describe('HighlightedText', () => {
  it('wraps the matching part in <mark>, ignoring case', () => {
    const wrapper = render('Projeto 01', 'projet')

    expect(wrapper.html()).toContain('<mark class="bg-favorite text-white">Projet</mark>o 01')
    expect(wrapper.text()).toBe('Projeto 01')
  })

  it('highlights every occurrence', () => {
    const wrapper = render('Ana e Mariana', 'ana')

    expect(wrapper.findAll('mark').map((mark) => mark.text())).toEqual(['Ana', 'ana'])
    expect(wrapper.text()).toBe('Ana e Mariana')
  })

  it('renders the plain text without a query or a match', () => {
    expect(render('Projeto 01').find('mark').exists()).toBe(false)
    expect(render('Projeto 01', 'xyz').text()).toBe('Projeto 01')
  })

  it('treats regex characters in the query literally', () => {
    const wrapper = render('Site (v2) + app', '(v2) +')

    expect(wrapper.get('mark').text()).toBe('(v2) +')
  })

  it('escapes HTML in the name instead of rendering it', () => {
    const name = '<img src=x onerror="alert(1)"> Projeto'
    const wrapper = render(name, 'img')

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe(name)
    expect(wrapper.get('mark').text()).toBe('img')
    expect(wrapper.html()).toContain('&lt;<mark')
  })
})
