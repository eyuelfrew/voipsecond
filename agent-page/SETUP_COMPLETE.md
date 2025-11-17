# Agent Page - Vite Setup Complete! 🎉

## ✅ What's Been Set Up

### 1. Dependencies Installed
- ✅ React 19.2.0
- ✅ React Router DOM (routing)
- ✅ Axios (HTTP client)
- ✅ JsSIP (SIP/VoIP client)
- ✅ Lucide React (icons)
- ✅ Recharts (charts/analytics)
- ✅ Zustand (state management)
- ✅ Tailwind CSS v4 (styling)

### 2. Files Copied from `agent` folder
- ✅ All components (Dashboard, CallPopup, Sidebar, etc.)
- ✅ All pages (Analytics, CallHistory, Settings, etc.)
- ✅ All contexts (ThemeContext, ShiftContext)
- ✅ Store (Zustand state management)
- ✅ Public assets (icons, logos, ringtones)
- ✅ App.jsx and App.css

### 3. Vite-Specific Configurations
- ✅ `baseUrl.js` - Uses `import.meta.env` instead of `process.env`
- ✅ All `.js` files renamed to `.jsx` for better compatibility
- ✅ Tailwind CSS v4 configured with `@import "tailwindcss"`
- ✅ Custom theme colors and styles added
- ✅ `.env.example` created with all required variables

### 4. File Structure
```
agent-page/
├── public/              # Static assets
│   ├── favicon.ico
│   ├── logo.png
│   ├── manifest.json
│   └── ringtones/
├── src/
│   ├── components/      # React components
│   ├── contexts/        # React contexts (Theme, Shift)
│   ├── pages/           # Page components
│   ├── store/           # Zustand store
│   ├── App.jsx          # Main app component
│   ├── baseUrl.js       # API & SIP configuration
│   ├── index.css        # Global styles + Tailwind
│   └── main.jsx         # Entry point
├── .env.example         # Environment variables template
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies
```

## 🚀 Next Steps

### 1. Create Environment File
```bash
cp .env.example .env
```

Edit `.env` with your values:
```bash
VITE_SIP_SERVER=your-sip-server-ip
VITE_SIP_SERVER_PORT=8088
VITE_DEV_BASE_URL=http://your-backend:4000/api
VITE_PROD_BASE_URL=https://your-backend:4000/api
```

### 2. Start Development Server
```bash
npm run dev
```

The app will run on `http://localhost:5173`

### 3. Build for Production
```bash
npm run build
```

Output will be in the `dist/` folder

### 4. Preview Production Build
```bash
npm run preview
```

## 🔧 Key Differences from Create React App

### Environment Variables
**Old (CRA):**
```javascript
const apiUrl = process.env.REACT_APP_API_URL;
const isProduction = process.env.NODE_ENV === 'production';
```

**New (Vite):**
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
const isProduction = import.meta.env.MODE === 'production';
// or
const isProduction = import.meta.env.PROD;
```

### File Extensions
- All React components use `.jsx` extension
- Configuration files use `.js` extension

### Tailwind CSS
- Using Tailwind v4 with `@import "tailwindcss"`
- Dark mode configured with `class` strategy
- Custom theme colors defined in CSS variables

## 📝 Features Included

- ✅ **Dashboard** - Agent performance metrics
- ✅ **Call History** - View past calls with recordings
- ✅ **Analytics** - Charts and statistics
- ✅ **SIP Integration** - WebRTC calling with JsSIP
- ✅ **Theme Switching** - Light/Dark mode toggle
- ✅ **Shift Management** - Clock in/out functionality
- ✅ **Real-time Updates** - Live call status
- ✅ **Responsive Design** - Works on all devices
- ✅ **Call Recording** - Audio playback support

## 🎨 Theming

The app uses a luxury yellow theme with primary and secondary colors:
- Primary: Yellow (#eab308)
- Secondary: Amber (#f59e0b)

Dark mode is fully supported and can be toggled via the navbar.

## 🔐 Authentication

The app uses cookie-based authentication with the backend API.
Login credentials are managed through the `/auth/login` endpoint.

## 📞 SIP/VoIP

WebRTC calling is handled by JsSIP library:
- Automatic registration with SIP server
- Incoming call notifications
- Call controls (hold, mute, transfer)
- Call recording integration

## 🐛 Troubleshooting

### Port Already in Use
If port 5173 is in use, Vite will automatically try the next available port.

### SIP Connection Issues
- Check `VITE_SIP_SERVER` and `VITE_SIP_SERVER_PORT` in `.env`
- Ensure WebSocket server is running on the SIP server
- Check browser console for connection errors

### API Connection Issues
- Verify `VITE_DEV_BASE_URL` points to your backend
- Check CORS settings on the backend
- Ensure cookies are enabled in browser

### Tailwind Styles Not Working
- Restart dev server after changing Tailwind config
- Check that `@import "tailwindcss"` is in `index.css`
- Verify Tailwind classes are used correctly

## 📚 Documentation

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [JsSIP Documentation](https://jssip.net/documentation/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

## 🎉 You're All Set!

Run `npm run dev` and start developing! The app is production-ready and optimized for both local development and server deployment.
