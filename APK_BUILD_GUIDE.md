# Build Release APK Guide

## Problem
When you build a release APK locally, it uses `localhost:5000/api` which doesn't exist on the device. You need to pass your Railway URL at build time.

---

## Solution: Build with --dart-define

### Option 1: Manual Build Command
```bash
cd chat_app

# Replace with your actual Railway URL
flutter build apk --release \
  --dart-define=API_BASE_URL=https://your-railway-url.railway.app/api \
  --dart-define=SOCKET_URL=https://your-railway-url.railway.app
```

### Option 2: Use Build Script (Easier)
```bash
# Make script executable
chmod +x build-release.sh

# Run with your Railway URL
./build-release.sh https://your-railway-url.railway.app
```

Example:
```bash
./build-release.sh https://my-chat-app.railway.app
```

---

## Install on Device

```bash
# After build completes, install:
adb install -r build/app/outputs/flutter-apk/app-release.apk

# Or use your phone's file manager to install the APK
```

---

## Verify Installation
1. Open the app
2. Try to register/login
3. Should work without localhost errors
4. Messages should appear in real-time

---

## Troubleshooting

### "Network error" on device
- Verify your Railway URL is correct
- Check that Railway backend is running
- Ensure device is on same/connected network

### App crashes on startup
- Check logs: `adb logcat | grep chat_app`
- Verify API_BASE_URL and SOCKET_URL are correct
- Try uninstall + reinstall

### Can't connect to backend
- Device may be on different WiFi
- If local testing, use device IP instead of localhost
- For Railway, URL must be publicly accessible
