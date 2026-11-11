<script setup lang="ts">
import { computed } from 'vue'

import { splitByMatch } from '@/utils/highlight'

const { text, query = '' } = defineProps<{ text: string; query?: string }>()

// Rendered as text nodes and <mark>, never as HTML, so names can't inject markup.
const segments = computed(() => splitByMatch(text, query))
</script>

<template>
  <template v-for="(segment, index) in segments" :key="index">
    <mark v-if="segment.match" class="bg-favorite text-white">{{ segment.text }}</mark>
    <template v-else>{{ segment.text }}</template>
  </template>
</template>
