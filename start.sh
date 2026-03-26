#!/bin/bash

echo "🚀 Starting OpenLit Development Environment..."

# 检查是否在项目根目录
if [ ! -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# 启动后端
echo "📦 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端
echo "🎨 Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ OpenLit development environment started!"
echo ""
echo "📖 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:8787"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# 捕获退出信号，关闭所有进程
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

# 等待进程
wait