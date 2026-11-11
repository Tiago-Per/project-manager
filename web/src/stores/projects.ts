import { ref } from 'vue'
import { defineStore } from 'pinia'

import * as api from '@/api/projects'
import type { Project, ProjectFilters, ProjectInput } from '@/types/project'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const total = ref(0)
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<unknown>(null)
  const filters = ref<ProjectFilters>({ search: '', favorite: false, sort: 'name' })

  // Search results live apart from the list so its filters stay untouched.
  const searchResults = ref<Project[]>([])
  /** Term that produced `searchResults`. */
  const searchTerm = ref<string | null>(null)
  const searchLoading = ref(false)
  const searchError = ref<unknown>(null)
  let lastSearch = 0

  async function fetchProjects() {
    loading.value = true
    error.value = null

    try {
      const response = await api.listProjects(filters.value)
      projects.value = response.projects
      total.value = response.meta.total
      loaded.value = true
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  function setFilters(changes: Partial<ProjectFilters>) {
    filters.value = { ...filters.value, ...changes }

    return fetchProjects()
  }

  async function searchProjects(term: string) {
    const request = ++lastSearch
    searchLoading.value = true
    searchError.value = null

    try {
      const response = await api.listProjects({ search: term, sort: 'name' })
      // A newer search started meanwhile: its response wins.
      if (request === lastSearch) {
        searchResults.value = response.projects
        searchTerm.value = term
      }
    } catch (e) {
      if (request === lastSearch) searchError.value = e
    } finally {
      if (request === lastSearch) searchLoading.value = false
    }
  }

  function replace(project: Project) {
    for (const list of [projects.value, searchResults.value]) {
      const index = list.findIndex(({ id }) => id === project.id)
      if (index !== -1) list[index] = project
    }
  }

  function fetchProject(id: number) {
    return api.getProject(id)
  }

  // The list page refetches when it opens, so the new project shows up there.
  function createProject(input: ProjectInput) {
    return api.createProject(input)
  }

  async function updateProject(id: number, input: Partial<ProjectInput>) {
    const project = await api.updateProject(id, input)
    replace(project)

    return project
  }

  async function deleteProject(id: number) {
    await api.deleteProject(id)
    projects.value = projects.value.filter((project) => project.id !== id)
    searchResults.value = searchResults.value.filter((project) => project.id !== id)
    total.value = Math.max(total.value - 1, 0)
  }

  async function toggleFavorite(project: Project) {
    const updated = project.favorite
      ? await api.unfavoriteProject(project.id)
      : await api.favoriteProject(project.id)

    replace(updated)
    if (filters.value.favorite && !updated.favorite) {
      projects.value = projects.value.filter(({ id }) => id !== updated.id)
      total.value = Math.max(total.value - 1, 0)
    }

    return updated
  }

  return {
    projects,
    total,
    loading,
    loaded,
    error,
    filters,
    searchResults,
    searchTerm,
    searchLoading,
    searchError,
    fetchProjects,
    searchProjects,
    setFilters,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    toggleFavorite,
  }
})
