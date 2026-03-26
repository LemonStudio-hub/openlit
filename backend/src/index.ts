import { Hono } from 'hono'
import { cors } from 'hono/cors'
import userRoutes from './routes/users'
import workRoutes from './routes/works'

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

// 挂载路由
app.route('/api/auth', userRoutes)
app.route('/api/works', workRoutes)

export default app