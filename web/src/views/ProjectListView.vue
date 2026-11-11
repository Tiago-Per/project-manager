<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import EmptyState from '@/components/EmptyState.vue'
import NewProjectButton from '@/components/NewProjectButton.vue'
import ProjectGrid from '@/components/ProjectGrid.vue'
import ProjectsToolbar from '@/components/ProjectsToolbar.vue'
import { useProjectsStore } from '@/stores/projects'
import type { Project, ProjectSort } from '@/types/project'

const store = useProjectsStore()
const { projects, total, loaded, error, filters } = storeToRefs(store)

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

onMounted(() => store.fetchProjects())
</script>

<template>
  <main class="flex flex-1 flex-col gap-6 px-4 py-8 sm:px-10 sm:py-15">
    <EmptyState
      v-if="error"
      title="Não foi possível carregar os projetos"
      description="Verifique sua conexão e tente novamente."
    >
      <button
        type="button"
        class="bg-primary h-10 rounded-full px-6 text-white"
        @click="store.fetchProjects()"
      >
        Tentar novamente
      </button>
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
        />
        <EmptyState
          v-else-if="filters.favorite"
          title="Nenhum projeto favorito"
          description="Clique na estrela de um projeto para vê-lo aqui."
        />
      </template>
    </template>
  </main>
</template>
