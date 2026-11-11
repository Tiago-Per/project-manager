<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'

import AppButton from '@/components/AppButton.vue'
import EmptyState from '@/components/EmptyState.vue'
import NewProjectButton from '@/components/NewProjectButton.vue'
import ProjectGrid from '@/components/ProjectGrid.vue'
import ProjectsToolbar from '@/components/ProjectsToolbar.vue'
import RemoveProjectModal from '@/components/RemoveProjectModal.vue'
import { useProjectsStore } from '@/stores/projects'
import type { Project, ProjectSort } from '@/types/project'

const store = useProjectsStore()
const { projects, total, loaded, error, filters } = storeToRefs(store)

const main = useTemplateRef<HTMLElement>('main')

const favorite = computed({
  get: () => filters.value.favorite,
  set: (value: boolean) => store.setFilters({ favorite: value }),
})

const sort = computed({
  get: () => filters.value.sort,
  set: (value: ProjectSort) => store.setFilters({ sort: value }),
})

async function toggleFavorite(project: Project) {
  try {
    await store.toggleFavorite(project)
  } catch (e) {
    error.value = e
  }
}

const projectToRemove = ref<Project | null>(null)

async function onRemoved() {
  projectToRemove.value = null
  // The card and its "..." button are gone, so move focus to the page heading.
  await nextTick()
  main.value?.querySelector<HTMLElement>('h1, h2')?.focus()
}

onMounted(() => store.fetchProjects())
</script>

<template>
  <main ref="main" class="flex flex-1 flex-col gap-6 px-4 py-8 sm:px-10 sm:py-15">
    <EmptyState
      v-if="error"
      title="Não foi possível carregar os projetos"
      description="Verifique sua conexão e tente novamente."
    >
      <AppButton @click="store.fetchProjects()">Tentar novamente</AppButton>
    </EmptyState>

    <template v-else-if="loaded">
      <EmptyState
        v-if="total === 0"
        title="Nenhum projeto"
        description="Clique no botão abaixo para criar o primeiro e gerenciá-lo."
      >
        <NewProjectButton size="lg" />
      </EmptyState>

      <template v-else>
        <ProjectsToolbar v-model:favorite="favorite" v-model:sort="sort" :total="total" />

        <ProjectGrid
          v-if="projects.length"
          :projects="projects"
          @toggle-favorite="toggleFavorite"
          @remove="projectToRemove = $event"
        />
        <EmptyState
          v-else-if="filters.favorite"
          title="Nenhum projeto favorito"
          description="Clique na estrela de um projeto para vê-lo aqui."
        />
      </template>
    </template>

    <RemoveProjectModal
      :project="projectToRemove"
      @cancel="projectToRemove = null"
      @removed="onRemoved"
    />
  </main>
</template>
