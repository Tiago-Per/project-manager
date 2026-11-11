<script setup lang="ts">
const checked = defineModel<boolean>({ required: true })

defineProps<{ label: string }>()
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="checked"
    class="text-text inline-flex items-center gap-2"
    @click="checked = !checked"
  >
    <span
      class="flex h-6 w-12 items-center rounded-full px-1.5 transition-colors"
      :class="checked ? 'bg-favorite' : 'bg-toggle'"
    >
      <span
        class="size-3 rounded-full bg-white transition-transform"
        :class="checked ? 'translate-x-6' : 'translate-x-0'"
      />
    </span>
    {{ label }}
  </button>
</template>
