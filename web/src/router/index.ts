import { createRouter, createWebHistory, type LocationQueryValue } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** Shows the search button in the header. */
    showSearch?: boolean
    /** Keeps the header in search mode (search results page). */
    searchMode?: boolean
  }
}

function searchTerm(value: LocationQueryValue | LocationQueryValue[] | undefined) {
  return typeof value === 'string' ? value.trim() : ''
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'projects',
      component: () => import('@/views/ProjectListView.vue'),
      meta: { showSearch: true },
    },
    {
      path: '/projects/new',
      name: 'project-new',
      component: () => import('@/views/ProjectFormView.vue'),
    },
    {
      path: '/projects/:id/edit',
      name: 'project-edit',
      component: () => import('@/views/ProjectFormView.vue'),
      props: (route) => ({ id: Number(route.params.id) }),
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/views/SearchView.vue'),
      meta: { searchMode: true },
      props: (route) => ({ q: searchTerm(route.query.q) }),
      // Without a term there is nothing to show: go back to the list.
      beforeEnter: (to) => (searchTerm(to.query.q) ? true : { name: 'projects' }),
    },
  ],
})

export default router
