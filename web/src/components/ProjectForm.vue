<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import calendarCheckErrorIcon from '@/assets/icons/calendar-check-error.svg'
import calendarCheckIcon from '@/assets/icons/calendar-check.svg'
import calendarDayErrorIcon from '@/assets/icons/calendar-day-error.svg'
import calendarDayIcon from '@/assets/icons/calendar-day.svg'
import AppButton from '@/components/AppButton.vue'
import CoverUpload from '@/components/CoverUpload.vue'
import FormInput from '@/components/FormInput.vue'
import type { Project, ProjectInput } from '@/types/project'
import {
  validateProject,
  type ProjectFormErrors,
  type ProjectFormValues,
} from '@/utils/projectValidation'

const {
  project = null,
  submitting = false,
  serverErrors = null,
} = defineProps<{
  /** Project being edited; omit on the new project page. */
  project?: Project | null
  submitting?: boolean
  /** Errors from a 422 response, keyed by attribute. */
  serverErrors?: Record<string, string[]> | null
}>()

const emit = defineEmits<{ submit: [input: ProjectInput] }>()

type Field = keyof ProjectFormValues

const values = reactive<ProjectFormValues>({
  name: project?.name ?? '',
  client: project?.client ?? '',
  start_date: project?.start_date ?? '',
  end_date: project?.end_date ?? '',
})
const cover = ref<File | null>(null)
const removeCover = ref(false)

const touched = reactive(new Set<Field>())
const submitted = ref(false)
// Server errors are hidden once the user edits the field they belong to.
const editedSinceServerErrors = reactive(new Set<string>())

const clientErrors = computed(() => validateProject(values))
const isValid = computed(() => Object.keys(clientErrors.value).length === 0)

const errors = computed<ProjectFormErrors & { cover?: string }>(() => {
  const visible: ProjectFormErrors & { cover?: string } = {}

  for (const field of Object.keys(values) as Field[]) {
    const clientError = clientErrors.value[field]
    const serverError = editedSinceServerErrors.has(field) ? undefined : serverErrors?.[field]?.[0]

    if (clientError && (touched.has(field) || submitted.value)) visible[field] = clientError
    else if (serverError) visible[field] = serverError
  }

  if (!editedSinceServerErrors.has('cover') && serverErrors?.cover?.[0]) {
    visible.cover = serverErrors.cover[0]
  }

  return visible
})

function update(field: Field, value: string) {
  values[field] = value
  editedSinceServerErrors.add(field)
}

function updateCover(file: File | null) {
  cover.value = file
  editedSinceServerErrors.add('cover')
}

function onSubmit() {
  submitted.value = true
  if (!isValid.value || submitting) return

  editedSinceServerErrors.clear()

  const input: ProjectInput = {
    name: values.name.trim(),
    client: values.client.trim(),
    start_date: values.start_date,
    end_date: values.end_date,
  }
  if (cover.value) input.cover = cover.value
  else if (removeCover.value) input.remove_cover = true

  emit('submit', input)
}
</script>

<template>
  <form class="mx-auto flex w-full max-w-176 flex-col gap-8" novalidate @submit.prevent="onSubmit">
    <FormInput
      :model-value="values.name"
      label="Nome do projeto"
      required
      :error="errors.name"
      @update:model-value="update('name', $event)"
      @blur="touched.add('name')"
    />

    <FormInput
      :model-value="values.client"
      label="Cliente"
      required
      :error="errors.client"
      @update:model-value="update('client', $event)"
      @blur="touched.add('client')"
    />

    <div class="grid gap-8 sm:grid-cols-2 sm:gap-10">
      <FormInput
        :model-value="values.start_date"
        type="date"
        label="Data de Início"
        required
        :icon="calendarDayIcon"
        :error-icon="calendarDayErrorIcon"
        :error="errors.start_date"
        @update:model-value="update('start_date', $event)"
        @blur="touched.add('start_date')"
      />
      <FormInput
        :model-value="values.end_date"
        type="date"
        label="Data Final"
        required
        :icon="calendarCheckIcon"
        :error-icon="calendarCheckErrorIcon"
        :error="errors.end_date"
        @update:model-value="update('end_date', $event)"
        @blur="touched.add('end_date')"
      />
    </div>

    <CoverUpload
      :file="cover"
      v-model:remove="removeCover"
      :existing-url="project?.cover_url"
      :error="errors.cover"
      @update:file="updateCover"
    />

    <AppButton type="submit" size="lg" class="w-full" :disabled="!isValid" :loading="submitting">
      {{ submitting ? 'Salvando...' : 'Salvar projeto' }}
    </AppButton>
  </form>
</template>
