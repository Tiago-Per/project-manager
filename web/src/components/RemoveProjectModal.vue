<script setup lang="ts">
import { ref, watch } from 'vue'

import ConfirmModal from '@/components/ConfirmModal.vue'
import { useProjectsStore } from '@/stores/projects'
import type { Project } from '@/types/project'

/** Project to remove; the modal is open while it is set. */
const { project } = defineProps<{ project: Project | null }>()

const emit = defineEmits<{ cancel: []; removed: [project: Project] }>()

const store = useProjectsStore()
const removing = ref(false)
const error = ref<string | null>(null)

watch(
  () => project,
  () => (error.value = null),
)

async function confirm() {
  if (!project) return

  removing.value = true
  error.value = null

  try {
    await store.deleteProject(project.id)
    emit('removed', project)
  } catch {
    error.value = 'Não foi possível remover o projeto. Tente novamente.'
  } finally {
    removing.value = false
  }
}
</script>

<template>
  <ConfirmModal
    :open="project !== null"
    title="Remover projeto"
    :loading="removing"
    :error="error"
    @confirm="confirm"
    @cancel="emit('cancel')"
  >
    <p class="text-muted leading-5.5">Essa ação removerá definitivamente o projeto:</p>
    <p class="text-heading text-header mt-3 font-medium break-words">{{ project?.name }}</p>
  </ConfirmModal>
</template>
