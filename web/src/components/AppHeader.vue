<script setup lang="ts">
import { useRoute } from 'vue-router'

import logoSymbol from '@/assets/icons/logo-symbol.svg'
import searchIcon from '@/assets/icons/search.svg'

const route = useRoute()
</script>

<template>
  <header class="bg-header shadow-raised relative z-10 flex h-20 items-center justify-center px-10">
    <RouterLink :to="{ name: 'projects' }" class="flex items-center gap-1 text-white">
      <img :src="logoSymbol" alt="" width="72" height="72" />
      <span class="font-brand text-brand leading-tight">Gerenciador<br />de Projetos</span>
    </RouterLink>

    <button
      v-if="route.meta.showSearch"
      type="button"
      aria-label="Buscar projetos"
      class="absolute right-2 flex size-10 items-center justify-center rounded-full hover:bg-white/10 sm:right-14"
    >
      <img :src="searchIcon" alt="" width="20" height="20" />
    </button>
  </header>
</template>
