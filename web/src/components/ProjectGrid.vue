<script setup lang="ts">
import ProjectCard from '@/components/ProjectCard.vue'
import type { Project } from '@/types/project'

defineProps<{ projects: Project[] }>()

defineEmits<{ 'toggle-favorite': [project: Project] }>()
</script>

<template>
  <ul class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
    <li v-for="project in projects" :key="project.id">
      <ProjectCard :project="project" @toggle-favorite="$emit('toggle-favorite', $event)" />
    </li>
  </ul>
</template>
