# OpenLit 开发指南

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Cloudflare 账户（用于部署）

## 快速开始

### 1. 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

### 2. 配置环境变量

```bash
# 前端配置
cd frontend
cp .env.example .env
# 编辑 .env 文件，设置 API 地址

# 后端配置
cd ../backend
cp .env.example .env
# 编辑 .env 文件，设置 Cloudflare 凭证
```

### 3. 启动开发服务器

#### 方式一：使用启动脚本（推荐）

```bash
# 在项目根目录
./start.sh
```

#### 方式二：分别启动

```bash
# 启动后端
cd backend
npm run dev

# 启动前端（新终端）
cd frontend
npm run dev
```

### 4. 访问应用

- 前端：http://localhost:5173
- 后端 API：http://localhost:8787

## 项目结构

### 前端

```
frontend/
├── src/
│   ├── components/    # Vue 组件
│   │   └── Editor.vue # TipTap 编辑器
│   ├── stores/        # Pinia 状态管理
│   │   ├── user.ts    # 用户状态
│   │   └── theme.ts   # 主题状态
│   ├── views/         # 页面视图
│   ├── App.vue        # 根组件
│   ├── main.ts        # 入口文件
│   └── style.css      # 全局样式
├── public/            # 静态资源
└── package.json
```

### 后端

```
backend/
├── src/
│   ├── index.ts       # 入口文件
│   ├── routes/        # API 路由
│   └── services/      # 业务逻辑
├── schema.sql         # 数据库结构
├── wrangler.toml      # Cloudflare 配置
└── package.json
```

## 数据库操作

### 创建数据库

```bash
cd backend
npm run db:create
```

### 运行迁移

```bash
# 本地开发
npm run db:migrate:local

# 生产环境
npm run db:migrate
```

## 构建与部署

### 前端构建

```bash
cd frontend
npm run build
```

### 后端部署

```bash
cd backend
npm run deploy
```

## 开发规范

### 代码风格

- 使用 TypeScript 编写代码
- 遵循 Vue 3 Composition API 最佳实践
- 使用 TailwindCSS 进行样式开发
- 组件使用 PascalCase 命名
- 文件使用 kebab-case 命名

### Git 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具链相关
```

## 常见问题

### 1. TailwindCSS 不生效

确保 `postcss.config.js` 使用了 `@tailwindcss/postcss` 插件：

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

### 2. Cloudflare Workers 本地开发失败

确保已安装 wrangler 并正确配置：

```bash
npm install -D wrangler
npx wrangler login
```

### 3. 前端无法连接后端

检查 `.env` 文件中的 `VITE_API_BASE_URL` 是否正确。

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT