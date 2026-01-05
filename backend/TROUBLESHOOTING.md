# Troubleshooting Guide

## Backend Issues

### 1. Server Won't Start

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

---

### 2. MongoDB Connection Error

**Error**: `MongooseError: Cannot connect to MongoDB`

**Diagnosis**:
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Test connection
mongo mongodb://localhost:27017

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log
```

**Solution**:
```bash
# Start MongoDB with Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or start locally (macOS)
brew services start mongodb-community

# Or start locally (Linux)
sudo systemctl start mongod
```

---

### 3. Firebase Connection Error

**Error**: `Firebase initialization failed`

**Solution**:
1. Verify .env has all FIREBASE_* variables
2. Check Firebase service account JSON is valid
3. Ensure FIREBASE_PRIVATE_KEY has escaped newlines (`\n`)

```bash
# Test Firebase connection
node -e "const admin = require('firebase-admin'); console.log('Firebase OK')"
```

---

### 4. JWT Token Issues

**Error**: `Invalid token` or `Token expired`

**Solution**:
- Ensure JWT_SECRET is set in .env
- Check token hasn't expired (7 days)
- Regenerate token by logging in again
- Verify Authorization header format: `Bearer <token>`

```bash
# Decode JWT token online: https://jwt.io
# Or test manually:
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 5. Socket.IO Connection Failed

**Error**: `WebSocket connection failed`

**Diagnosis**:
```bash
# Check Socket.IO is listening
curl http://localhost:3000/

# Check firewall
sudo ufw status

# Test with client logs
npm run dev  # Check server logs
```

**Solution**:
1. Ensure backend is running on correct port
2. Check firewall allows Socket.IO connections
3. Verify CORS is configured
4. Check Socket.IO version compatibility

---

### 6. Messages Not Saving

**Error**: Messages appear but don't persist

**Diagnosis**:
```bash
# Check MongoDB for messages
mongo mongodb://localhost:27017
> use chat-app
> db.messages.find()
```

**Solution**:
1. Verify MongoDB is running
2. Check chatId and senderId are valid ObjectIds
3. Verify message text length (1-5000 chars)
4. Check server logs for errors

---

### 7. FCM Notifications Not Sending

**Error**: No notifications received when offline

**Diagnosis**:
```bash
# Check Firebase logs
# Go to Firebase Console > Logs

# Check token is registered
# In MongoDB: db.tokens.find()

# Verify user is offline
# Check socketService logs for "User offline"
```

**Solution**:
1. Ensure Firebase credentials are correct
2. Verify device token is registered
3. Check app is actually in background
4. Verify user is marked as offline
5. Check Firebase console for errors

---

## Frontend Issues

### 1. Flutter App Won't Run

**Error**: `No devices found`

**Solution**:
```bash
# List connected devices
flutter devices

# Start Android emulator
emulator -avd Pixel_4_API_30

# Or
flutter emulator --launch Pixel_4_API_30
```

---

### 2. Cannot Connect to Backend

**Error**: `Connection refused` or `Failed to fetch`

**Diagnosis**:
```bash
# Check backend is running
curl http://localhost:3000/api/auth/me

# For Android emulator, use 10.0.2.2 instead of localhost
# For iOS simulator, use localhost
# For physical device, use your machine's IP
```

**Solution**:
```dart
// In lib/services/api_service.dart
// Android emulator
static const String baseUrl = 'http://10.0.2.2:3000/api';

// iOS simulator
// static const String baseUrl = 'http://localhost:3000/api';

// Physical device
// static const String baseUrl = 'http://192.168.1.X:3000/api';
```

---

### 3. Socket.IO Connection Failed

**Error**: `Socket connection failed` or `Connected but no events`

**Solution**:
1. Check backend Socket.IO URL is correct
2. Verify JWT token is valid
3. Ensure Socket.IO headers are correct
4. Check device network connectivity

```dart
// In lib/services/socket_service.dart
// Verify URL matches backend
_socket = IO.io(
  'http://10.0.2.2:3000',  // Android
  // 'http://localhost:3000',  // iOS
);
```

---

### 4. Messages Not Appearing

**Error**: Send succeeds but message doesn't show

**Diagnosis**:
```bash
# Check server logs
npm run dev

# Check Flutter logs
flutter logs

# Verify Socket.IO room name
# Should be: chat_<chatId>
```

**Solution**:
1. Ensure Socket.IO is connected
2. Verify chatId is correct
3. Check join_chat event is sent
4. Verify new_message listener is registered
5. Check message isn't filtered by UI logic

---

### 5. State Management Issues

**Error**: UI not updating or infinite loops

**Solution**:
1. Check Riverpod providers are correctly defined
2. Ensure state immutability
3. Verify provider dependencies
4. Check for circular dependencies

```dart
// Correct Riverpod usage
final provider = StateNotifierProvider<Notifier, State>((ref) {
  return Notifier();
});

// Watched correctly
final value = ref.watch(provider);
```

---

### 6. Firebase Messaging Not Working

**Error**: No push notifications received

**Solution**:
1. Configure Firebase for your platform
2. Download google-services.json (Android) or GoogleService-Info.plist (iOS)
3. Add to correct project directories
4. Request notification permissions
5. Test with Firebase Console

---

### 7. Hot Reload Doesn't Work

**Error**: Changes not reflected on app reload

**Solution**:
```bash
# Full restart instead of hot reload
# Press 'R' instead of 'r'

# Or manually restart
flutter run

# Or clean and rebuild
flutter clean
flutter pub get
flutter run
```

---

## Database Issues

### 1. MongoDB Data Not Persisting

**Error**: Data lost after restart

**Solution**:
```bash
# Ensure MongoDB data directory exists
mkdir -p ~/data/db

# Start with data directory
mongod --dbpath ~/data/db

# Or use Docker with volume
docker run -d -v mongo_data:/data/db -p 27017:27017 --name mongodb mongo:latest
```

---

### 2. Duplicate Key Errors

**Error**: `E11000 duplicate key error`

**Solution**:
```bash
# Drop existing unique index
mongo
> use chat-app
> db.users.collection.dropIndex("email_1")

# Or check what indexes exist
> db.users.getIndexes()
```

---

### 3. Query Performance Issues

**Error**: Slow queries or timeouts

**Solution**:
1. Verify all indexes are created
2. Monitor query performance
3. Increase pagination limit if needed
4. Add caching layer

```bash
# Check indexes
mongo
> db.messages.getIndexes()

# Verify indexes match
# chatId_1_createdAt_-1 (for message pagination)
# members_1 (for chat lookup)
```

---

## Network Issues

### 1. CORS Errors

**Error**: `CORS policy: No 'Access-Control-Allow-Origin'`

**Solution**:
```javascript
// In backend/src/index.js
// Already configured in Socket.IO:
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
```

For specific origin:
```javascript
cors: {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
}
```

---

### 2. SSL/TLS Errors

**Error**: `SSL: CERTIFICATE_VERIFY_FAILED`

**Solution**:
```bash
# For development only
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev

# For production, use proper certificates
```

---

### 3. Timeout Errors

**Error**: `Socket timeout` or `Connection timeout`

**Solution**:
1. Check network connectivity
2. Increase timeout values
3. Check firewall settings
4. Verify server is running

---

## Security Issues

### 1. Weak JWT Secret

**Error**: Production warning about JWT security

**Solution**:
```bash
# Generate strong secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
JWT_SECRET=your_generated_secret_here
```

---

### 2. Password Not Hashing

**Error**: Passwords stored in plain text

**Diagnosis**:
```bash
# Check in MongoDB
mongo
> db.users.findOne()
# Should see passwordHash, not password
```

**Solution**:
1. Verify bcrypt is used
2. Check password is hashed before save
3. Never log plain passwords
4. Reset all passwords

---

### 3. Token Exposed in Logs

**Error**: JWT token visible in console/logs

**Solution**:
1. Don't log tokens
2. Use token sanitization
3. Mask sensitive data in logs
4. Use secure logging service

---

## Performance Issues

### 1. Slow Message Loading

**Solution**:
1. Implement pagination
2. Add database indexes
3. Reduce message limit per page
4. Cache messages locally

```dart
// Reduce limit for slower devices
await ApiService.getMessages(chatId, limit: 25);
```

---

### 2. High CPU Usage

**Solution**:
1. Check for infinite loops
2. Optimize UI rebuilds
3. Use const widgets
4. Profile with Flutter DevTools

---

### 3. Memory Leaks

**Solution**:
```dart
// Properly dispose resources
@override
void dispose() {
  _controller.dispose();
  _socketService.disconnect();
  super.dispose();
}
```

---

## Testing Issues

### 1. Can't Test Authentication

**Solution**:
```bash
# Use cURL for API testing
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Use Postman or Insomnia for easier testing
```

---

### 2. Messages Not Syncing in Tests

**Solution**:
1. Ensure both Socket.IO connections are established
2. Verify chatId matches on both sides
3. Check messages are being emitted to correct room
4. Add logging for debugging

---

## Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module` | Missing dependency | `npm install` or `flutter pub get` |
| `Port already in use` | Another process on port | Kill process or use different port |
| `Connection refused` | Backend not running | Start backend with `npm run dev` |
| `Invalid token` | Token expired or wrong secret | Login again or check JWT_SECRET |
| `404 Not found` | Wrong endpoint or method | Verify endpoint in API documentation |
| `500 Server error` | Backend error | Check server logs |
| `CORS error` | CORS not configured | Check Socket.IO/Express CORS settings |
| `Database error` | MongoDB issue | Check MongoDB is running |

---

## Debug Checklist

When something doesn't work:

1. ✅ Check backend logs: `npm run dev`
2. ✅ Check Flutter logs: `flutter logs`
3. ✅ Verify MongoDB is running: `mongo`
4. ✅ Test API with cURL
5. ✅ Check .env variables are correct
6. ✅ Verify network connectivity
7. ✅ Check firewall/antivirus
8. ✅ Review recent code changes
9. ✅ Check documentation
10. ✅ Try clean rebuild

---

## Getting Help

### Resources
- Backend docs: Check `backend/DOCUMENTATION.md`
- Setup guide: Check `SETUP_GUIDE.md`
- API reference: Check `API_DOCUMENTATION.md`
- Flutter docs: https://flutter.dev/docs
- Socket.IO docs: https://socket.io/docs

### Debug Mode

**Backend**:
```bash
npm run dev  # Detailed logs
```

**Frontend**:
```bash
flutter run -v  # Verbose output
flutter logs    # Device logs
```

---

## Still Having Issues?

1. Check all configuration files (.env, API endpoints)
2. Verify all dependencies are installed
3. Try clean rebuild
4. Check for typos in variable names
5. Verify MongoDB and backend are running
6. Test with cURL before using Flutter
7. Review error messages carefully
8. Check documentation and this guide

**Good luck! 🍀**
