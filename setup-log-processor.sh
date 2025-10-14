#!/bin/bash

echo "🚀 Setting up Log Processor Service"
echo "===================================="
echo ""

cd log-processor

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Generating Prisma Client..."
npm run prisma:generate

echo ""
echo "📊 Pushing schema to database..."
npm run prisma:push

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Available commands:"
echo "  npm start           - Start the service"
echo "  npm run dev         - Start in development mode"
echo "  npm run prisma:studio - Open Prisma Studio (Database GUI)"
echo ""
