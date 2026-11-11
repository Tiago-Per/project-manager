<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from 'vue'
import { storeToRefs } from 'pinia'

import AppButton from '@/components/AppButton.vue'
import BackLink from '@/components/BackLink.vue'
import EmptyState from '@/components/EmptyState.vue'
import ProjectGrid from '@/components/ProjectGrid.vue'
import RemoveProjectModal from '@/components/RemoveProjectModal.vue'
import { useProjectsStore } from '@/stores/projects'
import type { Project } from '@/types/project'

const { q } = defineProps<{ q: string }>()

const store = useProjectsStore()
const { searchResults, searchTerm, searchLoading, searchError } = storeToRefs(store)

const heading = useTemplateRef<HTMLElement>('heading')

watch(
  () => q,
  (term) => store.searchProjects(term),
  { immediate: true },
)

async function toggleFavorite(project: Project) {
  try {
    await store.toggleFavorite(project)
  } catch (e) {
    searchError.value = e
  }
}

const projectToRemove = ref<Project | null>(null)

async function onRemoved() {
  projectToRemove.value = null
  await nextTick()
  heading.value?.focus()
}
</script>

<template>
  <main class="flex flex-1 flex-col px-4 py-8 sm:px-10 sm:py-15">
    <BackLink />
    <h1 ref="heading" tabindex="-1" class="text-heading text-title mt-3 outline-none">
      Resultado da busca
    </h1>

    <EmptyState
      v-if="searchError"
      class="mt-6"
      title="Não foi possível buscar os projetos"
      description="Verifique sua conexão e tente novamente."
    >
      <AppButton @click="store.searchProjects(q)">Tentar novamente</AppButton>
    </EmptyState>

    <ProjectGrid
      v-else-if="searchResults.length || searchLoading"
      class="mt-6"
      :projects="searchResults"
      :loading="searchLoading"
      :highlight="searchTerm ?? ''"
      @toggle-favorite="toggleFavorite"
      @remove="projectToRemove = $event"
    />

    <EmptyState
      v-else-if="!searchLoading && searchTerm === q"
      class="mt-6"
      title="Nenhum projeto encontrado"
      :description="`Não encontramos projetos com “${q}” no nome. Tente buscar por outro termo.`"
    />

    <RemoveProjectModal
      :project="projectToRemove"
      @cancel="projectToRemove = null"
      @removed="onRemoved"
    />
  </main>
</template>
