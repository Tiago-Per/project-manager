<script setup lang="ts">
import { ref, watch } from 'vue'

import calendarCheckIcon from '@/assets/icons/calendar-check.svg'
import calendarDayIcon from '@/assets/icons/calendar-day.svg'
import starFilledIcon from '@/assets/icons/star-filled.svg'
import starOutlineIcon from '@/assets/icons/star-outline.svg'
import coverPlaceholder from '@/assets/images/cover-placeholder.png'
import CardMenu from '@/components/CardMenu.vue'
import type { Project } from '@/types/project'
import { formatDate } from '@/utils/date'

const { project } = defineProps<{ project: Project }>()

const menuOpen = defineModel<boolean>('menuOpen', { default: false })

defineEmits<{
  'toggle-favorite': [project: Project]
  remove: [project: Project]
}>()

// Falls back to the placeholder when the cover URL fails to load.
const coverFailed = ref(false)
watch(
  () => project.cover_url,
  () => (coverFailed.value = false),
)
</script>

<template>
  <article class="flex flex-col">
    <div class="relative aspect-3/2">
      <img
        :src="(!coverFailed && project.cover_url) || coverPlaceholder"
        alt=""
        class="rounded-t-card size-full object-cover"
        data-test="cover"
        @error="coverFailed = true"
      />

      <div class="absolute right-4 bottom-2 flex items-center gap-2">
        <button
          type="button"
          :aria-label="`${project.favorite ? 'Desfavoritar' : 'Favoritar'} ${project.name}`"
          :aria-pressed="project.favorite"
          class="flex size-10 items-center justify-center rounded-full"
          @click="$emit('toggle-favorite', project)"
        >
          <img :src="project.favorite ? starFilledIcon : starOutlineIcon" alt="" />
        </button>
        <CardMenu
          v-model:open="menuOpen"
          :label="`Mais ações para ${project.name}`"
          :edit-to="{ name: 'project-edit', params: { id: project.id } }"
          @remove="$emit('remove', project)"
        />
      </div>
    </div>

    <div class="border-border rounded-b-card flex flex-1 flex-col border border-t-0 bg-white p-6">
      <h2 class="text-card-title text-title truncate">{{ project.name }}</h2>
      <p class="text-muted mt-2 truncate">
        <span class="font-bold">Cliente:</span> {{ project.client }}
      </p>

      <hr class="border-divider my-4" />

      <dl class="text-muted space-y-2">
        <div class="flex items-center gap-4">
          <dt>
            <img :src="calendarDayIcon" alt="" width="24" height="24" />
            <span class="sr-only">Início</span>
          </dt>
          <dd>{{ formatDate(project.start_date) }}</dd>
        </div>
        <div class="flex items-center gap-4">
          <dt>
            <img :src="calendarCheckIcon" alt="" width="24" height="24" />
            <span class="sr-only">Prazo</span>
          </dt>
          <dd>{{ formatDate(project.end_date) }}</dd>
        </div>
      </dl>
    </div>
  </article>
</template>
