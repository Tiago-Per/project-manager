<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'

const {
  variant = 'primary',
  size = 'md',
  to,
  type = 'button',
} = defineProps<{
  variant?: 'primary' | 'outline'
  size?: 'md' | 'lg'
  to?: RouteLocationRaw
  type?: 'button' | 'submit'
}>()

const variantClasses = {
  primary: 'bg-primary text-white enabled:hover:brightness-110',
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
    class="inline-flex items-center justify-center gap-3 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60"
    :class="[variantClasses[variant], sizeClasses[size]]"
  >
    <slot />
  </component>
</template>
