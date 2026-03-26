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

// 创建作品
app.post('/', async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const { title, description, cover_image } = body

    if (!title) {
      return c.json({ error: 'Title is required' }, 400)
    }

    const workId = generateId()
    await c.env.DB.prepare(
      'INSERT INTO works (id, title, description, cover_image, author_id) VALUES (?, ?, ?, ?, ?)'
    ).bind(workId, title, description || '', cover_image || '', user.userId).run()

    const work = await c.env.DB.prepare(
      'SELECT * FROM works WHERE id = ?'
    ).bind(workId).first()

    return c.json({ success: true, work })
  } catch (error) {
    console.error('Create work error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 获取所有作品
app.get('/', async (c) => {
  try {
    const { status } = c.req.query()
    let query = 'SELECT * FROM works ORDER BY created_at DESC'
    const params: any[] = []

    if (status) {
      query += ' WHERE status = ?'
      params.push(status)
    }

    const result = await c.env.DB.prepare(query).bind(...params).all()
    return c.json({ success: true, works: result.results })
  } catch (error) {
    console.error('Get works error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 获取单个作品
app.get('/:id', async (c) => {
  try {
    const workId = c.req.param('id')
    const work = await c.env.DB.prepare(
      'SELECT * FROM works WHERE id = ?'
    ).bind(workId).first()

    if (!work) {
      return c.json({ error: 'Work not found' }, 404)
    }

    // 增加浏览量
    await c.env.DB.prepare(
      'UPDATE works SET views = views + 1 WHERE id = ?'
    ).bind(workId).run()

    return c.json({ success: true, work })
  } catch (error) {
    console.error('Get work error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 更新作品
app.put('/:id', async (c) => {
  try {
    const user = c.get('user')
    const workId = c.req.param('id')
    const body = await c.req.json()
    const { title, description, cover_image, status } = body

    // 检查作品是否存在且属于当前用户
    const existingWork = await c.env.DB.prepare(
      'SELECT * FROM works WHERE id = ? AND author_id = ?'
    ).bind(workId, user.userId).first() as any

    if (!existingWork) {
      return c.json({ error: 'Work not found or unauthorized' }, 404)
    }

    const updates: string[] = []
    const params: any[] = []

    if (title) {
      updates.push('title = ?')
      params.push(title)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      params.push(description)
    }
    if (cover_image !== undefined) {
      updates.push('cover_image = ?')
      params.push(cover_image)
    }
    if (status) {
      updates.push('status = ?')
      params.push(status)
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400)
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(workId)

    await c.env.DB.prepare(
      `UPDATE works SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run()

    const work = await c.env.DB.prepare(
      'SELECT * FROM works WHERE id = ?'
    ).bind(workId).first()

    return c.json({ success: true, work })
  } catch (error) {
    console.error('Update work error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 删除作品
app.delete('/:id', async (c) => {
  try {
    const user = c.get('user')
    const workId = c.req.param('id')

    // 检查作品是否存在且属于当前用户
    const existingWork = await c.env.DB.prepare(
      'SELECT * FROM works WHERE id = ? AND author_id = ?'
    ).bind(workId, user.userId).first()

    if (!existingWork) {
      return c.json({ error: 'Work not found or unauthorized' }, 404)
    }

    await c.env.DB.prepare(
      'DELETE FROM works WHERE id = ?'
    ).bind(workId).run()

    return c.json({ success: true, message: 'Work deleted successfully' })
  } catch (error) {
    console.error('Delete work error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 章节路由嵌套
import chapterRoutes from './chapters'
app.route('/:workId/chapters', chapterRoutes)

export default app