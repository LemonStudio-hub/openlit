<template>
  <div class="min-h-screen transition-colors duration-300" :class="themeClasses">
    <!-- 顶部导航 -->
    <nav class="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40" :class="navThemeClasses">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-14 items-center">
          <div class="flex items-center space-x-4">
            <button
              @click="router.back()"
              class="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              ← 返回
            </button>
            <h1 class="text-lg font-bold truncate max-w-xs">{{ work?.title }}</h1>
          </div>
          <div class="flex items-center space-x-3">
            <button
              @click="toggleBookmark"
              class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              :title="isBookmarked ? '移除书签' : '添加书签'"
            >
              <svg v-if="isBookmarked" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <button
              @click="showSettings = true"
              class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="阅读设置"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              @click="showNotes = true"
              class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative"
              title="笔记"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span v-if="chapterNotes.length > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {{ chapterNotes.length }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- 章节导航 -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" :class="navThemeClasses">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-12">
          <button
            @click="prevChapter"
            :disabled="!hasPrevChapter"
            class="text-sm px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← 上一章
          </button>
          <span class="text-sm font-medium">{{ currentChapter?.title }}</span>
          <button
            @click="nextChapter"
            :disabled="!hasNextChapter"
            class="text-sm px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一章 →
          </button>
        </div>
      </div>
    </div>

    <!-- 阅读内容 -->
    <div
      ref="readerContent"
      class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-7rem)]"
      :style="readerStyle"
      @scroll="handleScroll"
    >
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p class="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>

      <div v-else-if="currentChapter" class="reader-content">
        <h2 class="text-3xl font-bold mb-8 text-center">{{ currentChapter.title }}</h2>
        <div
          class="prose prose-lg max-w-none"
          :class="proseThemeClasses"
          v-html="currentChapter.content"
        ></div>
      </div>

      <!-- 阅读进度指示器 -->
      <div class="fixed bottom-0 left-0 right-0 bg-gray-200 dark:bg-gray-700 h-1" :class="navThemeClasses">
        <div
          class="bg-indigo-600 h-1 transition-all duration-300"
          :style="{ width: `${scrollProgress}%` }"
        ></div>
      </div>
    </div>

    <!-- 阅读设置面板 -->
    <div v-if="showSettings" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showSettings = false">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">阅读设置</h3>
          <button @click="showSettings = false" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-6">
          <!-- 主题 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">主题</label>
            <div class="grid grid-cols-3 gap-3">
              <button
                @click="updateSettings({ theme: 'light' })"
                :class="[
                  'p-3 rounded-lg border-2 transition-colors',
                  settings.theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                ]"
              >
                <div class="w-full h-12 bg-white rounded border border-gray-300 mb-2"></div>
                <span class="text-sm text-gray-700 dark:text-gray-300">浅色</span>
              </button>
              <button
                @click="updateSettings({ theme: 'dark' })"
                :class="[
                  'p-3 rounded-lg border-2 transition-colors',
                  settings.theme === 'dark'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                ]"
              >
                <div class="w-full h-12 bg-gray-800 rounded border border-gray-600 mb-2"></div>
                <span class="text-sm text-gray-700 dark:text-gray-300">深色</span>
              </button>
              <button
                @click="updateSettings({ theme: 'sepia' })"
                :class="[
                  'p-3 rounded-lg border-2 transition-colors',
                  settings.theme === 'sepia'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                ]"
              >
                <div class="w-full h-12 bg-amber-50 rounded border border-amber-200 mb-2"></div>
                <span class="text-sm text-gray-700 dark:text-gray-300">护眼</span>
              </button>
            </div>
          </div>

          <!-- 字体 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">字体</label>
            <div class="grid grid-cols-3 gap-3">
              <button
                @click="updateSettings({ fontFamily: 'serif' })"
                :class="[
                  'p-3 rounded-lg border-2 transition-colors',
                  settings.fontFamily === 'serif'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                ]"
              >
                <span class="text-lg" style="font-family: serif">衬线</span>
              </button>
              <button
                @click="updateSettings({ fontFamily: 'sans-serif' })"
                :class="[
                  'p-3 rounded-lg border-2 transition-colors',
                  settings.fontFamily === 'sans-serif'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                ]"
              >
                <span class="text-lg" style="font-family: sans-serif">无衬线</span>
              </button>
              <button
                @click="updateSettings({ fontFamily: 'monospace' })"
                :class="[
                  'p-3 rounded-lg border-2 transition-colors',
                  settings.fontFamily === 'monospace'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                ]"
              >
                <span class="text-lg" style="font-family: monospace">等宽</span>
              </button>
            </div>
          </div>

          <!-- 字号 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              字号: {{ settings.fontSize }}px
            </label>
            <input
              type="range"
              :value="settings.fontSize"
              @input="updateSettings({ fontSize: parseInt(($event.target as HTMLInputElement).value) })"
              min="14"
              max="28"
              step="1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>

          <!-- 行高 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              行高: {{ settings.lineHeight }}
            </label>
            <input
              type="range"
              :value="settings.lineHeight"
              @input="updateSettings({ lineHeight: parseFloat(($event.target as HTMLInputElement).value) })"
              min="1.4"
              max="2.4"
              step="0.1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 笔记面板 -->
    <div v-if="showNotes" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showNotes = false">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">笔记</h3>
          <button @click="showNotes = false" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto mb-4 space-y-4">
          <div v-if="chapterNotes.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            还没有笔记，选中文字后可以添加笔记
          </div>
          <div v-for="note in chapterNotes" :key="note.id" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <textarea
              :value="note.content"
              @input="updateNoteContent(note.id, ($event.target as HTMLTextAreaElement).value)"
              class="w-full bg-transparent border-none resize-none focus:outline-none text-gray-700 dark:text-gray-300"
              rows="3"
              placeholder="添加笔记..."
            ></textarea>
            <div class="flex justify-between items-center mt-2">
              <span class="text-xs text-gray-500">{{ formatDate(note.updatedAt) }}</span>
              <button
                @click="deleteNote(note.id)"
                class="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                删除
              </button>
            </div>
          </div>
        </div>

        <button
          @click="addQuickNote"
          class="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          添加笔记
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../services/api'
import { useReaderStore } from '../stores/reader'

const route = useRoute()
const router = useRouter()
const readerStore = useReaderStore()

const workId = route.params.workId as string
const chapterId = route.params.chapterId as string

const work = ref<any>(null)
const chapters = ref<any[]>([])
const currentChapter = ref<any>(null)
const loading = ref(true)
const showSettings = ref(false)
const showNotes = ref(false)
const readerContent = ref<HTMLElement | null>(null)
const scrollProgress = ref(0)
const currentScrollPosition = ref(0)

const { settings, currentBookmark, chapterNotes, updateSettings, addBookmark, removeBookmark, addNote, updateNote, removeNote, setCurrentChapter, setCurrentScrollPosition } = readerStore

const isBookmarked = computed(() => !!currentBookmark)

const hasPrevChapter = computed(() => {
  if (!currentChapter.value || !chapters.value.length) return false
  const currentIndex = chapters.value.findIndex(c => c.id === currentChapter.value.id)
  return currentIndex > 0
})

const hasNextChapter = computed(() => {
  if (!currentChapter.value || !chapters.value.length) return false
  const currentIndex = chapters.value.findIndex(c => c.id === currentChapter.value.id)
  return currentIndex < chapters.value.length - 1
})

const themeClasses = computed(() => {
  const themes = {
    light: 'bg-gray-50',
    dark: 'bg-gray-900',
    sepia: 'bg-amber-50',
  }
  return themes[settings.theme]
})

const navThemeClasses = computed(() => {
  const themes = {
    light: '',
    dark: 'dark',
    sepia: '',
  }
  return themes[settings.theme]
})

const proseThemeClasses = computed(() => {
  const themes = {
    light: 'prose-gray',
    dark: 'dark:prose-invert',
    sepia: 'prose-amber',
  }
  return themes[settings.theme]
})

const readerStyle = computed(() => ({
  fontFamily: settings.fontFamily,
  fontSize: `${settings.fontSize}px`,
  lineHeight: settings.lineHeight,
}))

async function loadData() {
  loading.value = true
  try {
    const [workResponse, chaptersResponse, chapterResponse, bookmarksResponse, notesResponse] = await Promise.all([
      api.getWork(workId),
      api.getChapters(workId),
      api.getChapter(workId, chapterId),
      api.getBookmarks(),
      api.getNotes({ work_id: workId, chapter_id: chapterId }),
    ])

    work.value = workResponse.work
    chapters.value = chaptersResponse.chapters || []
    currentChapter.value = chapterResponse.chapter
    setCurrentChapter(chapterId)
    
    // 更新书签和笔记
    readerStore.setBookmarks((bookmarksResponse as any).bookmarks || [])
    readerStore.setNotes((notesResponse as any).notes || [])
  } catch (error) {
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}

function prevChapter() {
  if (!hasPrevChapter.value) return
  const currentIndex = chapters.value.findIndex(c => c.id === currentChapter.value.id)
  const prevChapter = chapters.value[currentIndex - 1]
  router.push(`/read/${workId}/${prevChapter.id}`)
}

function nextChapter() {
  if (!hasNextChapter.value) return
  const currentIndex = chapters.value.findIndex(c => c.id === currentChapter.value.id)
  const nextChapter = chapters.value[currentIndex + 1]
  router.push(`/read/${workId}/${nextChapter.id}`)
}

function handleScroll() {
  if (!readerContent.value) return
  const element = readerContent.value
  const scrollPosition = element.scrollTop
  const scrollHeight = element.scrollHeight - element.clientHeight
  scrollProgress.value = (scrollPosition / scrollHeight) * 100
  currentScrollPosition.value = scrollPosition
  setCurrentScrollPosition(scrollPosition)
}

async function toggleBookmark() {
  const bookmark = currentBookmark
  if (isBookmarked.value && bookmark) {
    try {
      await api.deleteBookmark(bookmark.id)
      removeBookmark(bookmark.id)
    } catch (error: any) {
      alert(error.message || '删除书签失败')
    }
  } else if (currentChapter.value) {
    try {
      const response: any = await api.createBookmark({
        work_id: workId,
        chapter_id: currentChapter.value.id,
        position: currentScrollPosition.value,
      })
      if (response.success) {
        addBookmark(response.bookmark)
      }
    } catch (error: any) {
      alert(error.message || '添加书签失败')
    }
  }
}

async function addQuickNote() {
  if (!currentChapter.value) return
  try {
    const response: any = await api.createNote({
      work_id: workId,
      chapter_id: currentChapter.value.id,
      content: '',
      position: currentScrollPosition.value,
    })
    if (response.success) {
      addNote(response.note)
    }
  } catch (error: any) {
    alert(error.message || '添加笔记失败')
  }
}

async function updateNoteContent(noteId: string, content: string) {
  updateNote(noteId, content)
  try {
    await api.updateNote(noteId, content)
  } catch (error: any) {
    console.error('更新笔记失败:', error)
  }
}

async function deleteNote(noteId: string) {
  try {
    await api.deleteNote(noteId)
    removeNote(noteId)
  } catch (error: any) {
    alert(error.message || '删除笔记失败')
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

let saveProgressTimer: number | null = null

async function saveProgress() {
  try {
    await api.updateProgress({
      work_id: workId,
      chapter_id: chapterId,
      position: currentScrollPosition.value,
      percentage: scrollProgress.value,
    })
  } catch (error) {
    console.error('保存阅读进度失败:', error)
  }
}

watch(scrollProgress, () => {
  if (saveProgressTimer) {
    clearTimeout(saveProgressTimer)
  }
  saveProgressTimer = window.setTimeout(() => {
    saveProgress()
  }, 2000)
})

onMounted(() => {
  readerStore.loadSettings()
  loadData()
})

onUnmounted(() => {
  if (saveProgressTimer) {
    clearTimeout(saveProgressTimer)
  }
  saveProgress()
})

watch(() => route.params.chapterId, () => {
  loadData()
  if (readerContent.value) {
    readerContent.value.scrollTop = 0
  }
})
</script>

<style scoped>
.reader-content :deep(p) {
  margin-bottom: 1.5em;
  text-indent: 2em;
}

.reader-content :deep(h1),
.reader-content :deep(h2),
.reader-content :deep(h3) {
  margin: 2em 0 1em;
  text-indent: 0;
}

.reader-content :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 2em auto;
}

.prose-gray {
  --tw-prose-body: #374151;
  --tw-prose-headings: #111827;
}

.dark .prose-invert {
  --tw-prose-body: #d1d5db;
  --tw-prose-headings: #f3f4f6;
}

.prose-amber {
  --tw-prose-body: #78350f;
  --tw-prose-headings: #451a03;
}
</style>