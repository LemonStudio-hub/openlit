import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/Register.vue'),
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/works/:id',
      name: 'WorkEditor',
      component: () => import('../views/WorkEditor.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/read/:workId/:chapterId',
      name: 'Reader',
      component: () => import('../views/Reader.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    // 检查本地存储
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      userStore.setUser(JSON.parse(storedUser))
      userStore.loadFromStorage()
      next()
    } else {
      next('/login')
    }
  } else if ((to.path === '/login' || to.path === '/register') && userStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router