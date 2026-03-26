import { Hono } from 'hono'
import { z } from 'zod'
import { generateId, verifyToken } from '../utils/auth'

type Bindings = {
  DB: D1Database
  STORAGE: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

// 验证中间件
app.use('/*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.substring(7)
  const payload = verifyToken(token)
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  c.set('user', payload)
  await next()
})

// 创建书签
app.post('/', async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const { work_id, chapter_id, position, note } = body

    if (!work_id || !chapter_id) {
      return c.json({ error: 'work_id and chapter_id are required' }, 400)
    }

    // 检查是否已存在书签
    const existing = await c.env.DB.prepare(
      'SELECT id FROM bookmarks WHERE user_id = ? AND chapter_id = ?'
    ).bind(user.userId, chapter_id).first()

    if (existing) {
      return c.json({ error: 'Bookmark already exists for this chapter' }, 400)
    }

    const bookmarkId = generateId()
    await c.env.DB.prepare(
      'INSERT INTO bookmarks (id, user_id, work_id, chapter_id, position, note) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(bookmarkId, user.userId, work_id, chapter_id, position || 0, note || '').run()

    const bookmark = await c.env.DB.prepare(
      'SELECT * FROM bookmarks WHERE id = ?'
    ).bind(bookmarkId).first()

    return c.json({ success: true, bookmark })
  } catch (error) {
    console.error('Create bookmark error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 获取用户所有书签
app.get('/', async (c) => {
  try {
    const user = c.get('user')
    const result = await c.env.DB.prepare(
      'SELECT b.*, w.title as work_title, c.title as chapter_title FROM bookmarks b JOIN works w ON b.work_id = w.id JOIN chapters c ON b.chapter_id = c.id WHERE b.user_id = ? ORDER BY b.created_at DESC'
    ).bind(user.userId).all()

    return c.json({ success: true, bookmarks: result.results })
  } catch (error) {
    console.error('Get bookmarks error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 删除书签
app.delete('/:id', async (c) => {
  try {
    const user = c.get('user')
    const bookmarkId = c.req.param('id')

    // 验证书签属于当前用户
    const bookmark = await c.env.DB.prepare(
      'SELECT * FROM bookmarks WHERE id = ? AND user_id = ?'
    ).bind(bookmarkId, user.userId).first()

    if (!bookmark) {
      return c.json({ error: 'Bookmark not found or unauthorized' }, 404)
    }

    await c.env.DB.prepare(
      'DELETE FROM bookmarks WHERE id = ?'
    ).bind(bookmarkId).run()

    return c.json({ success: true, message: 'Bookmark deleted successfully' })
  } catch (error) {
    console.error('Delete bookmark error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default app