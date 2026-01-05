# Chat App Deployment Guide

## Prerequisites
- GitHub account (for repo)
- MongoDB Atlas account (for cloud database)
- Railway account (for backend)
- Vercel account (for frontend)

---

## Step 1: Prepare MongoDB Cloud Database

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user (save username & password)
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/chatapp`
5. Whitelist all IPs (0.0.0.0/0) for testing

---

## Step 2: Deploy Backend on Railway

### 2.1 Create Railway Account
- Sign up at https://railway.app
- Connect GitHub account

### 2.2 Create Backend Service
```bash
# In your project root, ensure you have:
# - src/index.js (entry point)
# - package.json with "start": "node src/index.js"
# - .env.example file
```

### 2.3 Environment Variables for Railway
Add these in Railway dashboard:

```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp
JWT_SECRET=your-super-secret-key-here-change-this
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
SOCKET_URL=your-railway-backend-url (e.g., https://yourapp.railway.app)
```

### 2.4 Get Backend URL
After deployment, Railway gives you: `https://yourapp.railway.app`

---

## Step 3: Build Frontend

```bash
cd chat_app

# Build for web
flutter build web --dart-define=API_BASE_URL=https://yourapp.railway.app/api

# Output in: build/web
```

---

## Step 4: Deploy Frontend on Vercel

### 4.1 Create Vercel Account
- Sign up at https://vercel.com
- Import your project from GitHub

### 4.2 Build Settings
- **Framework**: None (custom)
- **Build Command**: `flutter build web --dart-define=API_BASE_URL=https://yourbackend.railway.app/api`
- **Output Directory**: `chat_app/build/web`

### 4.3 Environment Variables in Vercel
```
API_BASE_URL=https://yourapp.railway.app/api
SOCKET_URL=https://yourapp.railway.app
```

---

## Step 5: Update Frontend Configuration

Edit `pubspec.yaml` to prepare for production:

```yaml
flutter:
  uses-material-design: true
  assets:
    - assets/fonts/
```

Edit `lib/main.dart` - ensure correct URLs:

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('Error initializing Firebase: $e');
  }
  
  // Initialize notifications
  try {
    await NotificationService().initialize();
  } catch (e) {
    debugPrint('Error initializing NotificationService: $e');
  }
  
  runApp(const ProviderScope(child: ChatApp()));
}
```

---

## Step 6: Configure CORS on Backend

Update `src/index.js`:

```javascript
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://yourfrontend.vercel.app', // Your Vercel URL
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);
```

---

## Step 7: Test Live

1. Open your Vercel frontend URL
2. Register a new account
3. Open in another browser/device
4. Send messages - should appear in real-time
5. Check chat history persists

---

## Troubleshooting

### Messages not appearing
- Check console for API errors
- Verify `API_BASE_URL` is correct
- Ensure MongoDB is accessible

### WebSocket not connecting
- Check `SOCKET_URL` in environment
- Verify CORS settings
- Check Railway logs

### Login fails
- Check MongoDB connection string
- Verify JWT_SECRET is set
- Check Firebase credentials

---

## Optional: Use Docker for Easy Deployment

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src

CMD ["npm", "start"]
```

Build and deploy to Docker Hub, then use on any platform supporting Docker.

---

## Production Checklist

- [ ] MongoDB Atlas cluster created & secured
- [ ] Backend deployed to Railway
- [ ] Frontend built and deployed to Vercel
- [ ] Environment variables set correctly
- [ ] CORS configured for production URLs
- [ ] Firebase credentials added
- [ ] SSL/HTTPS enabled (automatic on Railway/Vercel)
- [ ] Custom domain setup (optional)
- [ ] Test real-time messaging
- [ ] Monitor logs for errors
