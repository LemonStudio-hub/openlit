import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: string
  email: string
  username: string
  avatar?: string
  role: 'reader' | 'author' | 'admin'
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const isAuthor = computed(() => user.value?.role === 'author' || user.value?.role === 'admin')
  const isAdmin = computed(() => user.value?.role === 'admin')

  function setUser(userData: User) {
    user.value = userData
  }

  function setToken(authToken: string) {
    token.value = authToken
    localStorage.setItem('auth_token', authToken)
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
  }

  function loadFromStorage() {
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      token.value = storedToken
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isAuthor,
    isAdmin,
    setUser,
    setToken,
    logout,
    loadFromStorage,
  }
})