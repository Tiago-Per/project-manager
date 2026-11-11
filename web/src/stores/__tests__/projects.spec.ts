import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import * as api from '@/api/projects'
import { useProjectsStore } from '../projects'
import type { Project } from '@/types/project'

vi.mock('@/api/projects')

const project: Project = {
  id: 1,
  name: 'Site institucional',
  client: 'Acme',
  start_date: '2026-01-10',
  end_date: '2026-03-20',
  favorite: false,
  cover_url: null,
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.resetAllMocks()
})

describe('projects store', () => {
  it('loads projects and total with the current filters', async () => {
    vi.mocked(api.listProjects).mockResolvedValue({ projects: [project], meta: { total: 5 } })
    const store = useProjectsStore()

    await store.fetchProjects()

    expect(api.listProjects).toHaveBeenCalledWith({ search: '', favorite: false, sort: 'name' })
    expect(store.projects).toEqual([project])
    expect(store.total).toBe(5)
    expect(store.loading).toBe(false)
  })

  it('marks the list as loaded after the first successful fetch', async () => {
    vi.mocked(api.listProjects).mockResolvedValue({ projects: [], meta: { total: 0 } })
    const store = useProjectsStore()
    expect(store.loaded).toBe(false)

    await store.fetchProjects()

    expect(store.loaded).toBe(true)
  })

  it('stores the error when loading fails', async () => {
    const failure = new Error('network')
    vi.mocked(api.listProjects).mockRejectedValue(failure)
    const store = useProjectsStore()

    await store.fetchProjects()

    expect(store.error).toBe(failure)
    expect(store.loading).toBe(false)
    expect(store.loaded).toBe(false)
  })

  it('merges filters and refetches', async () => {
    vi.mocked(api.listProjects).mockResolvedValue({ projects: [], meta: { total: 0 } })
    const store = useProjectsStore()

    await store.setFilters({ sort: 'deadline', favorite: true })

    expect(api.listProjects).toHaveBeenCalledWith({ search: '', favorite: true, sort: 'deadline' })
  })

  it('updates the project in the list when favorited', async () => {
    vi.mocked(api.favoriteProject).mockResolvedValue({ ...project, favorite: true })
    const store = useProjectsStore()
    store.projects = [project]

    await store.toggleFavorite(project)

    expect(api.favoriteProject).toHaveBeenCalledWith(1)
    expect(store.projects[0]?.favorite).toBe(true)
  })

  it('removes an unfavorited project when filtering by favorites', async () => {
    const favorite = { ...project, favorite: true }
    vi.mocked(api.unfavoriteProject).mockResolvedValue(project)
    const store = useProjectsStore()
    store.filters.favorite = true
    store.projects = [favorite]

    await store.toggleFavorite(favorite)

    expect(api.unfavoriteProject).toHaveBeenCalledWith(1)
    expect(store.projects).toEqual([])
  })

  it('removes a deleted project and decrements the total', async () => {
    vi.mocked(api.deleteProject).mockResolvedValue()
    const store = useProjectsStore()
    store.projects = [project]
    store.total = 1

    await store.deleteProject(1)

    expect(store.projects).toEqual([])
    expect(store.total).toBe(0)
  })
})
