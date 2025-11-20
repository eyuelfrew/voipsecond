# Simple WebRTC Phone - Static Configuration

A simplified WebRTC phone with only core calling functionality: making and receiving calls.
Pre-configured for Asterisk server at 192.168.1.4:8089.

## Features
- SIP registration/unregistration
- Making calls to SIP extensions/numbers
- Receiving incoming calls
- Audio and video calling
- Mute functionality
- Clean, minimal interface

## Setup
1. Enter your SIP extension and password in the UI:
   - SIP Extension: Your SIP extension (e.g., 1001)
   - SIP Password: Your extension password

2. Click "Register" to connect to the pre-configured Asterisk server (192.168.1.4:8089)

3. Enter a number to call in the "Dial Number" field and click "Call"

4. To receive calls, keep the page open and registered

## Requirements
- Asterisk server at 192.168.1.4 configured for WebRTC on port 8089
- Secure WebSocket support (wss://) on port 8089
- Proper STUN/TURN configuration for WebRTC connectivity

## Files
- `simple_static_phone.html` - Main HTML interface (pre-configured)
- `simple_static_phone.js` - Core functionality (pre-configured)
- `simple_phone.css` - Styling
- `index.html` - Redirects to the main phone page

## Browser Requirements
- Modern browser with WebRTC support (Chrome, Firefox, Edge, Safari 11+)
- HTTPS connection (required for WebRTC in most browsers)