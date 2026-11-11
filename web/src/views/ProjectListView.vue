<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'

import AppButton from '@/components/AppButton.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import NewProjectButton from '@/components/NewProjectButton.vue'
import ProjectGrid from '@/components/ProjectGrid.vue'
import ProjectsToolbar from '@/components/ProjectsToolbar.vue'
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
const removing = ref(false)
const removeError = ref<string | null>(null)

function askRemove(project: Project) {
  removeError.value = null
  projectToRemove.value = project
}

function cancelRemove() {
  projectToRemove.value = null
}

async function confirmRemove() {
  if (!projectToRemove.value) return

  removing.value = true
  removeError.value = null

  try {
    await store.deleteProject(projectToRemove.value.id)
    projectToRemove.value = null
    // The card and its "..." button are gone, so move focus to the page heading.
    await nextTick()
    main.value?.querySelector<HTMLElement>('h1, h2')?.focus()
  } catch {
    removeError.value = 'Não foi possível remover o projeto. Tente novamente.'
  } finally {
    removing.value = false
  }
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
          @remove="askRemove"
        />
        <EmptyState
          v-else-if="filters.favorite"
          title="Nenhum projeto favorito"
          description="Clique na estrela de um projeto para vê-lo aqui."
        />
      </template>
    </template>

    <ConfirmModal
      :open="projectToRemove !== null"
      title="Remover projeto"
      :loading="removing"
      :error="removeError"
      @confirm="confirmRemove"
      @cancel="cancelRemove"
    >
      <p class="text-muted leading-5.5">Essa ação removerá definitivamente o projeto:</p>
      <p class="text-heading text-header mt-3 font-medium break-words">
        {{ projectToRemove?.name }}
      </p>
    </ConfirmModal>
  </main>
</template>
