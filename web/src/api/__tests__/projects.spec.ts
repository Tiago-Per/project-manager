import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ApiError,
  createProject,
  deleteProject,
  favoriteProject,
  getProject,
  listProjects,
  unfavoriteProject,
  updateProject,
} from '../projects'
import type { Project } from '@/types/project'

const API_URL = import.meta.env.VITE_API_URL

const project: Project = {
  id: 1,
  name: 'Site institucional',
  client: 'Acme',
  start_date: '2026-01-10',
  end_date: '2026-03-20',
  favorite: false,
  cover_url: null,
}

const fetchMock = vi.fn<typeof fetch>()

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function lastCall() {
  const [url, init] = fetchMock.mock.lastCall ?? []
  return { url: String(url), init: init ?? {} }
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

describe('listProjects', () => {
  it('requests the list without params by default', async () => {
    const body = { projects: [project], meta: { total: 1 } }
    fetchMock.mockResolvedValue(jsonResponse(body))

    await expect(listProjects()).resolves.toEqual(body)
    expect(lastCall().url).toBe(`${API_URL}/api/projects`)
  })

  it('sends search, favorite and sort params', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ projects: [], meta: { total: 0 } }))

    await listProjects({ search: '  site  ', favorite: true, sort: 'deadline' })

    const url = new URL(lastCall().url)
    expect(url.searchParams.get('search')).toBe('site')
    expect(url.searchParams.get('favorite')).toBe('true')
    expect(url.searchParams.get('sort')).toBe('deadline')
  })

  it('omits an empty search and a false favorite filter', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ projects: [], meta: { total: 0 } }))

    await listProjects({ search: '   ', favorite: false, sort: 'name' })

    expect(lastCall().url).toBe(`${API_URL}/api/projects?sort=name`)
  })
})

describe('getProject', () => {
  it('returns the project', async () => {
    fetchMock.mockResolvedValue(jsonResponse(project))

    await expect(getProject(1)).resolves.toEqual(project)
    expect(lastCall().url).toBe(`${API_URL}/api/projects/1`)
  })

  it('rejects with an ApiError when the project is not found', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'Project not found' }, 404))

    const error = await getProject(99).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404, body: { error: 'Project not found' } })
  })
})

describe('createProject', () => {
  it('posts the fields as project[...] form data, including the cover', async () => {
    fetchMock.mockResolvedValue(jsonResponse(project, 201))
    const cover = new File(['image'], 'cover.png', { type: 'image/png' })

    await createProject({
      name: 'Site institucional',
      client: 'Acme',
      start_date: '2026-01-10',
      end_date: '2026-03-20',
      cover,
    })

    const { url, init } = lastCall()
    expect(url).toBe(`${API_URL}/api/projects`)
    expect(init.method).toBe('POST')

    const body = init.body as FormData
    expect(body.get('project[name]')).toBe('Site institucional')
    expect(body.get('project[client]')).toBe('Acme')
    expect(body.get('project[start_date]')).toBe('2026-01-10')
    expect(body.get('project[end_date]')).toBe('2026-03-20')
    expect((body.get('project[cover]') as File).name).toBe('cover.png')
    expect(body.has('project[remove_cover]')).toBe(false)
  })

  it('exposes validation errors on a 422', async () => {
    const errors = { name: ['must have at least two words'] }
    fetchMock.mockResolvedValue(jsonResponse({ errors }, 422))

    const error = await createProject({
      name: 'Site',
      client: 'Acme',
      start_date: '2026-01-10',
      end_date: '2026-03-20',
    }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).validationErrors).toEqual(errors)
  })
})

describe('updateProject', () => {
  it('patches only the given fields', async () => {
    fetchMock.mockResolvedValue(jsonResponse(project))

    await updateProject(1, { name: 'Novo nome' })

    const { url, init } = lastCall()
    expect(url).toBe(`${API_URL}/api/projects/1`)
    expect(init.method).toBe('PATCH')

    const body = init.body as FormData
    expect([...body.keys()]).toEqual(['project[name]'])
  })

  it('sends remove_cover when the cover is removed', async () => {
    fetchMock.mockResolvedValue(jsonResponse(project))

    await updateProject(1, { remove_cover: true })

    const body = lastCall().init.body as FormData
    expect(body.get('project[remove_cover]')).toBe('true')
    expect(body.has('project[cover]')).toBe(false)
  })
})

describe('deleteProject', () => {
  it('sends a DELETE and resolves on 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(deleteProject(1)).resolves.toBeUndefined()

    const { url, init } = lastCall()
    expect(url).toBe(`${API_URL}/api/projects/1`)
    expect(init.method).toBe('DELETE')
  })
})

describe('favorites', () => {
  it('favorites with POST on the nested resource', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ...project, favorite: true }))

    await expect(favoriteProject(1)).resolves.toMatchObject({ favorite: true })

    const { url, init } = lastCall()
    expect(url).toBe(`${API_URL}/api/projects/1/favorite`)
    expect(init.method).toBe('POST')
  })

  it('unfavorites with DELETE on the nested resource', async () => {
    fetchMock.mockResolvedValue(jsonResponse(project))

    await expect(unfavoriteProject(1)).resolves.toMatchObject({ favorite: false })

    const { url, init } = lastCall()
    expect(url).toBe(`${API_URL}/api/projects/1/favorite`)
    expect(init.method).toBe('DELETE')
  })
})
