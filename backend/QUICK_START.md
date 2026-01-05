# Quick Start Commands

## Backend Setup (3 minutes)

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env with your values
nano .env  # or use your editor

# 4. Start backend server
npm run dev
```

**Expected Output:**
```
API listening on 3000
```

---

## Frontend Setup (3 minutes)

```bash
# 1. Install Flutter dependencies
cd ../chat_app
flutter pub get

# 2. Update API endpoints in code:
#    - lib/services/api_service.dart (line ~9)
#    - lib/services/socket_service.dart (line ~16)
#    Change from localhost:3000 to your backend URL

# 3. Run the app
flutter run
```

---

## Database Setup

### Option 1: Local MongoDB
```bash
# Using Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Verify connection
docker ps | grep mongodb
```

### Option 2: MongoDB Atlas (Cloud)
1. Visit https://www.mongodb.com/cloud/atlas
2. Create free tier cluster
3. Copy connection string
4. Add to .env: `MONGODB_URI=<connection_string>`

---

## Firebase Setup

```bash
# 1. Go to https://console.firebase.google.com
# 2. Create new project
# 3. Enable Cloud Messaging
# 4. Generate Service Account key (JSON)
# 5. Copy values to .env

# Required .env variables:
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789
```

---

## Testing the App

### Test in Terminal

```bash
# Register User
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@test.com",
    "password": "password123"
  }'

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@test.com",
    "password": "password123"
  }' | jq -r '.token')

echo "Token: $TOKEN"

# Get User Profile
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Get Chats
curl -X GET http://localhost:3000/api/chats \
  -H "Authorization: Bearer $TOKEN"
```

### Test in Flutter App

1. **Register**: Tap Sign Up → Enter details → Create Account
2. **Login**: Enter email/password → Sign In
3. **Chat**: Tap + button → Enter friend's email → Create chat
4. **Message**: Type message → Tap send button → See real-time update

---

## Development Commands

### Backend
```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start

# Check logs
npm run dev

# Stop server
# Ctrl + C
```

### Frontend
```bash
# Run app
flutter run

# Hot reload (while running)
# Press 'r' in terminal

# Hot restart
# Press 'R' in terminal

# Stop app
# Ctrl + C

# Clean and rebuild
flutter clean
flutter pub get
flutter run
```

---

## Debugging

### Backend Logs
```bash
# View all logs
npm run dev

# Check MongoDB connection
# Look for "Connected to MongoDB" in logs

# Check Socket.IO
# Look for "User connected" in logs
```

### Flutter Logs
```bash
# View device logs
flutter logs

# Verbose logs
flutter run -v

# Check Socket.IO connection
# Look for "Socket connected" in logs
```

---

## Common Issues & Quick Fixes

### Can't connect to backend
```bash
# Android: Use 10.0.2.2 instead of localhost
# iOS: Use localhost with correct port
# Verify backend is running: curl http://localhost:3000/api/auth/me
```

### Database connection error
```bash
# Check MongoDB is running
docker ps | grep mongodb

# Or verify local MongoDB
mongod --version

# Check connection string in .env
cat .env | grep MONGODB_URI
```

### Socket.IO connection failed
```bash
# Check backend logs
npm run dev

# Verify Socket.IO URL in Flutter code
# Should match backend port (default 3000)

# Check firewall/network
curl http://localhost:3000
```

### Build errors
```bash
# Clean everything
flutter clean
npm cache clean --force

# Reinstall dependencies
flutter pub get
npm install

# Rebuild
flutter run
npm run dev
```

---

## Environment Variables Checklist

Backend `.env`:
- [ ] MONGODB_URI (local or MongoDB Atlas)
- [ ] JWT_SECRET (secure random string)
- [ ] PORT (3000 or custom)
- [ ] NODE_ENV (development)
- [ ] FIREBASE_* (all Firebase credentials)

Frontend `lib/services/`:
- [ ] API_SERVICE baseUrl (http://localhost:3000/api)
- [ ] SOCKET_SERVICE URL (http://localhost:3000)

---

## Useful Links

- **Flutter Docs**: https://flutter.dev/docs
- **Dart Package Registry**: https://pub.dev
- **MongoDB**: https://docs.mongodb.com
- **Socket.IO**: https://socket.io/docs
- **Firebase**: https://firebase.google.com/docs
- **JWT**: https://jwt.io
- **bcrypt**: https://github.com/kelektiv/node.bcrypt.js

---

## Next Steps After Setup

1. ✅ Test basic authentication flow
2. ✅ Test messaging between two users
3. ✅ Test real-time message delivery
4. ✅ Test offline notifications
5. ✅ Customize colors/branding
6. ✅ Add more features
7. ✅ Deploy to staging
8. ✅ Deploy to production

---

## Quick Commands Reference

| Task | Command |
|------|---------|
| Start backend | `npm run dev` (in backend/) |
| Start flutter | `flutter run` (in chat_app/) |
| Install backend deps | `npm install` |
| Install flutter deps | `flutter pub get` |
| Check backend logs | `npm run dev` |
| Check flutter logs | `flutter logs` |
| Test API | `curl http://localhost:3000/api/auth/me` |
| Clean rebuild | `flutter clean && flutter pub get && flutter run` |

---

## Performance Tips

- Update message limit for slower devices (reduce from 50)
- Use local MongoDB for faster development
- Keep Socket.IO rooms organized by chatId
- Implement message caching on client
- Use pagination for large chat lists

---

**Ready to code? Start with the Backend Setup above! 🚀**
