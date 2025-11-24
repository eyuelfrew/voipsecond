# Quick Start - Theme Toggle

## 🚀 Test the Theme Toggle

### Option 1: Test with Standalone HTML (Fastest)
```bash
# Open the test file in your browser
open test-theme.html
# or
firefox test-theme.html
# or
google-chrome test-theme.html
```

This will show you a simple page where you can verify Tailwind dark mode works.

### Option 2: Test in Your App
```bash
# Start the development server
npm run dev
```

Then:
1. Open http://localhost:5173 (or whatever port Vite uses)
2. Login to the dashboard
3. Look for the **Sun/Moon icon button** in the top-right of the navbar
4. Click it to toggle between light and dark modes
5. Check the **debug widget** in the bottom-left corner

## 🎯 What to Look For

### In Light Mode:
- White/light gray backgrounds
- Dark text
- Moon icon in the toggle button

### In Dark Mode:
- Dark gray/black backgrounds
- Light text
- Sun icon in the toggle button

## 🐛 Debug Widget

The debug widget (bottom-left corner) shows:
- **Current Theme**: The theme state from context
- **HTML Class**: Whether the `dark` class is applied
- **Toggle Button**: Alternative way to toggle theme

## ✅ Success Indicators

The theme toggle is working if:
1. ✅ Clicking the button changes the UI colors
2. ✅ The icon changes (Sun ↔ Moon)
3. ✅ The debug widget shows the correct state
4. ✅ Refreshing the page keeps your theme choice
5. ✅ Console shows "Theme changed to: light/dark"

## 🔍 Browser Console Commands

Open browser console (F12) and try:
```javascript
// Check current theme
localStorage.getItem('theme')

// Check if dark class is applied
document.documentElement.classList.contains('dark')

// Manually toggle
document.documentElement.classList.toggle('dark')

// Clear saved theme
localStorage.removeItem('theme')
```

## 📍 Theme Toggle Location

```
┌───────────