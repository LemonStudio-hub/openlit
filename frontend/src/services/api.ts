const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  token?: string
  user?: any
  works?: any
  work?: any
  chapters?: any
  chapter?: any
  message?: string
}

class ApiService {
  private getAuthHeader() {
    const token = localStorage.getItem('auth_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async request<T = ApiResponse>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const authHeader = this.getAuthHeader()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    }
    
    if (authHeader.Authorization) {
      headers.Authorization = authHeader.Authorization
    }

    try {
      const response = await fetch(url, { ...options, headers })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Request failed')
      }

      return data
    } catch (error) {
      console.error('API request error:', error)
      throw error
    }
  }

  // 认证 API
  async register(email: string, username: string, password: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    })
  }

  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async getMe() {
    return this.request('/api/auth/me')
  }

  async updateProfile(data: { username?: string; bio?: string; avatar?: string }) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // 作品 API
  async getWorks(params?: { status?: string }) {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return this.request(`/api/works${query}`)
  }

  async getWork(id: string) {
    return this.request(`/api/works/${id}`)
  }

  async createWork(data: { title: string; description?: string; cover_image?: string }) {
    return this.request('/api/works', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateWork(id: string, data: { title?: string; description?: string; cover_image?: string; status?: string }) {
    return this.request(`/api/works/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteWork(id: string) {
    return this.request(`/api/works/${id}`, {
      method: 'DELETE',
    })
  }

  // 章节 API
  async getChapters(workId: string) {
    return this.request(`/api/works/${workId}/chapters`)
  }

  async getChapter(workId: string, chapterId: string) {
    return this.request(`/api/works/${workId}/chapters/${chapterId}`)
  }

  async createChapter(workId: string, data: { title: string; content: string }) {
    return this.request(`/api/works/${workId}/chapters`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateChapter(workId: string, chapterId: string, data: { title?: string; content?: string }) {
    return this.request(`/api/works/${workId}/chapters/${chapterId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteChapter(workId: string, chapterId: string) {
    return this.request(`/api/works/${workId}/chapters/${chapterId}`, {
      method: 'DELETE',
    })
  }
}

export const api = new ApiService()