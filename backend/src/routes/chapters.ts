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

// 创建章节
app.post('/', async (c) => {
  try {
    const user = c.get('user')
    const workId = c.req.param('workId')
    const body = await c.req.json()
    const { title, content } = body

    if (!title || !content) {
      return c.json({ error: 'Title and content are required' }, 400)
    }

    // 验证作品属于当前用户
    const work = await c.env.DB.prepare(
      'SELECT * FROM works WHERE id = ? AND author_id = ?'
    ).bind(workId, user.userId).first()

    if (!work) {
      return c.json({ error: 'Work not found or unauthorized' }, 404)
    }

    // 获取当前章节数量
    const orderResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM chapters WHERE work_id = ?'
    ).bind(workId).first() as any
    const orderIndex = orderResult.count + 1

    // 计算字数
    const wordCount = content.replace(/<[^>]*>/g, '').length

    const chapterId = generateId()
    await c.env.DB.prepare(
      'INSERT INTO chapters (id, work_id, title, content, order_index, word_count) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(chapterId, workId, title, content, orderIndex, wordCount).run()

    // 更新作品的更新时间
    await c.env.DB.prepare(
      'UPDATE works SET updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(workId).run()

    const chapter = await c.env.DB.prepare(
      'SELECT * FROM chapters WHERE id = ?'
    ).bind(chapterId).first()

    return c.json({ success: true, chapter })
  } catch (error) {
    console.error('Create chapter error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 获取作品的所有章节
app.get('/', async (c) => {
  try {
    const workId = c.req.param('workId')

    const result = await c.env.DB.prepare(
      'SELECT id, title, order_index, word_count, created_at, updated_at FROM chapters WHERE work_id = ? ORDER BY order_index ASC'
    ).bind(workId).all()

    return c.json({ success: true, chapters: result.results })
  } catch (error) {
    console.error('Get chapters error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 获取单个章节
app.get('/:id', async (c) => {
  try {
    const workId = c.req.param('workId')
    const chapterId = c.req.param('id')

    const chapter = await c.env.DB.prepare(
      'SELECT * FROM chapters WHERE id = ? AND work_id = ?'
    ).bind(chapterId, workId).first()

    if (!chapter) {
      return c.json({ error: 'Chapter not found' }, 404)
    }

    return c.json({ success: true, chapter })
  } catch (error) {
    console.error('Get chapter error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 更新章节
app.put('/:id', async (c) => {
  try {
    const user = c.get('user')
    const workId = c.req.param('workId')
    const chapterId = c.req.param('id')
    const body = await c.req.json()
    const { title, content } = body

    // 验证作品属于当前用户
    const work = await c.env.DB.prepare(
      'SELECT * FROM works WHERE id = ? AND author_id = ?'
    ).bind(workId, user.userId).first()

    if (!work) {
      return c.json({ error: 'Work not found or unauthorized' }, 404)
    }

    const updates: string[] = []
    const params: any[] = []

    if (title) {
      updates.push('title = ?')
      params.push(title)
    }
    if (content !== undefined) {
      updates.push('content = ?')
      params.push(content)
      updates.push('word_count = ?')
      params.push(content.replace(/<[^>]*>/g, '').length)
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400)
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(chapterId)
    params.push(workId)

    await c.env.DB.prepare(
      `UPDATE chapters SET ${updates.join(', ')} WHERE id = ? AND work_id = ?`
    ).bind(...params).run()

    // 更新作品的更新时间
    await c.env.DB.prepare(
      'UPDATE works SET updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(workId).run()

    const chapter = await c.env.DB.prepare(
      'SELECT * FROM chapters WHERE id = ?'
    ).bind(chapterId).first()

    return c.json({ success: true, chapter })
  } catch (error) {
    console.error('Update chapter error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 删除章节
app.delete('/:id', async (c) => {
  try {
    const user = c.get('user')
    const workId = c.req.param('workId')
    const chapterId = c.req.param('id')

    // 验证作品属于当前用户
    const work = await c.env.DB.prepare(
      'SELECT * FROM works WHERE id = ? AND author_id = ?'
    ).bind(workId, user.userId).first()

    if (!work) {
      return c.json({ error: 'Work not found or unauthorized' }, 404)
    }

    await c.env.DB.prepare(
      'DELETE FROM chapters WHERE id = ? AND work_id = ?'
    ).bind(chapterId, workId).run()

    return c.json({ success: true, message: 'Chapter deleted successfully' })
  } catch (error) {
    console.error('Delete chapter error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default app