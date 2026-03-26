# OpenLit - 文学创造与阅读平台

OpenLit 是一个现代化的文学创作与阅读平台，采用模块化与插件化设计，提供优质的创作与阅读体验。

## 技术栈

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全
- **Vite** - 快速的构建工具
- **Pinia** - 状态管理
- **TailwindCSS** - 实用优先的 CSS 框架
- **TipTap** - 富文本编辑器

### 后端
- **Cloudflare Workers** - 无服务器计算平台
- **Hono** - 快速的 Web 框架
- **D1** - 边缘数据库
- **R2** - 对象存储

## 项目结构

```
openlit/
├── frontend/          # 前端项目
│   ├── src/
│   │   ├── components/  # Vue 组件
│   │   ├── stores/      # Pinia 状态管理
│   │   ├── views/       # 页面视图
│   │   └── ...
│   └── ...
├── backend/           # 后端项目
│   ├── src/
│   │   ├── routes/     # API 路由
│   │   ├── services/   # 业务逻辑
│   │   └── ...
│   ├── schema.sql     # 数据库结构
│   └── wrangler.toml  # Cloudflare 配置
└── README.md
```

## 快速开始

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

### 后端开发

```bash
cd backend
npm install
npx wrangler dev
```

## 核心功能

- ✅ 用户系统（注册、登录、权限管理）
- ✅ 富文本编辑器（基于 TipTap）
- ✅ 章节管理
- ✅ 阅读器界面
- ✅ 作品管理
- ✅ 评论系统
- 🚧 插件系统（开发中）
- 🚧 AI 辅助（计划中）

## 开发计划

### 已完成
- [x] 项目初始化
- [x] 前端基础架构
- [x] 后端基础架构
- [x] 数据库设计
- [x] 编辑器组件

### 进行中
- [ ] 用户认证系统
- [ ] 作品 CRUD
- [ ] 阅读器实现

### 计划中
- [ ] 插件系统
- [ ] 社区功能
- [ ] AI 辅助写作

## 许可证

MIT