#!/bin/bash

# Chat App Pre-Deployment Checklist
# Run this before deploying to ensure everything is ready

echo "🚀 Chat App Deployment Checklist"
echo "================================"
echo ""

# Backend checks
echo "📦 Backend Checks:"
echo "  ✓ Checking backend structure..."
if [ -f "backend/src/index.js" ]; then
  echo "    ✅ index.js found"
else
  echo "    ❌ index.js not found"
fi

if [ -f "backend/package.json" ]; then
  echo "    ✅ package.json found"
else
  echo "    ❌ package.json not found"
fi

if [ -f "backend/.env" ] || [ -f "backend/.env.example" ]; then
  echo "    ✅ Environment file exists"
else
  echo "    ⚠️  No .env file - will need to create one"
fi

echo ""

# Frontend checks
echo "📱 Frontend Checks:"
echo "  ✓ Checking frontend structure..."
if [ -f "chat_app/pubspec.yaml" ]; then
  echo "    ✅ pubspec.yaml found"
else
  echo "    ❌ pubspec.yaml not found"
fi

if [ -d "chat_app/lib" ]; then
  echo "    ✅ lib folder found"
else
  echo "    ❌ lib folder not found"
fi

echo ""

# Database check
echo "🗄️  Database:"
echo "  ⚠️  Ensure MongoDB Atlas cluster is created"
echo "  ⚠️  Database user created with password"
echo "  ⚠️  Connection string ready"
echo ""

# Firebase check
echo "🔥 Firebase:"
echo "  ⚠️  Firebase project created"
echo "  ⚠️  Service account key downloaded"
echo "  ⚠️  FCM enabled"
echo ""

# Production URLs
echo "🌐 Production URLs Needed:"
echo "  1. Backend URL (Railway/Render): https://your-backend-domain.com"
echo "  2. Frontend URL (Vercel/Netlify): https://your-frontend-domain.com"
echo ""

echo "📋 Deployment Steps:"
echo "  1. Create MongoDB Atlas database"
echo "  2. Get MongoDB connection string"
echo "  3. Create Firebase service account"
echo "  4. Deploy backend to Railway"
echo "  5. Build Flutter web: flutter build web --dart-define=API_BASE_URL=<backend-url>/api"
echo "  6. Deploy frontend to Vercel"
echo "  7. Update CORS on backend with frontend URL"
echo "  8. Test live messaging between devices"
echo ""

echo "✅ Checklist complete! Ready to deploy?"
