<script setup lang="ts">
import NewProjectButton from '@/components/NewProjectButton.vue'
import SortSelect from '@/components/SortSelect.vue'
import ToggleSwitch from '@/components/ToggleSwitch.vue'
import type { ProjectSort } from '@/types/project'

defineProps<{ total: number }>()

const favorite = defineModel<boolean>('favorite', { required: true })
const sort = defineModel<ProjectSort>('sort', { required: true })
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4">
    <h1 tabindex="-1" class="text-heading text-title outline-none">
      Projetos <span class="text-count text-primary font-normal">({{ total }})</span>
    </h1>

    <div class="flex flex-wrap items-center gap-4">
      <ToggleSwitch v-model="favorite" label="Apenas Favoritos" />
      <SortSelect v-model="sort" />
      <NewProjectButton />
    </div>
  </div>
</template>
