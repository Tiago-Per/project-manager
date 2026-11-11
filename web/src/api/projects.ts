import type {
  Project,
  ProjectFilters,
  ProjectInput,
  ProjectListResponse,
  ValidationErrors,
} from '@/types/project'

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown) {
    super(`Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }

  get validationErrors(): ValidationErrors['errors'] | null {
    if (this.status !== 422) return null

    return (this.body as ValidationErrors | null)?.errors ?? null
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
  })

  if (response.status === 204) return undefined as T

  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) throw new ApiError(response.status, body)

  return body as T
}

function toFormData(input: Partial<ProjectInput>): FormData {
  const formData = new FormData()

  for (const key of ['name', 'client', 'start_date', 'end_date'] as const) {
    const value = input[key]
    if (value !== undefined) formData.append(`project[${key}]`, value)
  }

  if (input.cover) formData.append('project[cover]', input.cover)
  if (input.remove_cover) formData.append('project[remove_cover]', 'true')

  return formData
}

export function listProjects(filters: Partial<ProjectFilters> = {}): Promise<ProjectListResponse> {
  const params = new URLSearchParams()

  const search = filters.search?.trim()
  if (search) params.set('search', search)
  if (filters.favorite) params.set('favorite', 'true')
  if (filters.sort) params.set('sort', filters.sort)

  const query = params.toString()

  return request(`/api/projects${query ? `?${query}` : ''}`)
}

export function getProject(id: number): Promise<Project> {
  return request(`/api/projects/${id}`)
}

export function createProject(input: ProjectInput): Promise<Project> {
  return request('/api/projects', { method: 'POST', body: toFormData(input) })
}

export function updateProject(id: number, input: Partial<ProjectInput>): Promise<Project> {
  return request(`/api/projects/${id}`, { method: 'PATCH', body: toFormData(input) })
}

export function deleteProject(id: number): Promise<void> {
  return request(`/api/projects/${id}`, { method: 'DELETE' })
}

export function favoriteProject(id: number): Promise<Project> {
  return request(`/api/projects/${id}/favorite`, { method: 'POST' })
}

export function unfavoriteProject(id: number): Promise<Project> {
  return request(`/api/projects/${id}/favorite`, { method: 'DELETE' })
}
