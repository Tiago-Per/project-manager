<script setup lang="ts">
import { nextTick, onBeforeUnmount, useId, useTemplateRef, watch } from 'vue'

import trashCircleIcon from '@/assets/icons/trash-circle.svg'
import AppButton from '@/components/AppButton.vue'

const {
  open,
  title,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  error = null,
} = defineProps<{
  open: boolean
  title: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const id = useId()
const dialog = useTemplateRef<HTMLElement>('dialog')
let previouslyFocused: HTMLElement | null = null

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusables(): HTMLElement[] {
  return Array.from(dialog.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
}

function requestCancel() {
  if (!loading) emit('cancel')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    requestCancel()
    return
  }

  if (event.key !== 'Tab') return

  const elements = focusables()
  const first = elements[0]
  const last = elements[elements.length - 1]
  if (!first || !last) return

  const active = document.activeElement
  if (event.shiftKey && (active === first || active === dialog.value)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

function setScrollLock(locked: boolean) {
  document.body.style.overflow = locked ? 'hidden' : ''
}

watch(
  () => open,
  async (isOpen) => {
    if (isOpen) {
      previouslyFocused = document.activeElement as HTMLElement | null
      setScrollLock(true)
      await nextTick()
      dialog.value?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    } else {
      setScrollLock(false)
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
      previouslyFocused = null
    }
  },
  { immediate: true },
)

// Disabling the focused "Confirmar" button drops focus to <body>; keep it inside the dialog.
watch(
  () => loading,
  async () => {
    await nextTick()
    if (open && dialog.value && !dialog.value.contains(document.activeElement)) {
      dialog.value.focus()
    }
  },
)

onBeforeUnmount(() => setScrollLock(false))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="bg-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      data-test="backdrop"
      @click.self="requestCancel"
    >
      <div
        ref="dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`${id}-title`"
        :aria-describedby="`${id}-description`"
        tabindex="-1"
        class="rounded-medium shadow-raised relative w-full max-w-146 bg-white px-8 pt-12 pb-8 text-center outline-none"
        @keydown="onKeydown"
      >
        <img
          :src="trashCircleIcon"
          alt=""
          width="72"
          height="72"
          class="absolute -top-8 left-1/2 -translate-x-1/2"
        />

        <h2 :id="`${id}-title`" class="text-modal-title text-title">{{ title }}</h2>

        <hr class="border-separator my-6" />

        <div :id="`${id}-description`">
          <slot />
        </div>

        <p v-if="error" role="alert" class="text-error mt-4">{{ error }}</p>

        <div class="mt-8 flex flex-col-reverse gap-4 sm:flex-row sm:gap-8">
          <AppButton
            variant="outline"
            size="lg"
            class="flex-1"
            data-autofocus
            @click="requestCancel"
          >
            {{ cancelLabel }}
          </AppButton>
          <AppButton size="lg" class="flex-1" :loading="loading" @click="emit('confirm')">
            {{ confirmLabel }}
          </AppButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
