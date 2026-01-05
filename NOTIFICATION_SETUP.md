# WhatsApp-like Notifications Implementation Guide

## Overview
This implementation adds comprehensive WhatsApp-like notification features to your chat application:
1. **Push Notifications** - Firebase Cloud Messaging (FCM)
2. **Message Status Indicators** - Sent, Delivered, Read
3. **Typing Indicators** - Real-time "User is typing..." display
4. **Unread Message Badges**
5. **Online/Offline Status**

---

## Backend Implementation

### 1. Model Changes

#### Updated Message Model
- Added `status` field: `'sent' | 'delivered' | 'read'`
- Added `deliveredTo` array: tracks which users received the message
- Existing `readBy` array: tracks which users read the message

### 2. New Services

#### Notification Service (`notificationService.js`)
Handles Firebase Cloud Messaging:
- `sendPushNotification(userId, notification)` - Send push to specific user
- `sendMessageNotification(recipientId, messageData)` - Send message notification
- `sendTypingNotification(recipientId, typingData)` - Send typing status
- `sendMulticastNotification(userIds, notification)` - Broadcast to multiple users
- `updateFcmToken(userId, fcmToken)` - Store user's FCM token
- `revokeFcmToken(userId)` - Remove token on logout
- `initializeFirebase()` - Initialize Firebase Admin SDK

#### Enhanced Socket Service (`socketService.js`)
New Socket.IO events:
- `user_typing` - Emit when user starts typing
- `user_stop_typing` - Emit when user stops typing
- `message_status_update` - Broadcast status changes
- `message_read` - Mark messages as read with receipts

### 3. New Controller

#### Notification Controller (`notificationController.js`)
REST API endpoints:
- `POST /api/notifications/register-token` - Register FCM token
- `POST /api/notifications/revoke-token` - Revoke token on logout
- `POST /api/notifications/test` - Send test notification

### 4. Updated Chat Service
New methods:
- `markMessageAsDelivered(messageId, userId)` - Mark as delivered
- `markMessagesAsReadAdvanced(chatId, userId, messageIds)` - Bulk read with status
- `getMessageStatus(messageId)` - Get delivery and read status

---

## Backend Setup Instructions

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Get Firebase Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Settings → Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file

### Step 3: Set Environment Variables
Add to `.env`:
```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"...","...":"..."}'
```

Or as a file path:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/service-account-key.json
```

### Step 4: Initialize Firebase in Backend
Update `src/index.js`:
```javascript
import { initializeFirebase } from './services/notificationService.js';

// Initialize Firebase when server starts
initializeFirebase();
```

---

## Flutter/Frontend Implementation

### 1. New Service: Notification Service

Located at: `lib/services/notification_service.dart`

**Initialize in main app:**
```dart
import 'package:chat_app/services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize notifications
  final notificationService = NotificationService();
  await notificationService.initialize();
  
  runApp(const MyApp());
}
```

**Key Methods:**
- `initialize()` - Request permissions and setup listeners
- `getFcmToken()` - Get current FCM token
- `revokeFcmToken()` - Logout notifications
- `sendTestNotification(title, body)` - Test push

### 2. New Widgets

Located at: `lib/widgets/notification_widgets.dart`

#### TypingIndicator Widget
Shows animated "User is typing..." with dots
```dart
TypingIndicator(
  userName: 'John',
  dotColor: Colors.grey,
)
```

#### InlineTypingIndicator Widget
Shows typing status inline in chat list
```dart
InlineTypingIndicator(
  typingUsers: ['Alice', 'Bob'],
  dotColor: Colors.blue,
)
```

#### MessageStatusIndicator Widget
Shows message status icon (✓ ✓✓ ✓✓ in blue)
```dart
MessageStatusIndicator(
  status: 'read', // 'sending', 'sent', 'delivered', 'read'
  readColor: Colors.blue,
)
```

#### UnreadBadge Widget
Shows unread count badge
```dart
UnreadBadge(count: 5, backgroundColor: Colors.red)
```

### 3. Socket Events to Handle

Add to your Socket Service:
```dart
// Listen for typing indicators
socket.on('user_typing', (data) {
  // Handle user typing
  print('${data['userId']} is typing');
});

socket.on('user_stop_typing', (data) {
  // Handle stop typing
  print('${data['userId']} stopped typing');
});

// Listen for message status updates
socket.on('message_status_update', (data) {
  // Handle status: 'delivered' or 'read'
  print('Message ${data['messageId']} is ${data['status']}');
});

// Emit typing events
socket.emit('user_typing', {'chatId': chatId});
socket.emit('user_stop_typing', {'chatId': chatId});
```

---

## Integration Checklist

### Backend
- [ ] Add `firebase-admin` to `package.json`
- [ ] Create `.env` with Firebase service account key
- [ ] Update Message model with `status`, `deliveredTo` fields
- [ ] Create `notificationService.js`
- [ ] Create `notificationController.js`
- [ ] Add notification routes to `routes/index.js`
- [ ] Update `socketService.js` with typing/status events
- [ ] Update `chatService.js` with new methods
- [ ] Initialize Firebase in `index.js`
- [ ] Update User model to include `fcmToken` field

### Frontend (Flutter)
- [ ] Firebase is already in `pubspec.yaml`
- [ ] Create `notificationService.dart`
- [ ] Create `notificationWidgets.dart`
- [ ] Initialize NotificationService in `main.dart`
- [ ] Update chat UI to use typing indicators
- [ ] Update message UI to show status icons
- [ ] Add typing event handlers to socket service
- [ ] Add unread badge to chat list

---

## Testing

### Test Push Notifications
```bash
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test message"
  }'
```

### Test Typing Indicators
In Flutter app, emit:
```dart
socket.emit('user_typing', {'chatId': chatId});
// ... user types ...
socket.emit('user_stop_typing', {'chatId': chatId});
```

### Test Message Status
Messages automatically track:
- `sent` - Immediately when created
- `delivered` - When recipient comes online
- `read` - When recipient views chat

---

## API Endpoints

### Notification Registration
```
POST /api/notifications/register-token
Headers: Authorization: Bearer <token>
Body: { "fcmToken": "..." }
Response: { "message": "...", "user": {...} }
```

### Revoke Token (Logout)
```
POST /api/notifications/revoke-token
Headers: Authorization: Bearer <token>
Response: { "message": "..." }
```

### Send Test Notification
```
POST /api/notifications/test
Headers: Authorization: Bearer <token>
Body: { "title": "...", "body": "..." }
Response: { "message": "...", "response": {...} }
```

---

## WebSocket Events

### Client → Server
```
'user_typing' - { chatId: string }
'user_stop_typing' - { chatId: string }
'message_read' - { chatId: string, messageIds: string[] }
```

### Server → Client
```
'user_typing' - { userId: string, chatId: string, isTyping: true }
'user_stop_typing' - { userId: string, chatId: string, isTyping: false }
'message_status_update' - { 
  messageId?: string,
  status: 'sent'|'delivered'|'read',
  userId?: string,
  chatId: string
}
'new_message' - { ..., status: 'sent'|'delivered'|'read' }
```

---

## Features Summary

| Feature | Implementation | Status |
|---------|----------------|--------|
| Push Notifications | FCM + Backend | ✅ Complete |
| Message Status | DB + Socket.IO | ✅ Complete |
| Typing Indicators | Socket.IO + Widget | ✅ Complete |
| Unread Badges | Widget | ✅ Complete |
| Online Status | Socket.IO | ✅ Existing |
| Notification Sounds | Platform specific | ⚠️ Manual setup |
| Notification Grouping | FCM config | ⚠️ Platform specific |

---

## Next Steps

1. **Update User Model** - Add `fcmToken` field if not present
2. **Platform-Specific Setup** - Configure Android/iOS for FCM
3. **Custom Notifications** - Configure sound, vibration in app
4. **Notification Grouping** - Set thread IDs for Android
5. **Testing on Devices** - Test on real iOS and Android devices

---

## Troubleshooting

### No notifications received
- Check Firebase service account key is valid
- Verify `fcmToken` is stored in User document
- Check app has notification permissions
- Verify network connectivity

### Typing indicators not showing
- Ensure socket connection is active
- Check chat component handles socket events
- Verify `user_typing` event is emitted

### Status not updating
- Check message status is updated in DB
- Verify status field exists in Message model
- Check socket event listeners are active

---

## References
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Messaging for Flutter](https://pub.dev/packages/firebase_messaging)
- [Socket.IO Documentation](https://socket.io/docs/)
- [WhatsApp UI Patterns](https://www.whatsapp.com/)
