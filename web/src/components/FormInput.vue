<script setup lang="ts">
import { useId } from 'vue'

const value = defineModel<string>({ required: true })

const {
  label,
  type = 'text',
  required = false,
  error = null,
  icon = null,
  errorIcon = null,
} = defineProps<{
  label: string
  type?: 'text' | 'date'
  required?: boolean
  error?: string | null
  /** Icon shown inside the input on the right (e.g. the calendar icons). */
  icon?: string | null
  /** Icon variant used while the field is invalid. */
  errorIcon?: string | null
}>()

defineEmits<{ blur: [] }>()

const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1">
    <label :for="id" class="text-label" :class="error ? 'text-error-strong' : 'text-primary'">
      {{ label }}
      <span
        v-if="required"
        class="text-hint ml-1 font-normal"
        :class="error ? 'text-error' : 'text-muted'"
      >
        (Obrigatório)
      </span>
    </label>

    <div class="relative">
      <input
        :id="id"
        v-model="value"
        :type="type"
        :required="required"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? `${id}-error` : undefined"
        class="rounded-medium relative h-10 w-full border bg-white px-4 outline-none focus:ring-2"
        :class="[
          error
            ? 'border-error text-error focus:ring-error/20'
            : 'border-muted text-header focus:ring-primary/20',
          { 'pr-12': icon },
        ]"
        @blur="$emit('blur')"
      />
      <img
        v-if="icon"
        :src="(error && errorIcon) || icon"
        alt=""
        width="24"
        height="24"
        class="pointer-events-none absolute top-2 right-2"
      />
    </div>

    <p v-if="error" :id="`${id}-error`" class="text-hint text-error">{{ error }}</p>
  </div>
</template>
