# Notification Permission Fix

## Problem
The app was not asking for notification permissions when first installed.

## Root Causes Identified & Fixed

### 1. **Missing Android Permissions in AndroidManifest.xml** ✅ FIXED
The manifest was missing the critical `POST_NOTIFICATIONS` permission declaration for Android 13+.

**Changes made:**
- Added `android.permission.POST_NOTIFICATIONS` - Required for apps to post notifications on Android 13+
- Added `android.permission.INTERNET` - For Firebase Cloud Messaging
- Added `android.permission.ACCESS_NETWORK_STATE` - For network connectivity checks

**File:** [android/app/src/main/AndroidManifest.xml](android/app/src/main/AndroidManifest.xml)

### 2. **Timing Issue with Permission Request** ✅ FIXED
The permission request was happening too early before the UI was fully rendered.

**Changes made:**
- Wrapped permission request in `Future.delayed(Duration(milliseconds: 500))`
- This ensures the UI is ready before requesting permissions
- Removed duplicate `_retrieveFcmToken()` call
- Token is now only retrieved after permission is granted

**File:** [lib/services/notification_service.dart](lib/services/notification_service.dart)

### 3. **iOS Permission Description** ✅ FIXED
iOS requires a user-facing description for permission requests in Info.plist.

**Changes made:**
- Added `NSUserNotificationUsageDescription` key with user-friendly message
- Added `UNUserNotificationCenter` configuration

**File:** [ios/Runner/Info.plist](ios/Runner/Info.plist)

## How to Apply These Changes

1. **Clean the build:**
   ```bash
   flutter clean
   cd android && ./gradlew clean && cd ..
   ```

2. **Rebuild and run:**
   ```bash
   flutter pub get
   flutter run --release  # Use release mode for Android 13+ to properly test
   ```

3. **Testing:**
   - When you first run the app or on a fresh install, you should now see the notification permission prompt
   - On Android 13+: The system permission dialog will appear
   - On iOS: The permission request will show with our custom message

## What Happens Now

1. App initializes Firebase and notifications
2. After a 500ms delay (when UI is ready), a permission request appears
3. User grants/denies permission
4. If granted, FCM token is retrieved and registered with backend
5. Notifications will work properly in foreground, background, and terminated states

## Additional Notes

- The notification service is already properly configured to:
  - Handle foreground messages with local notifications
  - Handle background/terminated message taps
  - Play custom sounds and vibrations
  - Show notification badges and groups

- Make sure the notification sound file exists at:
  - Android: `android/app/src/main/res/raw/notification.mp3`
  - iOS: `ios/Runner/notification.caf`
