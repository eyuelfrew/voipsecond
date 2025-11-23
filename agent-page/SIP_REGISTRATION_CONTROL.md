# SIP Registration Control Feature

## ✅ What Was Implemented

I've added a manual SIP registration/unregistration control with a WiFi icon in the navbar. This allows you to manually register or unregister from the SIP server even while logged in.

## 🎯 Features

### 1. **WiFi Icon Button** (NavBar - Right Side)
- **Green WiFi Icon** 🟢 = SIP Registered (connected)
- **Red WiFi Off Icon** 🔴 = SIP Unregistered (disconnected)
- **Spinning Loader** = Registration in progress

### 2. **Click to Toggle**
- **When Registered (Green)**: Click to unregister
- **When Unregistered (Red)**: Click to register

### 3. **Certificate Error Handling**
If registration fails due to a certificate error (common with self-signed certificates), a modal will automatically appear with:
- Clear explanation of the issue
- Step-by-step instructions
- Button to open the certificate acceptance page
- Instructions to retry after accepting

## 📍 Location

The WiFi icon is located in the navbar, right side:
```
[Shift Timer] [WiFi Icon] [Theme Toggle] [Pause/Resume] [Status] [Profile]
```

## 🔧 How It Works

### Registration Flow:
1. Click the red WiFi Off icon
2. System attempts to register with SIP server
3. If successful: Icon turns green
4. If certificate error: Modal appears with instructions

### Certificate Acceptance Flow:
1. Certificate error modal appears
2. Click "Open Certificate Page"
3. New tab opens to SIP server URL
4. Accept the security warning/certificate
5. Close that tab
6. Click the WiFi icon again to retry registration
7. Registration should now succeed

### Unregistration Flow:
1. Click the green WiFi icon
2. System unregisters from SIP server
3. Icon turns red
4. You're now offline (won't receive calls)

## 🎨 Visual States

### Registered (Connected)
- Green border and background
- Green WiFi icon
- Tooltip: "SIP Registered - Click to Unregister"

### Unregistered (Disconnected)
- Red border and background
- Red WiFi Off icon
- Tooltip: "SIP Unregistered - Click to Register"

### Registering (In Progress)
- Spinning loader animation
- Button disabled
- Tooltip: "Registering..."

## 🔍 Technical Details

### SIPProvider Updates:
- Added `manualRegister()` function
- Added `manualUnregister()` function
- Added `openCertificateAcceptance()` function
- Added `isRegistering` state
- Added `registrationError` state
- Stores registerer reference for manual control

### NavBar Updates:
- Added WiFi icon button with status colors
- Added certificate error modal
- Added automatic error detection
- Integrated with theme toggle (dark mode support)

## 🐛 Troubleshooting

### Registration Fails
1. Check if certificate modal appears
2. If yes, follow the certificate acceptance steps
3. If no modal, check browser console for errors
4. Try clicking the retry button in the error banner

### Certificate Issues
- The SIP server might use a self-signed certificate
- Your browser blocks WebSocket connections to untrusted certificates
- You must manually accept the certificate once
- After acceptance, registration should work normally

### Still Not Working
1. Check browser console (F12) for errors
2. Verify SIP server is running
3. Check network connectivity
4. Verify SIP credentials are correct

## 📝 Console Logs

The feature logs helpful information:
- `📡 Manual registration initiated...`
- `✅ Successfully registered`
- `❌ Manual registration failed: [error]`
- `📡 Manual unregistration initiated...`

## 🎯 Use Cases

1. **Testing**: Quickly test registration without reloading
2. **Troubleshooting**: Manually retry registration after network issues
3. **Break Time**: Unregister to avoid receiving calls during breaks
4. **Certificate Issues**: Easy workflow to accept certificates
5. **Development**: Quick toggle for testing different states

## ⚡ Quick Reference

| Icon | Status | Action | Result |
|------|--------|--------|--------|
| 🟢 WiFi | Registered | Click | Unregister |
| 🔴 WiFi Off | Unregistered | Click | Register |
| ⏳ Spinner | Registering | Wait | - |

## 🔐 Security Note

The certificate acceptance feature opens the SIP server URL in a new tab. This is necessary because:
- WebSocket connections require HTTPS for secure connections
- Self-signed certificates need manual browser acceptance
- This is a one-time process per browser/device
- After acceptance, the certificate is trusted for future connections
