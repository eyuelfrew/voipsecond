# 🚀 Getting Started with Agent Portal

## Quick Start (5 minutes)

### Automated Setup

**Linux/Mac:**
```bash
cd agent
chmod +x setup.sh
./setup.sh
npm start
```

**Windows:**
```cmd
cd agent
setup.bat
npm start
```

### Manual Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your IP address
   ```

3. **Start Application**
   ```bash
   npm start
   ```

4. **Open Browser**
   - Navigate to `http://localhost:3000`
   - Login with your agent credentials

## 📋 Prerequisites

### Required
- ✅ Node.js 14+ ([Download](https://nodejs.org/))
- ✅ npm 6+ (comes with Node.js)
- ✅ Backend API server running
- ✅ SIP server (Asterisk/FreePBX) running

### Optional
- Git for version control
- VS Code or your favorite editor
- Chrome/Firefox for best WebRTC support

## 🔧 Configuration

### Basic Configuration

Edit `.env` file:
```env
# Your SIP server IP
REACT_APP_SIP_SERVER=192.168.1.2

# Your API server
REACT_APP_DEV_BASE_URL=http://192.168.1.2:4000/api
```

### Advanced Configuration

See `WEBPHONE_CONFIG.md` for:
- STUN/TURN server setup
- WebRTC optimization
- Network configuration
- Security settings

## 🎯 First Steps

### 1. Login
- Open `http://localhost:3000`
- Enter your username and password
- Click "Sign In"

### 2. Check Connection
- Look for "Available" status in top bar
- Green indicator means SIP is connected
- Yellow/Red means connection issues

### 3. Make Your First Call
- Click the floating phone button (bottom-right)
- Enter a phone number
- Press the green call button
- Start talking!

### 4. Explore Features
- **Dashboard**: View your stats and metrics
- **Contacts**: Manage your contact list
- **Analytics**: See detailed reports
- **Webphone**: Make and receive calls

## 📱 Webphone Quick Guide

### Making Calls
1. Click phone button
2. Type number on keypad
3. Press green button or Enter
4. Wait for connection

### Receiving Calls
1. Incoming call appears automatically
2. Click green button to answer
3. Click red button to reject

### During Calls
- **Mute**: Click microphone icon
- **Hold**: Click pause icon
- **Transfer**: Click transfer icon, enter extension
- **Keypad**: Click keypad icon for DTMF
- **End**: Click red phone icon

### Keyboard Shortcuts
- `0-9, *, #`: Type on keypad
- `Enter`: Dial number
- `Backspace`: Delete digit
- `Escape`: Close webphone

## 🐛 Common Issues

### "Cannot connect to SIP server"
**Solution:**
1. Check if SIP server is running
2. Verify IP address in `.env`
3. Check firewall settings
4. Look at browser console for errors

### "No audio during calls"
**Solution:**
1. Allow microphone permissions
2. Check browser audio settings
3. Try different browser
4. Verify WebRTC support

### "Page won't load"
**Solution:**
1. Check if backend API is running
2. Verify API URL in `.env`
3. Clear browser cache
4. Check network connection

### "Build fails"
**Solution:**
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

## 📚 Documentation

### Essential Reading
1. **README.md** - Main documentation
2. **WEBPHONE_CONFIG.md** - Webphone setup
3. **PERFORMANCE_GUIDE.md** - Optimization tips

### Quick References
- [React Docs](https://reactjs.org/)
- [WebRTC Guide](https://webrtc.org/)
- [JsSIP Docs](https://jssip.net/)

## 🎓 Learning Path

### Day 1: Setup & Basics
- [ ] Install and configure
- [ ] Login successfully
- [ ] Make first call
- [ ] Explore dashboard

### Day 2: Features
- [ ] Try all call controls
- [ ] Use keyboard shortcuts
- [ ] Check analytics
- [ ] Manage contacts

### Day 3: Advanced
- [ ] Configure STUN/TURN
- [ ] Optimize performance
- [ ] Customize settings
- [ ] Review logs

## 💡 Tips & Tricks

### Performance
- Use Chrome for best performance
- Close unused tabs
- Use local network when possible
- Enable hardware acceleration

### Productivity
- Learn keyboard shortcuts
- Use quick dial for frequent numbers
- Set up contact list
- Review daily stats

### Troubleshooting
- Check browser console (F12)
- Monitor network tab
- Review SIP server logs
- Test with different browsers

## 🔐 Security

### Best Practices
- Use strong passwords
- Enable HTTPS in production
- Keep software updated
- Review access logs
- Use VPN for remote access

### Production Checklist
- [ ] HTTPS enabled
- [ ] Secure WebSocket (WSS)
- [ ] Strong SIP passwords
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Monitoring setup
- [ ] Backups configured

## 🚀 Next Steps

### Immediate
1. Complete setup
2. Test all features
3. Configure preferences
4. Add contacts

### Short Term
1. Optimize performance
2. Customize settings
3. Train team members
4. Set up monitoring

### Long Term
1. Plan integrations
2. Review analytics
3. Gather feedback
4. Plan improvements

## 📞 Support

### Self-Help
1. Check documentation
2. Review troubleshooting section
3. Search browser console
4. Check SIP server logs

### Resources
- Documentation in `/agent` folder
- Browser DevTools (F12)
- Network monitoring tools
- SIP server logs

## 🎉 Success Checklist

- [ ] Application installed
- [ ] Environment configured
- [ ] Backend API connected
- [ ] SIP server connected
- [ ] Login successful
- [ ] First call made
- [ ] All features tested
- [ ] Documentation reviewed

## 📈 Monitoring Your Progress

### Daily
- Check call statistics
- Review missed calls
- Monitor connection quality
- Track response times

### Weekly
- Analyze performance metrics
- Review error logs
- Check system health
- Plan improvements

### Monthly
- Review overall statistics
- Gather user feedback
- Plan feature updates
- Optimize configuration

---

**Welcome to the Agent Portal! 🎉**

You're now ready to start making calls and managing your contact center operations efficiently.

For detailed information, see:
- `README.md` - Complete documentation
- `WEBPHONE_CONFIG.md` - Webphone configuration
- `PERFORMANCE_GUIDE.md` - Performance optimization

Happy calling! 📞
