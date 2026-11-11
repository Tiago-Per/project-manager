<script setup lang="ts">
import { computed, ref, useId, useTemplateRef } from 'vue'

import chevronDownIcon from '@/assets/icons/chevron-down.svg'
import { useClickOutside } from '@/composables/useClickOutside'
import type { ProjectSort } from '@/types/project'

const sort = defineModel<ProjectSort>({ required: true })

const options: { value: ProjectSort; label: string }[] = [
  { value: 'name', label: 'Ordem alfabética' },
  { value: 'recent', label: 'Iniciados mais recentes' },
  { value: 'deadline', label: 'Prazo mais próximo' },
]

const id = useId()
const root = useTemplateRef<HTMLElement>('root')
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const isOpen = ref(false)
const activeIndex = ref(0)

const selectedIndex = computed(() =>
  Math.max(
    options.findIndex((option) => option.value === sort.value),
    0,
  ),
)
const selectedLabel = computed(() => options[selectedIndex.value]?.label)

function optionId(index: number) {
  return `${id}-option-${index}`
}

function open() {
  activeIndex.value = selectedIndex.value
  isOpen.value = true
}

function close({ focus = false } = {}) {
  isOpen.value = false
  if (focus) trigger.value?.focus()
}

function select(index: number) {
  const option = options[index]
  if (option) sort.value = option.value
  close({ focus: true })
}

function toggle() {
  if (isOpen.value) close()
  else open()
}

function move(step: number) {
  if (!isOpen.value) return open()
  activeIndex.value = Math.min(Math.max(activeIndex.value + step, 0), options.length - 1)
}

function onKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      move(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      move(-1)
      break
    case 'Home':
    case 'End':
      if (!isOpen.value) return
      event.preventDefault()
      activeIndex.value = event.key === 'Home' ? 0 : options.length - 1
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (isOpen.value) select(activeIndex.value)
      else open()
      break
    case 'Escape':
      if (!isOpen.value) return
      event.preventDefault()
      close({ focus: true })
      break
    case 'Tab':
      close()
      break
  }
}

useClickOutside(root, () => {
  if (isOpen.value) close()
})
</script>

<template>
  <div ref="root" class="relative w-74">
    <button
      ref="trigger"
      type="button"
      role="combobox"
      aria-label="Ordenar projetos"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-controls="`${id}-listbox`"
      :aria-activedescendant="isOpen ? optionId(activeIndex) : undefined"
      class="text-header flex h-10 w-full items-center justify-between border bg-white pr-2 pl-3 text-left"
      :class="isOpen ? 'border-primary rounded-t-medium' : 'border-muted rounded-medium'"
      @click="toggle"
      @keydown="onKeydown"
    >
      {{ selectedLabel }}
      <img
        :src="chevronDownIcon"
        alt=""
        width="16"
        height="16"
        class="m-2 transition-transform"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <ul
      v-show="isOpen"
      :id="`${id}-listbox`"
      role="listbox"
      aria-label="Ordenar projetos"
      class="border-primary rounded-b-card shadow-raised absolute inset-x-0 top-full z-20 border border-t-0 bg-white px-1 py-2"
      @pointerdown.prevent
    >
      <li
        v-for="(option, index) in options"
        :id="optionId(index)"
        :key="option.value"
        role="option"
        :aria-selected="option.value === sort"
        class="text-header border-divider cursor-pointer border-b px-2 py-4 leading-4 last:border-b-0"
        :class="{ 'bg-page': index === activeIndex }"
        @click="select(index)"
        @mouseenter="activeIndex = index"
      >
        {{ option.label }}
      </li>
    </ul>
  </div>
</template>
