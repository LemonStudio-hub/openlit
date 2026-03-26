import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type FontFamily = 'serif' | 'sans-serif' | 'monospace'
export type ThemeMode = 'light' | 'dark' | 'sepia'

export interface ReaderSettings {
  fontFamily: FontFamily
  fontSize: number
  lineHeight: number
  theme: ThemeMode
}

export interface Bookmark {
  id: string
  chapterId: string
  position: number
  note?: string
  createdAt: string
}

export interface Note {
  id: string
  chapterId: string
  content: string
  position: number
  createdAt: string
  updatedAt: string
}

export const useReaderStore = defineStore('reader', () => {
  const settings = ref<ReaderSettings>({
    fontFamily: 'serif',
    fontSize: 18,
    lineHeight: 1.8,
    theme: 'light',
  })

  const bookmarks = ref<Bookmark[]>([])
  const notes = ref<Note[]>([])
  const currentChapterId = ref<string | null>(null)
  const currentScrollPosition = ref(0)

  const currentBookmark = computed(() => {
    if (!currentChapterId.value) return undefined
    return bookmarks.value.find(b => b.chapterId === currentChapterId.value)
  })

  const chapterNotes = computed(() => {
    if (!currentChapterId.value) return []
    return notes.value.filter(n => n.chapterId === currentChapterId.value)
  })

  function updateSettings(newSettings: Partial<ReaderSettings>) {
    settings.value = { ...settings.value, ...newSettings }
    localStorage.setItem('reader-settings', JSON.stringify(settings.value))
  }

  function loadSettings() {
    const stored = localStorage.getItem('reader-settings')
    if (stored) {
      settings.value = JSON.parse(stored)
    }
  }

  function setBookmarks(newBookmarks: Bookmark[]) {
    bookmarks.value = newBookmarks
  }

  function setNotes(newNotes: Note[]) {
    notes.value = newNotes
  }

  function addBookmark(bookmark: Bookmark) {
    bookmarks.value.push(bookmark)
  }

  function removeBookmark(bookmarkId: string) {
    bookmarks.value = bookmarks.value.filter(b => b.id !== bookmarkId)
  }

  function addNote(note: Note) {
    notes.value.push(note)
  }

  function updateNote(noteId: string, content: string) {
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      note.content = content
      note.updatedAt = new Date().toISOString()
    }
  }

  function removeNote(noteId: string) {
    notes.value = notes.value.filter(n => n.id !== noteId)
  }

  function setCurrentChapter(chapterId: string) {
    currentChapterId.value = chapterId
  }

  function setCurrentScrollPosition(position: number) {
    currentScrollPosition.value = position
  }

  return {
    settings,
    bookmarks,
    notes,
    currentChapterId,
    currentScrollPosition,
    currentBookmark,
    chapterNotes,
    updateSettings,
    loadSettings,
    setBookmarks,
    setNotes,
    addBookmark,
    removeBookmark,
    addNote,
    updateNote,
    removeNote,
    setCurrentChapter,
    setCurrentScrollPosition,
  }
})