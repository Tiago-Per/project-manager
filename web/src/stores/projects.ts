import { ref } from 'vue'
import { defineStore } from 'pinia'

import * as api from '@/api/projects'
import type { Project, ProjectFilters, ProjectInput } from '@/types/project'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<unknown>(null)
  const filters = ref<ProjectFilters>({ search: '', favorite: false, sort: 'name' })

  async function fetchProjects() {
    loading.value = true
    error.value = null

    try {
      const response = await api.listProjects(filters.value)
      projects.value = response.projects
      total.value = response.meta.total
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

  function replace(project: Project) {
    const index = projects.value.findIndex(({ id }) => id === project.id)
    if (index !== -1) projects.value[index] = project
  }

  async function createProject(input: ProjectInput) {
    const project = await api.createProject(input)
    await fetchProjects()

    return project
  }

  async function updateProject(id: number, input: Partial<ProjectInput>) {
    const project = await api.updateProject(id, input)
    replace(project)

    return project
  }

  async function deleteProject(id: number) {
    await api.deleteProject(id)
    projects.value = projects.value.filter((project) => project.id !== id)
    total.value = Math.max(total.value - 1, 0)
  }

  async function toggleFavorite(project: Project) {
    const updated = project.favorite
      ? await api.unfavoriteProject(project.id)
      : await api.favoriteProject(project.id)

    if (filters.value.favorite && !updated.favorite) {
      projects.value = projects.value.filter(({ id }) => id !== updated.id)
    } else {
      replace(updated)
    }

    return updated
  }

  return {
    projects,
    total,
    loading,
    error,
    filters,
    fetchProjects,
    setFilters,
    createProject,
    updateProject,
    deleteProject,
    toggleFavorite,
  }
})
