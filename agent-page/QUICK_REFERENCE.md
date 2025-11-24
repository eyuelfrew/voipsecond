# Quick Reference Card

## 🎯 New Features in NavBar

### 1. WiFi Icon (SIP Registration Control)
```
🟢 Green WiFi    = Registered (Online)
🔴 Red WiFi Off  = Unregistered (Offline)
⏳ Spinner       = Registering...
```

**Click to toggle registration status**

### 2. Theme Toggle (Light/Dark Mode)
```
☀️ Sun Icon  = Currently in Dark Mode (click for Light)
🌙 Moon Icon = Currently in Light Mode (click for Dark)
```

**Click to switch themes**

---

## 🚨 Certificate Error?

If you see a modal about certificate errors:

1. ✅ Click "Open Certificate Page"
2. ✅ Accept the security warning
3. ✅ Close that tab
4. ✅ Click WiFi icon again

**This is a one-time setup!**

---

## 📍 NavBar Icons (Left to Right)

```
┌─────────────────────────────────────────────────────────────┐
│ FE Call Center    [Timer] [WiFi] [Theme] [Pause] [●] [👤]  │
└─────────────────────────────────────────────────────────────┘
```

- **Timer**: Shift duration (when active)
- **WiFi**: SIP registration (🟢/🔴)
- **Theme**: Light/Dark mode (☀️/🌙)
- **Pause**: Pause/Resume work
- **●**: Active/Inactive status
- **👤**: Profile menu

---

## ⚡ Quick Actions

| Want to... | Click... | Result |
|------------|----------|--------|
| Go offline | 🟢 WiFi | Unregisters from SIP |
| Go online | 🔴 WiFi | Registers to SIP |
| Dark mode | ☀️ Sun | Switches to dark |
| Light mode | 🌙 Moon | Switches to light |
| Take break | ⏸️ Pause | Pauses (stays registered) |
| Resume work | ▶️ Resume | Resumes work |

---

## 🎨 Theme Colors

### Light Mode:
- White backgrounds
- Dark text
- Clean and bright

### Dark Mode:
- Dark backgrounds
- Light text
- Easy on the eyes

---

## 💡 Pro Tips

1. **WiFi vs Pause**:
   - WiFi = Complete disconnect (no calls)
   - Pause = Temporary break (still registered)

2. **Theme Preference**:
   - Saved automatically
   - Persists across sessions

3. **Certificate**:
   - Only accept once per browser
   - Required for WebSocket security

4. **Status Check**:
   - Green WiFi = Ready for calls
   - Red WiFi = Offline
   - Green dot = System active

---

## 🐛 Troubleshooting

### WiFi Icon Stuck Red?
1. Click it to retry registration
2. Check for certificate modal
3. Look for error banner at top

### Theme Not Changing?
1. Check browser console (F12)
2. Clear localStorage
3. Hard refresh (Ctrl+Shift+R)

### Certificate Modal Keeps Appearing?
1. Make sure you accepted the certificate
2. Try opening the URL manually
3. Check browser security settings

---

## 📞 Support

Check detailed docs:
- `SIP_REGISTRATION_CONTROL.md`
- `THEME_TOGGLE_IMPLEMENTATION.md`
- `FEATURES_SUMMARY.md`

Or check browser console (F12) for error messages.
