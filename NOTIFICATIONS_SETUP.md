# WhatsApp-Style Notifications Setup

## What's Implemented

✅ **Push Notifications (FCM)**
- Receive messages when app is closed
- Automatic tap to open chat
- Real-time delivery

✅ **Local Notifications (Foreground)**
- Sound, vibration, badge
- Large icon with profile picture
- Message preview in notification
- Grouped notifications per chat

✅ **Notification Features**
- Sender name displayed
- Message preview
- Chat icon/badge
- Tap to open specific chat
- Notification grouping by chat
- Custom sound (notification.caf)

---

## Setup Required

### 1. Android Setup

#### Add Notification Sound
1. Create `android/app/src/main/res/raw/notification.mp3` (or .caf)
2. Or copy from: `android/app/src/main/res/raw/notification.mp3`

#### Update AndroidManifest.xml
Add permissions:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### 2. iOS Setup

#### Request Notification Permission (Auto handled)
- Automatically requests in `initialize()`
- User can change in Settings → App

#### Add Notification Sound (optional)
1. Add `notification.caf` to Xcode
2. Or use default iOS sound

### 3. Backend Update (Important!)

Update your FCM notification payload to include proper data:

```javascript
// Example: backend/src/services/notificationService.js

const notificationPayload = {
  notification: {
    title: senderName,
    body: messageText,
  },
  data: {
    type: 'new_message',
    chatId: chatId.toString(),
    senderId: senderId.toString(),
    senderName: senderName,
    text: messageText,
    timestamp: new Date().toISOString(),
  },
};
```

---

## Testing Notifications

### Test Locally
```bash
flutter run --dart-define=API_BASE_URL=http://localhost:5000/api
```

### Test APK
```bash
# Build with your backend URL
flutter build apk --release \
  --dart-define=API_BASE_URL=https://your-backend.railway.app/api

# Install
adb install -r build/app/outputs/flutter-apk/app-release.apk
```

### Send Test Message
1. Login with 2 accounts on different devices
2. Send message from Device A
3. Device B should get notification instantly
4. Tap notification to open chat

---

## Notification Types

### 1. Foreground (App Open)
- Shows local notification overlay
- Sound + vibration
- Tap to scroll to message

### 2. Background (App Closed)
- Shows system notification
- Delivered by FCM
- Tap to open chat

### 3. Terminated (App Not Running)
- Notification sent to device
- Tap to launch app & open chat

---

## Troubleshooting

### No Notifications Appearing

**Check 1: Permissions**
```dart
final hasPermission = await NotificationService().hasNotificationPermission();
print('Has notification permission: $hasPermission');
```

**Check 2: FCM Token**
```dart
final token = await NotificationService().getFcmToken();
print('FCM Token: $token');
```

**Check 3: Backend Sending**
- Verify FCM payload has required fields
- Check Firebase Admin SDK is configured
- Check backend logs

**Check 4: Device Settings**
- Check app notification settings
- Verify volume is not muted
- Check Do Not Disturb mode

### Notifications Not Opening Chat

- Ensure `onTap` callback is set in `initialize()`
- Verify `chatId` is passed in notification data
- Check navigation context is available

### Wrong Sound Playing

- Add `notification.mp3` to `android/app/src/main/res/raw/`
- Or update sound filename in `notification_service.dart`

---

## Customization

### Change Notification Sound
Edit `notification_service.dart`:
```dart
sound: RawResourceAndroidNotificationSound('your_sound_name'),
```

### Change Vibration Pattern
```dart
vibrationPattern: [0, 250, 250, 250], // ms: delay, vibrate, pause, vibrate
```

### Change Notification Importance
```dart
importance: Importance.max, // max, high, default, low
priority: Priority.high, // high, default, low
```

### Custom Notification Icon
Add icon at: `android/app/src/main/res/mipmap-*/ic_notification.png`

---

## Next Steps

1. ✅ Rebuild and test notifications
2. Add notification sound file (optional)
3. Update backend FCM payload
4. Test with release APK
5. Deploy to users

---

## Files Modified

- `pubspec.yaml` - Added `flutter_local_notifications`
- `lib/services/notification_service.dart` - Complete rewrite with local notifications
- `lib/main.dart` - Added navigation callback
- `lib/services/notification_handler.dart` - New handler for Riverpod integration
