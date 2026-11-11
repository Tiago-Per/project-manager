<script setup lang="ts">
import { ref } from 'vue'

import ProjectCard from '@/components/ProjectCard.vue'
import type { Project } from '@/types/project'

defineProps<{
  projects: Project[]
  /** Search term to highlight in the project names. */
  highlight?: string
}>()

defineEmits<{
  'toggle-favorite': [project: Project]
  remove: [project: Project]
}>()

// Only one card menu can be open at a time.
const openMenuId = ref<number | null>(null)

function setMenuOpen(id: number, open: boolean) {
  if (open) openMenuId.value = id
  else if (openMenuId.value === id) openMenuId.value = null
}
</script>

<template>
  <ul class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
    <li v-for="project in projects" :key="project.id">
      <ProjectCard
        :project="project"
        :highlight="highlight"
        :menu-open="openMenuId === project.id"
        @update:menu-open="setMenuOpen(project.id, $event)"
        @toggle-favorite="$emit('toggle-favorite', $event)"
        @remove="$emit('remove', $event)"
      />
    </li>
  </ul>
</template>
