# WhatsApp Notifications - Quick Reference Card

## 🚀 Quick Start (5 Minutes)

### Backend Setup
```bash
# 1. Install dependencies
cd backend && npm install

# 2. Get Firebase key from https://console.firebase.google.com
# Settings > Service Accounts > Generate New Private Key

# 3. Add to .env
FIREBASE_SERVICE_ACCOUNT_KEY='paste-json-here'

# 4. Start
npm run dev
```

### Frontend Setup
```dart
// In main.dart
import 'package:chat_app/services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(...);
  
  NotificationService().initialize(); // Add this
  
  runApp(const MyApp());
}
```

---

## 📱 Available Widgets

### 1. Typing Indicator
```dart
TypingIndicator(userName: 'John')
```
Shows: "John is typing ●●●"

### 2. Message Status
```dart
MessageStatusIndicator(status: 'read')
```
Shows: ✓ (sent), ✓✓ (delivered), or ✓✓ (blue, read)

### 3. Unread Badge
```dart
UnreadBadge(count: 5)
```
Shows: Red circle with "5"

### 4. Chat Typing Indicator
```dart
InlineTypingIndicator(
  typingUsers: ['Alice', 'Bob'],
)
```
Shows: "Alice, Bob are typing..."

---

## 🔌 Socket Events to Use

### Send Typing Status
```dart
socket.emit('user_typing', {'chatId': chatId});
socket.emit('user_stop_typing', {'chatId': chatId});
```

### Listen for Events
```dart
socket.on('user_typing', (data) {
  setState(() => typingUsers.add(data['userId']));
});

socket.on('message_status_update', (data) {
  // data['status']: 'delivered' or 'read'
  // Update message UI
});
```

---

## 🌐 API Endpoints

### Register FCM Token (on login)
```bash
POST /api/notifications/register-token
Authorization: Bearer <token>
Body: { "fcmToken": "..." }
```

### Revoke Token (on logout)
```bash
POST /api/notifications/revoke-token
Authorization: Bearer <token>
```

### Test Notification
```bash
POST /api/notifications/test
Authorization: Bearer <token>
Body: { "title": "Hi", "body": "Hello" }
```

---

## 📊 Message Status Flow

```
User sends → Message saved (status: 'sent')
                    ↓
          Recipient socket receives
                    ↓
          Status updated to 'delivered'
                    ↓
          Recipient opens chat
                    ↓
          Status updated to 'read' ✓✓
```

---

## 🎯 Integration Checklist

- [ ] Backend: `npm install` successful
- [ ] Backend: Firebase service account key added to `.env`
- [ ] Backend: `npm run dev` runs without errors
- [ ] Frontend: `NotificationService().initialize()` in main.dart
- [ ] Frontend: Added socket event listeners in chat screen
- [ ] Frontend: Added widgets to chat UI
- [ ] Test: Send test notification via API
- [ ] Test: Send message and check status updates
- [ ] Test: Type in chat and see typing indicator

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| No notifications | Check FCM token in database |
| Typing not showing | Verify `user_typing` event emitted |
| Status stuck on "sent" | Ensure chat model has status field |
| Firebase errors | Validate service account JSON in .env |

---

## 📚 Full Documentation

- **Setup Guide**: See `NOTIFICATION_SETUP.md`
- **Code Examples**: See `INTEGRATION_EXAMPLES.md`
- **Full Details**: See `WHATSAPP_NOTIFICATIONS_COMPLETE.md`

---

## 🎨 UI Components Preview

```
┌─────────────────────────┐
│ Chat List               │
├─────────────────────────┤
│ John          [5] 🔴     │ ← Unread badge
│ Last message...         │
│                         │
│ Alice is typing... ●●●  │ ← Typing indicator
│ Hi there ✓✓            │ ← Message status
└─────────────────────────┘
```

---

## 💡 Key Features

✅ Push notifications (offline users)
✅ Message status tracking (✓ ✓✓)
✅ Typing indicators (●●●)
✅ Unread badges
✅ Online/offline status
✅ Real-time updates via Socket.IO

---

**Everything is ready to use! Start building.** 🚀
