export interface Project {
  id: number
  name: string
  client: string
  /** ISO date (YYYY-MM-DD) */
  start_date: string
  /** ISO date (YYYY-MM-DD) */
  end_date: string
  favorite: boolean
  cover_url: string | null
}

export interface ProjectListResponse {
  projects: Project[]
  meta: {
    total: number
  }
}

export type ProjectSort = 'name' | 'recent' | 'deadline'

export interface ProjectFilters {
  search: string
  favorite: boolean
  sort: ProjectSort
}

export interface ProjectInput {
  name: string
  client: string
  start_date: string
  end_date: string
  cover?: File | null
  remove_cover?: boolean
}

/** Body of a 422 response: attribute name => list of messages. */
export interface ValidationErrors {
  errors: Record<string, string[]>
}

/** Body of a 404 response. */
export interface NotFoundError {
  error: string
}
