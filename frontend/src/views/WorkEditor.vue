<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 顶部导航 -->
    <nav class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-4">
            <button
              @click="router.push('/dashboard')"
              class="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              ← 返回
            </button>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ work?.title }}</h1>
          </div>
          <div class="flex items-center space-x-4">
            <button
              @click="showCreateChapterModal = true"
              class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
            >
              新建章节
            </button>
            <button
              @click="router.push('/dashboard')"
              class="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm"
            >
              退出
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="flex h-[calc(100vh-4rem)]">
        <!-- 章节列表侧边栏 -->
        <div class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div class="p-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">章节列表</h3>
            <div v-if="loadingChapters" class="text-center py-4 text-gray-500">
              加载中...
            </div>
            <div v-else-if="chapters.length === 0" class="text-center py-4 text-gray-500">
              还没有章节
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="chapter in chapters"
                :key="chapter.id"
                @click="selectChapter(chapter)"
                :class="[
                  'p-3 rounded cursor-pointer transition-colors',
                  selectedChapterId === chapter.id
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                ]"
              >
                <div class="font-medium">{{ chapter.title }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ chapter.word_count }} 字
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 编辑器区域 -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="!selectedChapter" class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div class="text-center">
              <div class="text-xl mb-2">选择或创建一个章节开始编辑</div>
            </div>
          </div>
          <div v-else class="p-6">
            <div class="mb-4">
              <input
                v-model="editingChapter.title"
                type="text"
                class="text-2xl font-bold w-full border-b-2 border-gray-200 dark:border-gray-700 focus:border-indigo-500 outline-none pb-2 bg-transparent dark:text-white"
                placeholder="章节标题"
                @input="autoSave"
              />
            </div>
            <Editor
              v-model="editingChapter.content"
              placeholder="开始写作..."
              class="min-h-[500px]"
            />
            <div class="mt-4 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
              <span>{{ wordCount }} 字</span>
              <span v-if="saveStatus">{{ saveStatus }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建章节模态框 -->
    <div v-if="showCreateChapterModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">新建章节</h3>
        <form @submit.prevent="handleCreateChapter">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">章节标题</label>
            <input
              v-model="newChapter.title"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="输入章节标题"
            />
          </div>
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="showCreateChapterModal = false"
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../services/api'
import Editor from '../components/Editor.vue'

const route = useRoute()
const router = useRouter()

const workId = route.params.id as string
const work = ref<any>(null)
const chapters = ref<any[]>([])
const loadingChapters = ref(true)
const selectedChapter = ref<any>(null)
const selectedChapterId = ref<string | null>(null)
const editingChapter = ref({ title: '', content: '' })
const showCreateChapterModal = ref(false)
const creating = ref(false)
const newChapter = ref({ title: '' })
const saveStatus = ref('')

const wordCount = computed(() => {
  if (!editingChapter.value.content) return 0
  return editingChapter.value.content.replace(/<[^>]*>/g, '').length
})

let autoSaveTimer: number | null = null

async function loadWork() {
  try {
    const response: any = await api.getWork(workId)
    work.value = response.work
  } catch (error) {
    console.error('加载作品失败:', error)
  }
}

async function loadChapters() {
  loadingChapters.value = true
  try {
    const response: any = await api.getChapters(workId)
    chapters.value = response.chapters || []
  } catch (error) {
    console.error('加载章节失败:', error)
  } finally {
    loadingChapters.value = false
  }
}

async function selectChapter(chapter: any) {
  try {
    const response: any = await api.getChapter(workId, chapter.id)
    selectedChapter.value = response.chapter
    selectedChapterId.value = chapter.id
    editingChapter.value = {
      title: response.chapter.title,
      content: response.chapter.content,
    }
  } catch (error) {
    console.error('加载章节内容失败:', error)
  }
}

async function handleCreateChapter() {
  creating.value = true
  try {
    const response: any = await api.createChapter(workId, {
      title: newChapter.value.title,
      content: '',
    })

    if (response.success) {
      showCreateChapterModal.value = false
      newChapter.value = { title: '' }
      await loadChapters()
      await selectChapter(response.chapter)
    }
  } catch (error: any) {
    alert(error.message || '创建章节失败')
  } finally {
    creating.value = false
  }
}

function autoSave() {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  
  saveStatus.value = '输入中...'
  
  autoSaveTimer = window.setTimeout(async () => {
    await saveChapter()
  }, 2000)
}

async function saveChapter() {
  if (!selectedChapter.value) return

  saveStatus.value = '保存中...'

  try {
    await api.updateChapter(workId, selectedChapter.value.id, {
      title: editingChapter.value.title,
      content: editingChapter.value.content,
    })
    saveStatus.value = '已保存'
    
    setTimeout(() => {
      if (saveStatus.value === '已保存') {
        saveStatus.value = ''
      }
    }, 2000)
  } catch (error) {
    console.error('保存失败:', error)
    saveStatus.value = '保存失败'
  }
}

watch(() => editingChapter.value.content, () => {
  autoSave()
})

onMounted(() => {
  loadWork()
  loadChapters()
})
</script>