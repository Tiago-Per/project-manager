<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, useTemplateRef, watch } from 'vue'

import trashSmallCircleIcon from '@/assets/icons/trash-small-circle.svg'
import uploadIcon from '@/assets/icons/upload.svg'
import AppButton from '@/components/AppButton.vue'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png']

/** New file chosen by the user. */
const file = defineModel<File | null>('file', { default: null })
/** True when the existing cover should be removed on save. */
const remove = defineModel<boolean>('remove', { default: false })

const { existingUrl = null, error = null } = defineProps<{
  /** Cover already saved on the project (edit page). */
  existingUrl?: string | null
  error?: string | null
}>()

const id = useId()
const input = useTemplateRef<HTMLInputElement>('input')
const typeError = ref<string | null>(null)
const objectUrl = ref<string | null>(null)

watch(
  file,
  (newFile) => {
    if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = newFile ? URL.createObjectURL(newFile) : null
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
})

const previewUrl = computed(() => objectUrl.value ?? (remove.value ? null : existingUrl))
const message = computed(() => typeError.value ?? error)

function choose(event: Event) {
  const target = event.target as HTMLInputElement
  const chosen = target.files?.[0]
  target.value = ''
  if (!chosen) return

  if (!ACCEPTED_TYPES.includes(chosen.type)) {
    typeError.value = 'Selecione uma imagem .jpg ou .png'
    return
  }

  typeError.value = null
  file.value = chosen
  remove.value = false
}

function clear() {
  file.value = null
  if (existingUrl) remove.value = true
  typeError.value = null
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <span :id="`${id}-label`" class="text-label text-primary">Capa do projeto</span>

    <div v-if="previewUrl" class="relative aspect-video">
      <img
        :src="previewUrl"
        alt="Pré-visualização da capa"
        class="rounded-medium absolute inset-0 size-full object-cover"
      />
      <button
        type="button"
        aria-label="Remover capa"
        class="absolute top-5 right-5 flex size-10 items-center justify-center rounded-full"
        @click="clear"
      >
        <img :src="trashSmallCircleIcon" alt="" width="40" height="40" />
      </button>
    </div>

    <div
      v-else
      role="group"
      :aria-labelledby="`${id}-label`"
      class="flex flex-col items-center gap-4 rounded-sm border border-dashed px-6 py-6 text-center"
      :class="message ? 'border-error' : 'border-muted'"
    >
      <img :src="uploadIcon" alt="" width="24" height="24" />
      <p class="text-muted leading-5.5">Escolha uma imagem .jpg ou .png no seu dispositivo</p>
      <AppButton variant="outline" class="w-36" @click="input?.click()">Selecionar</AppButton>
      <input
        :id="`${id}-input`"
        ref="input"
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        class="sr-only"
        tabindex="-1"
        :aria-labelledby="`${id}-label`"
        @change="choose"
      />
    </div>

    <p v-if="message" role="alert" class="text-hint text-error">{{ message }}</p>
  </div>
</template>
