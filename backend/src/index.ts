import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
  STORAGE: R2Bucket
  ENVIRONMENT: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS 配置
app.use('*', cors({
  origin: '*',
  credentials: true,
}))

// 健康检查
app.get('/', (c) => {
  return c.json({
    name: 'OpenLit API',
    version: '1.0.0',
    environment: c.env.ENVIRONMENT,
    status: 'ok',
  })
})

// API 路由
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 用户路由
app.get('/api/users', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT id, username, email, avatar, role FROM users').all()
    return c.json({ success: true, data: result.results })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch users' }, 500)
  }
})

// 作品路由
app.get('/api/works', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT * FROM works ORDER BY created_at DESC').all()
    return c.json({ success: true, data: result.results })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch works' }, 500)
  }
})

// 创建作品
app.post('/api/works', async (c) => {
  try {
    const { title, description, author_id } = await c.req.json()
    const result = await c.env.DB.prepare(
      'INSERT INTO works (title, description, author_id) VALUES (?, ?, ?)'
    ).bind(title, description, author_id).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to create work' }, 500)
  }
})

export default app