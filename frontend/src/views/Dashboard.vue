<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 顶部导航 -->
    <nav class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">OpenLit</h1>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-gray-700 dark:text-gray-300">{{ user?.username }}</span>
            <button
              @click="handleLogout"
              class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              退出
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">我的作品</h2>
          <button
            @click="showCreateModal = true"
            class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            新建作品
          </button>
        </div>

        <!-- 作品列表 -->
        <div v-if="loading" class="text-center py-12">
          <div class="text-gray-500">加载中...</div>
        </div>

        <div v-else-if="works.length === 0" class="text-center py-12">
          <div class="text-gray-500 dark:text-gray-400">
            还没有作品，点击"新建作品"开始创作吧！
          </div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="work in works"
            :key="work.id"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            @click="openWork(work.id)"
          >
            <div v-if="work.cover_image" class="aspect-w-16 aspect-h-9 mb-4">
              <img :src="work.cover_image" :alt="work.title" class="w-full h-48 object-cover rounded-t-lg" />
            </div>
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">{{ work.title }}</h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{{ work.description || '暂无描述' }}</p>
              <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{{ work.views || 0 }} 次阅读</span>
                <span>{{ formatDate(work.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建作品模态框 -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">新建作品</h3>
        <form @submit.prevent="handleCreateWork">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">作品标题</label>
            <input
              v-model="newWork.title"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="输入作品标题"
            />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">作品描述</label>
            <textarea
              v-model="newWork.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="输入作品描述（可选）"
            ></textarea>
          </div>
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="showCreateModal = false"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="creating"
              class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {{ creating ? '创建中...' : '创建' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../services/api'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const user = userStore.user
const works = ref<any[]>([])
const loading = ref(true)
const showCreateModal = ref(false)
const creating = ref(false)

const newWork = ref({
  title: '',
  description: '',
})

async function loadWorks() {
  loading.value = true
  try {
    const response: any = await api.getWorks()
    works.value = response.works || []
  } catch (error) {
    console.error('加载作品失败:', error)
  } finally {
    loading.value = false
  }
}

async function handleCreateWork() {
  creating.value = true
  try {
    const response: any = await api.createWork({
      title: newWork.value.title,
      description: newWork.value.description,
    })

    if (response.success) {
      showCreateModal.value = false
      newWork.value = { title: '', description: '' }
      await loadWorks()
    }
  } catch (error: any) {
    alert(error.message || '创建作品失败')
  } finally {
    creating.value = false
  }
}

function openWork(workId: string) {
  router.push(`/works/${workId}`)
}

function handleLogout() {
  userStore.logout()
  localStorage.removeItem('user')
  router.push('/login')
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadWorks()
})
</script>