import { Hono } from 'hono'
import { z } from 'zod'
import { hashPassword, verifyPassword, generateToken, generateId, verifyToken } from '../utils/auth'

type Bindings = {
  DB: D1Database
  STORAGE: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

// 验证中间件
app.use('/protected/*', async (c, next) => {
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

// 注册请求体验证
const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(6),
})

// 登录请求体验证
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// 注册
app.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const validated = registerSchema.parse(body)

    // 检查邮箱是否已存在
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(validated.email).first()

    if (existingUser) {
      return c.json({ error: 'Email already exists' }, 400)
    }

    // 检查用户名是否已存在
    const existingUsername = await c.env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(validated.username).first()

    if (existingUsername) {
      return c.json({ error: 'Username already exists' }, 400)
    }

    // 哈希密码
    const passwordHash = await hashPassword(validated.password)

    // 创建用户
    const userId = generateId()
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, username, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, validated.email, validated.username, passwordHash, 'reader').run()

    // 生成 token
    const token = generateToken({
      userId,
      email: validated.email,
      role: 'reader',
    })

    // 获取用户信息
    const user = await c.env.DB.prepare(
      'SELECT id, email, username, avatar, role, bio FROM users WHERE id = ?'
    ).bind(userId).first()

    return c.json({
      success: true,
      token,
      user,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', details: error.errors }, 400)
    }
    console.error('Register error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 登录
app.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const validated = loginSchema.parse(body)

    // 查找用户
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(validated.email).first() as any

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // 验证密码
    const isValid = await verifyPassword(validated.password, user.password_hash)
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // 生成 token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // 返回用户信息（不包含密码）
    const { password_hash, ...userInfo } = user

    return c.json({
      success: true,
      token,
      user: userInfo,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', details: error.errors }, 400)
    }
    console.error('Login error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// 获取当前用户信息
app.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.substring(7)
  const payload = verifyToken(token)
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  const user = await c.env.DB.prepare(
    'SELECT id, email, username, avatar, role, bio, created_at FROM users WHERE id = ?'
  ).bind(payload.userId).first()

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({ success: true, user })
})

// 更新用户资料
app.put('/profile', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.substring(7)
  const payload = verifyToken(token)
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  try {
    const body = await c.req.json()
    const { username, bio, avatar } = body

    const updates: string[] = []
    const params: any[] = []

    if (username) {
      updates.push('username = ?')
      params.push(username)
    }
    if (bio !== undefined) {
      updates.push('bio = ?')
      params.push(bio)
    }
    if (avatar) {
      updates.push('avatar = ?')
      params.push(avatar)
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400)
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(payload.userId)

    await c.env.DB.prepare(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run()

    const user = await c.env.DB.prepare(
      'SELECT id, email, username, avatar, role, bio FROM users WHERE id = ?'
    ).bind(payload.userId).first()

    return c.json({ success: true, user })
  } catch (error) {
    console.error('Update profile error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default app