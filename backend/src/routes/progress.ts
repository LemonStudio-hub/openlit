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

// 更新或创建阅读进度
app.post('/', async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const { work_id, chapter_id, position, percentage } = body

    if (!work_id || !chapter_id) {
      return c.json({ error: 'work_id and chapter_id are required' }, 400)
    }

    // 检查是否已存在阅读进度
    const existing = await c.env.DB.prepare(
      'SELECT id FROM reading_progress WHERE user_id = ? AND work_id = ?'
    ).bind(user.userId, work_id).first()

    if (existing) {
      await c.env.DB.prepare(
        'UPDATE reading_progress SET chapter_id = ?, position = ?, percentage = ?, last_read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND work_id = ?'
      ).bind(chapter_id, position || 0, percentage || 0, user.userId, work_id).run()
    } else {
      const progressId = generateId()
      await c.env.DB.prepare(
        'INSERT INTO reading_progress (id, user_id, work_id, chapter_id, position, percentage) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(progressId, user.userId, work_id, chapter_id, position || 0, percentage || 0).run()
    }

    const progress = await c.env.DB.prepare(
      'SELECT * FROM reading_progress WHERE user_id = ? AND work_id = ?'
    ).bind(user.userId, work_id).first()

    return c.json({ success: true, progress })
  } catch (error) {
    console.error('Update progress error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 获取用户所有阅读进度
app.get('/', async (c) => {
  try {
    const user = c.get('user')

    const result = await c.env.DB.prepare(
      'SELECT p.*, w.title as work_title, w.cover_image, c.title as chapter_title FROM reading_progress p JOIN works w ON p.work_id = w.id JOIN chapters c ON p.chapter_id = c.id WHERE p.user_id = ? ORDER BY p.last_read_at DESC'
    ).bind(user.userId).all()

    return c.json({ success: true, progress: result.results })
  } catch (error) {
    console.error('Get progress error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 获取特定作品的阅读进度
app.get('/work/:workId', async (c) => {
  try {
    const user = c.get('user')
    const workId = c.req.param('workId')

    const progress = await c.env.DB.prepare(
      'SELECT * FROM reading_progress WHERE user_id = ? AND work_id = ?'
    ).bind(user.userId, workId).first()

    return c.json({ success: true, progress })
  } catch (error) {
    console.error('Get work progress error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default app