#!/bin/bash

# Chat App Build Script for Release APK
# Usage: ./build-release.sh https://your-railway-url.railway.app

BACKEND_URL=$1

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Error: Backend URL is required"
    echo "Usage: ./build-release.sh https://your-railway-url.railway.app"
    echo ""
    echo "Example:"
    echo "  ./build-release.sh https://my-chat-app.railway.app"
    exit 1
fi

echo "🚀 Building Release APK..."
echo "Backend URL: $BACKEND_URL"
echo ""

cd chat_app

flutter build apk --release \
  --dart-define=API_BASE_URL=$BACKEND_URL/api \
  --dart-define=SOCKET_URL=$BACKEND_URL

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo "📦 APK location: build/app/outputs/flutter-apk/app-release.apk"
    echo ""
    echo "📱 Install on device:"
    echo "  adb install -r build/app/outputs/flutter-apk/app-release.apk"
else
    echo "❌ Build failed"
    exit 1
fi
