import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('system')

  function setTheme(newTheme: Theme) {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  function applyTheme(currentTheme: Theme) {
    const root = document.documentElement
    if (currentTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    } else {
      root.classList.toggle('dark', currentTheme === 'dark')
    }
  }

  function loadFromStorage() {
    const storedTheme = localStorage.getItem('theme') as Theme
    if (storedTheme) {
      theme.value = storedTheme
      applyTheme(storedTheme)
    }
  }

  return {
    theme,
    setTheme,
    loadFromStorage,
  }
})