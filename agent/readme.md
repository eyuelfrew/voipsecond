# 📞 Agent Portal - WebRTC Contact Center Application

A modern, high-performance contact center agent application with a stunning webphone interface, built with React and WebRTC technology.

## 🎯 Overview

This is a professional-grade agent portal featuring:
- **Real-time WebRTC calling** with SIP protocol
- **Beautiful webphone interface** with black & yellow theme
- **Live call management** with hold, mute, transfer capabilities
- **Agent dashboard** with performance metrics
- **Ticket management** system
- **Knowledge base** integration
- **Real-time status** tracking

## ✨ Key Features

### 📱 Webphone
- **Realistic phone interface** with smooth animations
- **Full call controls**: Mute, Hold, Transfer, DTMF keypad
- **Incoming call handling** with animated UI
- **Real-time call timer** and status indicators
- **Keyboard shortcuts** for power users
- **Visual feedback** for all actions

### 📊 Dashboard
- **Agent performance metrics** (calls, tickets, online time)
- **Real-time queue monitoring**
- **Shift tracking** with reason logging
- **Interactive charts** and statistics
- **Live status updates**

### 🎨 Design
- **Modern black & yellow theme**
- **Glassmorphism effects**
- **Smooth animations** and transitions
- **Responsive layout**
- **Professional UI/UX**

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ and npm
- SIP server running (Asterisk/FreePBX)
- Backend API server

### Installation

```bash
# Navigate to agent directory
cd agent

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Configuration

Create a `.env` file in the `agent/` directory:

```env
# SIP Server Configuration
REACT_APP_SIP_SERVER=192.168.1.2
REACT_APP_SIP_SERVER_PORT=8088

# API Server Configuration
REACT_APP_DEV_BASE_URL=http://192.168.1.2:4000/api
REACT_APP_PROD_BASE_URL=https://192.168.1.2:4000/api

# Environment
NODE_ENV=development
```

### Running the Application

```bash
# Development mode
npm start

# Production build
npm run build

# Serve production build
npm install -g serve
serve -s build -p 3000
```

The application will open at `http://localhost:3000`

## 🔧 Configuration Guide

### IP Address Configuration

The default IP is set to `192.168.1.2`. To change it:

#### Option 1: Environment Variables (Recommended)
Edit `.env` file:
```env
REACT_APP_SIP_SERVER=YOUR_IP_HERE
REACT_APP_DEV_BASE_URL=http://YOUR_IP_HERE:4000/api
```

#### Option 2: Direct File Edit
Edit `src/baseUrl.js`:
```javascript
export const SIP_SERVER = 'YOUR_IP_HERE';
export const baseUrl = 'http://YOUR_IP_HERE:4000/api';
```

### SIP Server Setup

Ensure your SIP server (Asterisk/FreePBX) is configured for WebRTC:

1. **WebSocket Transport**: Enable on port 8088
2. **CORS Headers**: Allow your domain
3. **Codecs**: Enable opus, ulaw, alaw
4. **ICE/STUN**: Configure for NAT traversal

Example Asterisk configuration:
```ini
[http]
enabled=yes
bindaddr=0.0.0.0
bindport=8088

[transport-ws]
type=transport
protocol=ws
bind=0.0.0.0:8088
```

## 📱 Webphone Usage

### Making a Call
1. Click the floating phone button (bottom-right)
2. Enter the number using the keypad
3. Press the green call button or hit Enter
4. Use keyboard to type numbers directly

### Receiving a Call
1. Incoming call screen appears automatically
2. Click green button to answer
3. Click red button to reject

### During a Call
- **Mute/Unmute**: Toggle microphone
- **Hold/Resume**: Put call on hold
- **Keypad**: Send DTMF tones
- **Transfer**: Transfer to another extension
- **End Call**: Hang up

### Keyboard Shortcuts
- `0-9, *, #`: Type on keypad
- `Enter`: Dial number
- `Backspace`: Delete last digit
- `Escape`: Close webphone

## ⚡ Performance Optimization

### Build Optimization

```bash
# Analyze bundle size
npm run build
npx source-map-explorer 'build/static/js/*.js'

# Production build with optimizations
GENERATE_SOURCEMAP=false npm run build
```

### Code Splitting
The app uses React lazy loading for better performance:
- Dashboard components load on demand
- Charts load only when needed
- Reduces initial bundle size

### WebRTC Optimization

```javascript
// Optimized PC configuration in SIPProvider
const PC_CONFIG = {
  rtcpMuxPolicy: "require",
  bundlePolicy: "max-bundle",
  iceCandidatePoolSize: 10
};
```

### Network Optimization
- Use local network for SIP server
- Enable gzip compression on backend
- Use CDN for static assets in production
- Implement service worker for caching

### Memory Management
- Proper cleanup of WebRTC connections
- Clear intervals and timeouts
- Remove event listeners on unmount
- Optimize re-renders with React.memo

## 🏗️ Project Structure

```
agent/
├── public/              # Static files
├── src/
│   ├── components/      # React components
│   │   ├── Login.js           # Login page
│   │   ├── Dashboard.js       # Main dashboard
│   │   ├── CallPopup.js       # Webphone interface
│   │   ├── SIPProvider.js     # WebRTC/SIP logic
│   │   ├── NavBar.js          # Navigation
│   │   ├── Sidebar.js         # Sidebar menu
│   │   └── ...
│   ├── store/           # State management
│   │   └── store.js           # Zustand store
│   ├── baseUrl.js       # API & SIP configuration
│   ├── App.js           # Main app component
│   └── index.js         # Entry point
├── .env                 # Environment variables
├── package.json         # Dependencies
└── README.md           # This file
```

## 🔐 Security Best Practices

### Production Deployment
1. **Use HTTPS**: Always use secure connections
2. **Secure WebSocket**: Use WSS instead of WS
3. **Strong Passwords**: Enforce strong SIP passwords
4. **CORS Configuration**: Restrict allowed origins
5. **Authentication**: Implement proper JWT tokens
6. **Rate Limiting**: Prevent brute force attacks

### Environment Variables
Never commit `.env` files to version control:
```bash
# Add to .gitignore
.env
.env.local
.env.production
```

## 🐛 Troubleshooting

### SIP Connection Issues

**Problem**: Cannot connect to SIP server
```bash
# Check WebSocket connection
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  http://192.168.1.2:8088/ws
```

**Solution**:
- Verify SIP server is running
- Check firewall rules
- Ensure WebSocket is enabled
- Check browser console for errors

### Audio Issues

**Problem**: No audio during calls

**Solution**:
- Grant microphone permissions
- Check browser audio settings
- Verify WebRTC support
- Test with different browsers
- Check codec compatibility

### Performance Issues

**Problem**: Slow loading or lag

**Solution**:
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build

# Check bundle size
npm run build -- --stats
```

### Network Issues

**Problem**: High latency or dropped calls

**Solution**:
- Use local network when possible
- Check network bandwidth
- Monitor packet loss
- Verify QoS settings
- Use STUN/TURN servers

## 📊 Monitoring & Debugging

### Browser Console
Enable verbose logging:
```javascript
// In SIPProvider.js
JsSIP.debug.enable('JsSIP:*');
```

### Network Monitoring
Use browser DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by WS (WebSocket)
4. Monitor SIP messages

### Performance Monitoring
```javascript
// Add to index.js
import { reportWebVitals } from './reportWebVitals';

reportWebVitals(console.log);
```

## 🚢 Deployment

### Development
```bash
npm start
```

### Production Build
```bash
# Build optimized production bundle
npm run build

# Test production build locally
serve -s build -p 3000
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npx", "serve", "-s", "build", "-p", "3000"]
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/agent/build;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # WebSocket proxy for SIP
    location /ws {
        proxy_pass http://192.168.1.2:8088;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 📚 Additional Resources

### Documentation
- [WebRTC Documentation](https://webrtc.org/)
- [JsSIP Documentation](https://jssip.net/documentation/)
- [React Documentation](https://reactjs.org/)
- [Asterisk WebRTC Guide](https://wiki.asterisk.org/wiki/display/AST/WebRTC)

### Related Files
- `WEBPHONE_CONFIG.md` - Detailed webphone configuration
- `.env.example` - Environment variables template
- `package.json` - Dependencies and scripts

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console logs
3. Check SIP server logs
4. Verify network connectivity

## 📝 License

This project is part of a contact center solution.

## 🎉 Features Roadmap

- [ ] Call recording
- [ ] Conference calls
- [ ] Video calling
- [ ] Screen sharing
- [ ] Call history
- [ ] Contact list
- [ ] Call notes
- [ ] SMS integration
- [ ] CRM integration
- [ ] Advanced analytics

---

**Built with ❤️ using React, WebRTC, and modern web technologies**
