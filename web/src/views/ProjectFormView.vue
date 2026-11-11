<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import BackLink from '@/components/BackLink.vue'
import EmptyState from '@/components/EmptyState.vue'
import ProjectForm from '@/components/ProjectForm.vue'
import { ApiError } from '@/api/projects'
import { useProjectsStore } from '@/stores/projects'
import type { Project, ProjectInput } from '@/types/project'

const { id } = defineProps<{ id?: number }>()

const store = useProjectsStore()
const router = useRouter()

const isEdit = computed(() => id !== undefined)
const title = computed(() => (isEdit.value ? 'Editar projeto' : 'Novo projeto'))

const project = ref<Project | null>(null)
const loadState = ref<'loading' | 'ready' | 'not-found' | 'error'>('ready')

const submitting = ref(false)
const serverErrors = ref<Record<string, string[]> | null>(null)
const saveError = ref<string | null>(null)

async function loadProject(projectId: number) {
  loadState.value = 'loading'

  try {
    project.value = await store.fetchProject(projectId)
    loadState.value = 'ready'
  } catch (e) {
    loadState.value = e instanceof ApiError && e.status === 404 ? 'not-found' : 'error'
  }
}

watch(
  () => id,
  (projectId) => {
    project.value = null
    if (projectId !== undefined) loadProject(projectId)
    else loadState.value = 'ready'
  },
  { immediate: true },
)

async function save(input: ProjectInput) {
  submitting.value = true
  serverErrors.value = null
  saveError.value = null

  try {
    if (id !== undefined) await store.updateProject(id, input)
    else await store.createProject(input)

    await router.push({ name: 'projects' })
  } catch (e) {
    const validationErrors = e instanceof ApiError ? e.validationErrors : null

    if (validationErrors) serverErrors.value = validationErrors
    else saveError.value = 'Não foi possível salvar o projeto. Tente novamente.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="flex flex-1 flex-col px-4 py-8 sm:px-10 sm:py-15">
    <BackLink />
    <h1 class="text-heading text-title mt-3">{{ title }}</h1>

    <EmptyState
      v-if="loadState === 'not-found'"
      class="mt-8"
      title="Projeto não encontrado"
      description="Ele pode ter sido removido. Volte para a lista de projetos."
    />
    <EmptyState
      v-else-if="loadState === 'error'"
      class="mt-8"
      title="Não foi possível carregar o projeto"
      description="Verifique sua conexão e tente novamente."
    />

    <section
      v-else-if="loadState === 'ready'"
      class="rounded-medium border-border mt-8 border px-4 py-13 sm:px-10"
    >
      <p v-if="saveError" role="alert" class="text-error mx-auto mb-6 max-w-176">
        {{ saveError }}
      </p>
      <ProjectForm
        :key="project?.id ?? 'new'"
        :project="project"
        :submitting="submitting"
        :server-errors="serverErrors"
        @submit="save"
      />
    </section>
  </main>
</template>
