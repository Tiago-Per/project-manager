<script setup lang="ts">
import { computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import closeIcon from '@/assets/icons/close.svg'
import historyIcon from '@/assets/icons/history.svg'
import logoSymbol from '@/assets/icons/logo-symbol.svg'
import searchPrimaryIcon from '@/assets/icons/search-primary.svg'
import searchIcon from '@/assets/icons/search.svg'
import { useDebounceFn } from '@/composables/useDebounceFn'
import { useSearchHistory } from '@/composables/useSearchHistory'
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_LENGTH } from '@/utils/search'

const route = useRoute()
const router = useRouter()
const history = useSearchHistory()

const id = useId()
const input = useTemplateRef<HTMLInputElement>('input')
const searchButton = useTemplateRef<HTMLButtonElement>('searchButton')
const box = useTemplateRef<HTMLElement>('box')

const opened = ref(false)
const searchMode = computed(() => opened.value || route.meta.searchMode === true)

const routeTerm = computed(() => (typeof route.query.q === 'string' ? route.query.q : ''))
const term = ref(routeTerm.value)
// Term of the last navigation started here, so its route update doesn't overwrite what the
// user kept typing meanwhile. Other changes (back button, reload) fill the input.
let navigatedTerm: string | null = null

watch(routeTerm, (q) => {
  if (q !== navigatedTerm) term.value = q
  navigatedTerm = null
})

watch(
  () => route.meta.searchMode,
  (inSearchPage) => {
    if (inSearchPage) return
    // Leaving the results page (Voltar, card menu...) leaves search mode.
    opened.value = false
    term.value = ''
    debounced.cancel()
  },
)

const focusWithin = ref(false)
const showHistory = computed(
  () => focusWithin.value && term.value.trim() === '' && history.terms.value.length > 0,
)

function search(value: string) {
  const query = value.trim()
  if (query.length < SEARCH_MIN_LENGTH) return

  history.save(query)
  if (query === routeTerm.value) return

  navigatedTerm = query
  // Typing on the results page replaces the entry, so "back" returns to where search started.
  const navigate = route.meta.searchMode ? router.replace : router.push
  navigate({ name: 'search', query: { q: query } })
}

const debounced = useDebounceFn(search, SEARCH_DEBOUNCE_MS)

function onInput() {
  if (term.value.trim().length >= SEARCH_MIN_LENGTH) debounced.run(term.value)
  else debounced.cancel()
}

function searchNow() {
  debounced.cancel()
  search(term.value)
}

function pick(value: string) {
  term.value = value
  searchNow()
}

function removeFromHistory(value: string) {
  history.remove(value)
  // The focused X button may be gone, so keep focus in the search.
  input.value?.focus()
}

async function open() {
  opened.value = true
  await nextTick()
  input.value?.focus()
}

async function close() {
  debounced.cancel()
  opened.value = false
  term.value = ''

  if (route.meta.searchMode) {
    await router.push({ name: 'projects' })
  }
  await nextTick()
  searchButton.value?.focus()
}

function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null
  if (!next || !box.value?.contains(next)) focusWithin.value = false
}
</script>

<template>
  <header class="relative z-10 h-20">
    <div
      v-if="!searchMode"
      class="bg-header shadow-raised flex h-full items-center justify-center px-10"
    >
      <RouterLink :to="{ name: 'projects' }" class="flex items-center gap-1 text-white">
        <img :src="logoSymbol" alt="" width="72" height="72" />
        <span class="font-brand text-brand leading-tight">Gerenciador<br />de Projetos</span>
      </RouterLink>

      <button
        v-if="route.meta.showSearch"
        ref="searchButton"
        type="button"
        aria-label="Buscar projetos"
        class="absolute right-2 flex size-10 items-center justify-center rounded-full hover:bg-white/10 sm:right-14"
        @click="open"
      >
        <img :src="searchIcon" alt="" width="20" height="20" />
      </button>
    </div>

    <div
      v-else
      ref="box"
      role="search"
      class="shadow-raised absolute inset-x-0 top-0 overflow-hidden border-2 bg-white"
      :class="showHistory ? 'border-primary rounded-card' : 'border-transparent'"
      @focusin="focusWithin = true"
      @focusout="onFocusOut"
      @keydown.esc.prevent="close"
    >
      <div class="flex h-19 items-center gap-4 px-6 sm:px-8">
        <img :src="searchPrimaryIcon" alt="" width="20" height="20" />
        <label :for="`${id}-input`" class="sr-only">Buscar projetos</label>
        <input
          :id="`${id}-input`"
          ref="input"
          v-model="term"
          type="text"
          enterkeyhint="search"
          autocomplete="off"
          placeholder="Digite o nome do projeto..."
          class="text-search text-header placeholder:text-separator h-full min-w-0 flex-1 bg-transparent outline-none"
          @input="onInput"
          @keydown.enter.prevent="searchNow"
        />
      </div>

      <!-- mousedown.prevent keeps focus in the input, so the list doesn't close before the click. -->
      <ul v-if="showHistory" aria-label="Buscas recentes" @mousedown.prevent>
        <li
          v-for="saved in history.terms.value"
          :key="saved"
          class="border-page flex h-13 items-center border-t"
        >
          <button
            type="button"
            class="text-muted hover:bg-page flex h-full min-w-0 flex-1 items-center gap-4 px-6 text-left leading-4"
            @click="pick(saved)"
          >
            <img :src="historyIcon" alt="" width="16" height="16" />
            <span class="truncate">{{ saved }}</span>
          </button>
          <button
            type="button"
            :aria-label="`Remover ${saved} do histórico`"
            class="hover:bg-page flex size-13 shrink-0 items-center justify-center"
            @click="removeFromHistory(saved)"
          >
            <img :src="closeIcon" alt="" width="16" height="16" />
          </button>
        </li>
      </ul>
    </div>
  </header>
</template>
