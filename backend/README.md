# Real-Time Text-Only Chat Application

A production-ready, modern real-time text-only chat application built with **Flutter**, **Node.js**, **MongoDB**, **Socket.IO**, and **Firebase Cloud Messaging (FCM)**.

## Features

✅ **User Authentication**
- Email & password registration and login
- JWT-based authentication
- Secure password hashing with bcrypt

✅ **Real-Time Messaging**
- Instant text message delivery via Socket.IO
- Online/offline user status tracking
- Real-time message synchronization

✅ **Push Notifications**
- Firebase Cloud Messaging (FCM) integration
- Offline notifications for missed messages
- Automatic token management

✅ **Modern UI/UX**
- Material 3 Design System
- Light & Dark theme support
- Smooth animations and transitions
- Responsive design (Mobile & Desktop)

✅ **Security**
- JWT token-based authentication
- Password hashing with bcrypt
- Protected WebSocket connections
- Input validation and sanitization

## Tech Stack

### Backend
- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-Time**: Socket.IO v4.7.2
- **Authentication**: JWT & bcrypt
- **Push Notifications**: Firebase Admin SDK

### Frontend
- **Framework**: Flutter (Dart)
- **State Management**: Riverpod
- **HTTP Client**: http
- **WebSocket**: socket_io_client
- **UI**: Material 3 Design

## Project Structure

### Backend
```
backend/
├── src/
│   ├── config/
│   │   ├── db.js          # MongoDB connection
│   │   └── firebase.js    # Firebase initialization
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   └── chatController.js     # Chat operations
│   ├── middlewares/
│   │   ├── authMiddleware.js     # JWT verification
│   │   └── validationMiddleware.js # Input validation
│   ├── models/
│   │   ├── userModel.js          # User schema
│   │   ├── chatModel.js          # Chat schema
│   │   ├── messageModel.js       # Message schema
│   │   └── tokenModel.js         # FCM token schema
│   ├── routes/
│   │   └── index.js      # API routes
│   ├── services/
│   │   ├── authService.js        # Auth business logic
│   │   ├── chatService.js        # Chat business logic
│   │   ├── notificationService.js # FCM integration
│   │   └── socketService.js      # Socket.IO handling
│   ├── utils/
│   │   └── logger.js     # Logging utility
│   └── index.js          # Server entry point
├── .env.example          # Environment template
├── package.json          # Dependencies
└── README.md            # Backend documentation
```

### Frontend
```
lib/
├── models/
│   ├── user.dart         # User model
│   ├── chat.dart         # Chat model
│   └── message.dart      # Message model
├── services/
│   ├── api_service.dart  # HTTP API client
│   └── socket_service.dart # WebSocket client
├── providers/
│   ├── auth_provider.dart    # Auth state management
│   └── chat_provider.dart    # Chat state management
├── screens/
│   ├── auth/
│   │   ├── login_screen.dart    # Login UI
│   │   └── register_screen.dart # Register UI
│   └── chat/
│       ├── chat_list_screen.dart # Chat list UI
│       └── chat_screen.dart      # Chat detail UI
├── widgets/
│   ├── user_avatar.dart  # Avatar widget
│   ├── message_bubble.dart # Message bubble
│   └── chat_list_tile.dart # Chat list tile
├── theme/
│   └── app_theme.dart    # Material 3 theme
└── main.dart             # App entry point
```

## Getting Started

### Prerequisites

- **Backend**: Node.js v18+, MongoDB
- **Frontend**: Flutter 3.0+, Android Studio/Xcode

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Required environment variables**
   ```
   MONGODB_URI=mongodb://localhost:27017/chat-app
   JWT_SECRET=your_secure_jwt_secret_key
   PORT=3000
   NODE_ENV=development
   FIREBASE_* (Firebase Admin SDK credentials)
   ```

4. **Start the server**
   ```bash
   npm run dev    # Development mode
   npm start      # Production mode
   ```

The server will listen on `http://localhost:3000`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd chat_app
   flutter pub get
   ```

2. **Update API endpoint** in `lib/services/api_service.dart`
   - Change `baseUrl` to your backend server URL
   - Update Socket.IO connection URL in `lib/services/socket_service.dart`

3. **Run the app**
   ```bash
   flutter run
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Chats
- `POST /api/chats` - Create or fetch chat with user
- `GET /api/chats` - List all chats for logged-in user
- `GET /api/messages/:chatId` - Get messages from chat

### FCM Tokens
- `POST /api/tokens` - Register device token

## WebSocket Events

### Client → Server
- **`join_chat`** - Join chat room
  ```json
  { "chatId": "..." }
  ```

- **`send_message`** - Send message
  ```json
  { "chatId": "...", "text": "..." }
  ```

- **`leave_chat`** - Leave chat room
  ```json
  { "chatId": "..." }
  ```

### Server → Client
- **`new_message`** - New message received
  ```json
  {
    "id": "...",
    "chatId": "...",
    "senderId": "...",
    "senderName": "...",
    "text": "...",
    "createdAt": "..."
  }
  ```

- **`user_online`** - User came online
  ```json
  { "userId": "..." }
  ```

- **`user_offline`** - User went offline
  ```json
  { "userId": "..." }
  ```

- **`error`** - Error occurred
  ```json
  { "message": "..." }
  ```

## Database Schema

### User
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  passwordHash: String (required),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Chat
```javascript
{
  _id: ObjectId,
  members: [ObjectId, ObjectId],
  lastMessage: String,
  lastMessageAt: DateTime,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Message
```javascript
{
  _id: ObjectId,
  chatId: ObjectId (required),
  senderId: ObjectId (required),
  text: String (required, 1-5000 chars),
  createdAt: DateTime
}
```

### Token (FCM)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  token: String (unique),
  platform: String (ios, android, web),
  lastSeenAt: DateTime,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

## Security Features

✅ JWT authentication for REST APIs and WebSocket
✅ Password hashing with bcrypt (rounds: 10)
✅ Input validation using Joi schema validation
✅ Role-based message access (only chat members)
✅ Sanitized text messages
✅ HTTPS ready (configure in production)
✅ CORS enabled with configurable origins

## Performance Optimizations

✅ MongoDB indexes on:
- `email` (User uniqueness)
- `members` (Chat lookup)
- `chatId + createdAt` (Message pagination)

✅ Message pagination (default 50 per page)
✅ Efficient Socket.IO room management
✅ Lazy loading of messages
✅ Connection pooling with MongoDB

## Firebase Cloud Messaging Integration

The app automatically:
1. Registers device token on first login
2. Updates token on app launch
3. Sends FCM notification when user is offline
4. Removes invalid tokens from database

## Error Handling

The application includes comprehensive error handling:
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)

All errors include descriptive messages for debugging.

## Testing

### Recommended Test Scenarios

1. **Authentication Flow**
   - Register new user
   - Login with credentials
   - Get user profile

2. **Chat Operations**
   - Create chat between two users
   - Send and receive messages
   - Load message history

3. **Real-Time Features**
   - Socket connection with JWT
   - Online/offline status
   - Real-time message delivery
   - Offline message handling

4. **FCM Notifications**
   - Register device token
   - Receive notification when offline
   - Clean invalid tokens

## Deployment

### Backend (Node.js)

1. Set production environment variables
2. Use a process manager (PM2, Forever)
3. Enable HTTPS
4. Configure CORS for your frontend URL
5. Use MongoDB Atlas for production database

### Frontend (Flutter)

1. Build APK for Android: `flutter build apk --release`
2. Build IPA for iOS: `flutter build ios --release`
3. Build Web: `flutter build web --release`
4. Configure Firebase for each platform
5. Update API endpoints for production

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in .env
- Verify network connectivity

### Socket.IO Connection Failed
- Check backend server is running
- Verify frontend API endpoint
- Check JWT token is valid
- Ensure CORS is configured

### FCM Notifications Not Received
- Verify Firebase credentials
- Check device token is registered
- Ensure app is in background
- Check Firebase console for errors

## Future Enhancements

- [ ] Message search functionality
- [ ] User profiles with avatars
- [ ] Typing indicators
- [ ] Message reactions (emoji)
- [ ] Message editing and deletion
- [ ] Group chats
- [ ] Voice messages (optional, if required)
- [ ] Read receipts
- [ ] End-to-end encryption

## License

This project is provided as-is for educational and commercial use.

## Support

For issues, feature requests, or questions, please refer to the documentation or contact the development team.

---

**Built with ❤️ for real-time communication**
