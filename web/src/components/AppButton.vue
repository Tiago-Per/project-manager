<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'

import AppSpinner from '@/components/AppSpinner.vue'

const {
  variant = 'primary',
  size = 'md',
  to,
  type = 'button',
  disabled = false,
  loading = false,
} = defineProps<{
  variant?: 'primary' | 'outline'
  size?: 'md' | 'lg'
  to?: RouteLocationRaw
  type?: 'button' | 'submit'
  disabled?: boolean
  /** Shows a spinner and disables the button while an action runs. */
  loading?: boolean
}>()

const variantClasses = {
  primary: 'bg-primary disabled:bg-primary-disabled text-white enabled:hover:brightness-110',
  outline: 'border-primary text-primary enabled:hover:bg-page border bg-white',
}

const sizeClasses = {
  md: 'text-body h-10 px-6',
  lg: 'text-button-lg h-13 px-10',
}
</script>

<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to="to"
    :type="to ? undefined : type"
    :disabled="disabled || loading || undefined"
    :aria-busy="loading || undefined"
    class="inline-flex items-center justify-center gap-3 rounded-full transition disabled:cursor-not-allowed"
    :class="[variantClasses[variant], sizeClasses[size]]"
  >
    <AppSpinner v-if="loading" />
    <slot />
  </component>
</template>
