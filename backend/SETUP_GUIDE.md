# Quick Integration & Setup Guide

## 1. Backend Setup (5 minutes)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Environment Configuration
Create `.env` file:
```bash
cp .env.example .env
```

Update with your values:
```
MONGODB_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your_super_secret_jwt_key_change_in_production
PORT=3000
NODE_ENV=development

# Firebase Admin SDK (get from Firebase Console)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

### Step 3: Start Backend
```bash
npm run dev
```

Expected output:
```
API listening on 3000
```

## 2. MongoDB Setup

### Local MongoDB
```bash
# Using Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install locally and start
mongod
```

### MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free tier cluster
3. Copy connection string
4. Update `MONGODB_URI` in `.env`

## 3. Firebase Setup

1. Go to https://console.firebase.google.com
2. Create new project
3. Enable Cloud Messaging
4. Generate Service Account key
5. Copy JSON credentials to `.env` (FIREBASE_PRIVATE_KEY needs newlines escaped as `\n`)

## 4. Flutter App Setup (5 minutes)

### Step 1: Install Dependencies
```bash
cd chat_app
flutter pub get
```

### Step 2: Update API Endpoints

**File**: `lib/services/api_service.dart`
```dart
static const String baseUrl = 'http://YOUR_BACKEND_URL/api';
// For local development: http://10.0.2.2:3000/api (Android)
//                        http://localhost:3000/api (iOS)
```

**File**: `lib/services/socket_service.dart`
```dart
'http://YOUR_BACKEND_URL',
// For local development: http://10.0.2.2:3000 (Android)
//                        http://localhost:3000 (iOS)
```

### Step 3: Firebase Configuration

1. Download `google-services.json` (Android) or `GoogleService-Info.plist` (iOS)
2. Place in appropriate directories
3. Configure in pubspec.yaml (already done)

### Step 4: Run Flutter App

```bash
# Android
flutter run

# iOS
flutter run -d ios

# Web (if available)
flutter run -d chrome
```

## 5. Testing the Application

### Manual Testing Steps

#### 1. Register & Login
```
1. Open app
2. Click "Sign Up"
3. Enter name, email, password
4. Click "Create Account"
5. Login with credentials
```

#### 2. Create Chat
```
1. Tap "New Chat" (+ button or New Chat button)
2. Enter friend's email
3. Tap "Create"
```

#### 3. Send Message
```
1. Open chat
2. Type message in input field
3. Tap send (arrow icon)
4. See message appear in real-time
```

#### 4. Test Offline Notification
```
1. User A sends message to User B
2. Kill app on User B's device
3. User A sends another message
4. Check Firebase console or device notification
```

### API Testing with cURL

#### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Get User Profile
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Chats
```bash
curl -X GET http://localhost:3000/api/chats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Create Chat
```bash
curl -X POST http://localhost:3000/api/chats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "OTHER_USER_ID"
  }'
```

#### Get Messages
```bash
curl -X GET http://localhost:3000/api/messages/CHAT_ID?page=1&limit=50 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 6. Debugging

### Backend Debugging

```bash
# Check logs
npm run dev  # Logs all requests

# Test MongoDB connection
mongo mongodb://localhost:27017

# Verify Socket.IO connection
# Open browser console when app is running
# Look for "Socket connected" message
```

### Flutter Debugging

```bash
# View device logs
flutter logs

# Debug mode
flutter run -v

# Hot reload
r (in terminal while running)

# Hot restart
R (in terminal while running)
```

### Common Issues & Solutions

#### Issue: "Cannot connect to backend"
**Solution**: 
- Android: Use `10.0.2.2` instead of `localhost`
- iOS: Use `localhost` with correct port
- Verify backend is running on correct port

#### Issue: "CORS error"
**Solution**: 
- Backend is not running
- Check that Express is properly configured
- Verify frontend URL in CORS settings

#### Issue: "Authentication failed"
**Solution**:
- JWT token expired
- Wrong JWT_SECRET in backend
- Token not passed correctly in headers

#### Issue: "Messages not appearing"
**Solution**:
- Socket connection failed (check logs)
- Check Socket.IO event handlers
- Verify both users are in correct chat room

#### Issue: "FCM notifications not received"
**Solution**:
- Firebase credentials not configured
- Device token not registered
- App not in background
- Check Firebase console for errors

## 7. Production Checklist

- [ ] Update JWT_SECRET to secure random string
- [ ] Set NODE_ENV=production
- [ ] Use MongoDB Atlas instead of local
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for production URLs
- [ ] Update API endpoints in Flutter app
- [ ] Test all features in production environment
- [ ] Enable Firebase production rules
- [ ] Setup error monitoring (Sentry, Rollbar)
- [ ] Configure CI/CD pipeline
- [ ] Setup database backups
- [ ] Configure app signing certificates
- [ ] Test on real devices
- [ ] Get security certifications if needed

## 8. Performance Optimization

### Backend
- Add Redis for caching
- Implement rate limiting
- Add database connection pooling
- Monitor Socket.IO performance

### Frontend
- Lazy load messages
- Implement message pagination
- Cache user data locally
- Optimize image loading (if added later)

## 9. Next Steps

After successful setup:
1. Customize branding/colors
2. Add user profiles
3. Implement typing indicators
4. Add message search
5. Setup analytics
6. Configure push notifications for iOS/Android
7. Setup CI/CD
8. Deploy to production

## Useful Resources

- **Flutter Documentation**: https://flutter.dev/docs
- **Socket.IO Docs**: https://socket.io/docs
- **MongoDB Docs**: https://docs.mongodb.com
- **Firebase Docs**: https://firebase.google.com/docs
- **Express.js Docs**: https://expressjs.com

---

**Questions?** Check logs first, then verify configuration files!
