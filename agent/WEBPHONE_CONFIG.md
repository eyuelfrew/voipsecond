# Webphone Configuration Guide

## Overview
The agent webphone is now configured with a stunning black and yellow theme, featuring a real phone-like interface with full functionality.

## Current Configuration

### IP Address
- **Default IP**: `192.168.1.2`
- **SIP Server**: `192.168.1.2:8088`
- **API Server**: `192.168.1.2:4000`

### Changing the IP Address

#### Option 1: Environment Variables (Recommended)
Create a `.env` file in the `agent/` directory:

```env
REACT_APP_SIP_SERVER=10.42.0.1
REACT_APP_DEV_BASE_URL=http://10.42.0.1:4000/api
REACT_APP_PROD_BASE_URL=https://10.42.0.1:4000/api
REACT_APP_SIP_SERVER_PORT=8088
```

#### Option 2: Direct File Edit
Edit `agent/src/baseUrl.js`:

```javascript
export const SIP_SERVER = '10.42.0.1'; // Change this IP
export const baseUrl = 'http://10.42.0.1:4000/api'; // Change this IP
```

## Webphone Features

### 🎨 Design
- **Black & Yellow Theme**: Modern, professional color scheme
- **Phone-like Interface**: Realistic phone design with rounded corners
- **Smooth Animations**: Fade-in, slide-up, pulse, and bounce effects
- **Glassmorphism**: Backdrop blur and transparency effects

### 📞 Call Features
1. **Incoming Calls**
   - Animated caller avatar with pulsing ring
   - Large answer/reject buttons
   - Caller ID display

2. **Active Calls**
   - Real-time call timer
   - Mute/Unmute with visual feedback
   - Hold/Resume functionality
   - Call transfer with input field
   - End call button

3. **Keypad**
   - Full numeric keypad (0-9, *, #)
   - Letter labels (ABC, DEF, etc.)
   - Backspace and clear functions
   - Direct dial from keypad
   - Keyboard support (type numbers, Enter to dial, Esc to close)

### 🎯 User Experience
- **Status Bar**: Shows agent status and connection
- **Visual Feedback**: Active states for mute, hold, transfer
- **Smooth Transitions**: Between keypad, call, and incoming views
- **Responsive Design**: Works on different screen sizes
- **Keyboard Shortcuts**: Full keyboard support for power users

### 🔧 Technical Details
- **SIP Protocol**: WebRTC-based SIP calling
- **Audio Handling**: Remote audio stream management
- **State Management**: React hooks for call state
- **Real-time Updates**: Live call timer and status

## Usage

### Making a Call
1. Click the floating phone button in the dashboard
2. Enter the number using the keypad
3. Press the green call button or hit Enter

### Receiving a Call
1. Incoming call screen appears automatically
2. Click the green button to answer
3. Click the red button to reject

### During a Call
- **Mute**: Toggle microphone on/off
- **Hold**: Put call on hold/resume
- **Keypad**: Send DTMF tones during call
- **Transfer**: Transfer call to another extension
- **End**: Hang up the call

## Deployment Notes

### For Local Network
```bash
# Use local IP
REACT_APP_SIP_SERVER=192.168.1.100
```

### For Production
```bash
# Use public IP or domain
REACT_APP_SIP_SERVER=your-domain.com
REACT_APP_PROD_BASE_URL=https://your-domain.com:4000/api
```

### Docker Deployment
```dockerfile
ENV REACT_APP_SIP_SERVER=10.42.0.1
ENV REACT_APP_DEV_BASE_URL=http://10.42.0.1:4000/api
```

## Troubleshooting

### SIP Connection Issues
1. Check if SIP server is running on port 8088
2. Verify WebSocket connection: `ws://10.42.0.1:8088/ws`
3. Check browser console for connection errors
4. Ensure firewall allows WebSocket connections

### Audio Issues
1. Grant microphone permissions in browser
2. Check browser audio settings
3. Verify WebRTC is supported
4. Test with different browsers

### Call Quality
1. Check network latency
2. Verify SIP server configuration
3. Monitor ICE connection status
4. Check codec compatibility

## Browser Support
- ✅ Chrome/Chromium (Recommended)
- ✅ Firefox
- ✅ Edge
- ✅ Safari (with WebRTC support)

## Security Notes
- Always use HTTPS in production
- Secure WebSocket (WSS) recommended for production
- Implement proper authentication
- Use strong SIP passwords
- Enable CORS properly on backend

## Future Enhancements
- [ ] Call recording
- [ ] Conference calls
- [ ] Video calling
- [ ] Call history
- [ ] Contact list integration
- [ ] Call notes
- [ ] Screen sharing
