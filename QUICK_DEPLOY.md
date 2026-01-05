# Quick Start Deployment Guide

## 🚀 Fastest Way to Deploy (5 Steps)

### Step 1: Set Up MongoDB Cloud Database (5 min)
```bash
# Go to: https://www.mongodb.com/cloud/atlas
# 1. Create account
# 2. Create FREE cluster
# 3. Create database user: username & password
# 4. Network access: Allow 0.0.0.0/0
# 5. Copy connection string
```

### Step 2: Deploy Backend (10 min)
```bash
# Go to: https://www.railway.app
# 1. Sign up with GitHub
# 2. Create new project → Empty Project
# 3. Add service → GitHub Repo
# 4. Select your chat-app repository
# 5. Add these environment variables:
#    - MONGODB_URI: <your-mongodb-string>
#    - JWT_SECRET: change-me-to-random-string
#    - FIREBASE_PROJECT_ID: your-firebase-id
#    - FIREBASE_PRIVATE_KEY: your-firebase-key
#    - FIREBASE_CLIENT_EMAIL: your-firebase-email
#    - NODE_ENV: production
# 6. Deploy
# 7. Copy the URL: https://your-app.railway.app
```

### Step 3: Build Frontend (5 min)
```bash
cd chat_app
flutter build web --dart-define=API_BASE_URL=https://your-app.railway.app/api
# Output: build/web
```

### Step 4: Deploy Frontend (5 min)
```bash
# Go to: https://vercel.com
# 1. Sign up with GitHub
# 2. Import project
# 3. Set build command: 
#    flutter build web --dart-define=API_BASE_URL=https://your-app.railway.app/api
# 4. Set output: chat_app/build/web
# 5. Add environment variables:
#    - API_BASE_URL: https://your-app.railway.app/api
# 6. Deploy
# 7. Copy frontend URL: https://your-app.vercel.app
```

### Step 5: Update CORS (2 min)
In `backend/src/index.js`, update:
```javascript
app.use(
  cors({
    origin: [
      'https://your-app.vercel.app', // Your Vercel URL
      'http://localhost:3000',
    ],
    credentials: true,
  })
);
```

Then redeploy backend on Railway.

---

## ✅ Done! Your app is LIVE

Open: https://your-app.vercel.app
- Register account
- Test with another device
- Messages appear in real-time

---

## Cost Breakdown (Free Tier)
- **MongoDB Atlas**: Free 512MB
- **Railway**: $5/month credit (covers both backend)
- **Vercel**: Free
- **Total**: ~$5/month (or free with free tiers)

---

## If Something Doesn't Work

Check these in order:
1. **Backend not starting?** → Check MongoDB connection string
2. **Frontend shows blank?** → Check API_BASE_URL in build command
3. **Can't login?** → Check Firebase credentials
4. **Messages not real-time?** → Check SOCKET_URL matches backend URL
5. **CORS errors?** → Add your Vercel URL to backend CORS

---

## Next Steps (Optional)
- [ ] Add custom domain (Railway + Vercel support this)
- [ ] Set up GitHub Actions for automatic deployments
- [ ] Add monitoring/logging
- [ ] Scale to paid tiers if needed
