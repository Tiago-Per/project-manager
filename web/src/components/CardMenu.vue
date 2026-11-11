<script setup lang="ts">
import { nextTick, useId, useTemplateRef, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import editIcon from '@/assets/icons/edit.svg'
import menuCaret from '@/assets/icons/menu-caret.svg'
import menuIcon from '@/assets/icons/menu.svg'
import trashIcon from '@/assets/icons/trash.svg'
import { useClickOutside } from '@/composables/useClickOutside'

const open = defineModel<boolean>('open', { default: false })

defineProps<{
  /** Accessible name of the trigger, e.g. "Mais ações para Projeto 01". */
  label: string
  editTo: RouteLocationRaw
}>()

const emit = defineEmits<{ remove: [] }>()

const id = useId()
const root = useTemplateRef<HTMLElement>('root')
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const menu = useTemplateRef<HTMLElement>('menu')

function items(): HTMLElement[] {
  return Array.from(menu.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
}

function focusItem(index: number) {
  const all = items()
  all[(index + all.length) % all.length]?.focus()
}

function close({ focus = false } = {}) {
  open.value = false
  if (focus) trigger.value?.focus()
}

function remove() {
  close({ focus: true })
  emit('remove')
}

function onMenuKeydown(event: KeyboardEvent) {
  const current = items().indexOf(document.activeElement as HTMLElement)

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      focusItem(current + 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      focusItem(current - 1)
      break
    case 'Home':
      event.preventDefault()
      focusItem(0)
      break
    case 'End':
      event.preventDefault()
      focusItem(-1)
      break
    case 'Escape':
      event.preventDefault()
      close({ focus: true })
      break
    case 'Tab':
      close()
      break
  }
}

watch(
  open,
  async (isOpen) => {
    if (!isOpen) return
    await nextTick()
    focusItem(0)
  },
  { immediate: true },
)

useClickOutside(root, () => {
  if (open.value) close()
})
</script>

<template>
  <div ref="root" class="relative">
    <button
      ref="trigger"
      type="button"
      :aria-label="label"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-controls="`${id}-menu`"
      class="flex size-10 items-center justify-center rounded-full"
      @click="open = !open"
    >
      <img :src="menuIcon" alt="" width="40" height="40" />
    </button>

    <div v-if="open" class="absolute top-full right-0 z-20 w-60 pt-2">
      <img :src="menuCaret" alt="" width="12" height="8" class="absolute top-0.5 right-3.5" />
      <ul
        :id="`${id}-menu`"
        ref="menu"
        role="menu"
        :aria-label="label"
        class="rounded-medium shadow-raised bg-white py-2"
        @keydown="onMenuKeydown"
      >
        <li role="none" class="border-page border-b">
          <RouterLink
            :to="editTo"
            role="menuitem"
            class="text-primary hover:bg-page focus:bg-page flex items-center gap-3 px-5 py-3 outline-none"
            @click="close()"
          >
            <img :src="editIcon" alt="" width="24" height="24" />
            Editar
          </RouterLink>
        </li>
        <li role="none">
          <button
            type="button"
            role="menuitem"
            class="text-primary hover:bg-page focus:bg-page flex w-full items-center gap-3 px-5 py-3 outline-none"
            @click="remove"
          >
            <img :src="trashIcon" alt="" width="24" height="24" />
            Remover
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
