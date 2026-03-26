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

// 创建笔记
app.post('/', async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const { work_id, chapter_id, content, position } = body

    if (!work_id || !chapter_id || !content) {
      return c.json({ error: 'work_id, chapter_id and content are required' }, 400)
    }

    const noteId = generateId()
    await c.env.DB.prepare(
      'INSERT INTO notes (id, user_id, work_id, chapter_id, content, position) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(noteId, user.userId, work_id, chapter_id, content, position || 0).run()

    const note = await c.env.DB.prepare(
      'SELECT * FROM notes WHERE id = ?'
    ).bind(noteId).first()

    return c.json({ success: true, note })
  } catch (error) {
    console.error('Create note error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 获取用户所有笔记
app.get('/', async (c) => {
  try {
    const user = c.get('user')
    const { work_id, chapter_id } = c.req.query()

    let query = 'SELECT n.*, w.title as work_title, c.title as chapter_title FROM notes n JOIN works w ON n.work_id = w.id JOIN chapters c ON n.chapter_id = c.id WHERE n.user_id = ?'
    const params: any[] = [user.userId]

    if (work_id) {
      query += ' AND n.work_id = ?'
      params.push(work_id)
    }

    if (chapter_id) {
      query += ' AND n.chapter_id = ?'
      params.push(chapter_id)
    }

    query += ' ORDER BY n.created_at DESC'

    const result = await c.env.DB.prepare(query).bind(...params).all()

    return c.json({ success: true, notes: result.results })
  } catch (error) {
    console.error('Get notes error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 更新笔记
app.put('/:id', async (c) => {
  try {
    const user = c.get('user')
    const noteId = c.req.param('id')
    const body = await c.req.json()
    const { content } = body

    if (!content) {
      return c.json({ error: 'content is required' }, 400)
    }

    // 验证笔记属于当前用户
    const note = await c.env.DB.prepare(
      'SELECT * FROM notes WHERE id = ? AND user_id = ?'
    ).bind(noteId, user.userId).first()

    if (!note) {
      return c.json({ error: 'Note not found or unauthorized' }, 404)
    }

    await c.env.DB.prepare(
      'UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(content, noteId).run()

    const updatedNote = await c.env.DB.prepare(
      'SELECT * FROM notes WHERE id = ?'
    ).bind(noteId).first()

    return c.json({ success: true, note: updatedNote })
  } catch (error) {
    console.error('Update note error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 删除笔记
app.delete('/:id', async (c) => {
  try {
    const user = c.get('user')
    const noteId = c.req.param('id')

    // 验证笔记属于当前用户
    const note = await c.env.DB.prepare(
      'SELECT * FROM notes WHERE id = ? AND user_id = ?'
    ).bind(noteId, user.userId).first()

    if (!note) {
      return c.json({ error: 'Note not found or unauthorized' }, 404)
    }

    await c.env.DB.prepare(
      'DELETE FROM notes WHERE id = ?'
    ).bind(noteId).run()

    return c.json({ success: true, message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Delete note error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default app