<script setup lang="ts">
import { ref } from 'vue'

import ProjectCard from '@/components/ProjectCard.vue'
import ProjectCardSkeleton from '@/components/ProjectCardSkeleton.vue'
import type { Project } from '@/types/project'

const SKELETON_COUNT = 8

defineProps<{
  projects: Project[]
  /** Loading projects: skeleton cards when the list is empty, dimmed cards otherwise. */
  loading?: boolean
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
  <ul
    v-if="loading && !projects.length"
    class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
    aria-busy="true"
    aria-label="Carregando projetos"
  >
    <li v-for="index in SKELETON_COUNT" :key="index">
      <ProjectCardSkeleton />
    </li>
  </ul>
  <ul
    v-else
    class="grid grid-cols-1 gap-8 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
    :class="{ 'opacity-60': loading }"
    :aria-busy="loading || undefined"
  >
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
