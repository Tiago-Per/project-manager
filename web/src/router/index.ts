import { createRouter, createWebHistory } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** Shows the search button in the header. */
    showSearch?: boolean
  }
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
  ],
})

export default router
