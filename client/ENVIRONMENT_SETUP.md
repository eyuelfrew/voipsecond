# Environment Configuration Guide

## Overview

The client application automatically switches between local and server URLs based on the environment mode. No code changes needed!

## Server Information

**Production Server IP:** `196.189.23.33`

## Configuration Files

### 1. `.env` (Development - Local)
Used when running `npm run dev`
```bash
VITE_DEV_BASE_URL=http://localhost:4000
VITE_DEV_ASTERISK_URL=127.0.0.1
MODE=development
```

### 2. `.env.production` (Production - Server)
Used when running `npm run build`
```bash
VITE_PROD_BASE_URL=http://196.189.23.33:4000
VITE_PROD_ASTERISK_URL=196.189.23.33
MODE=production
```

## How It Works

The application uses `src/config.ts` which automatically detects the environment:

```typescript
// Automatically uses correct URL based on MODE
import { API_URL } from './config';

// In development: http://localhost:4000
// In production: http://196.189.23.33:4000
fetch(`${API_URL}/endpoint`);
```

## Usage in Code

### Option 1: Import from config (Recommended)
```typescript
import { API_URL, ASTERISK_URL } from '../config';

const response = await fetch(`${API_URL}/api/queues`);
```

### Option 2: Import from baseUrl (Legacy support)
```typescript
import baseUrl from '../util/baseUrl';

const response = await fetch(`${baseUrl}/api/queues`);
```

### Option 3: Use functions
```typescript
import { getApiUrl, getAsteriskUrl } from '../config';

const apiUrl = getApiUrl();
const asteriskUrl = getAsteriskUrl();
```

## Development Workflow

### Local Development
```bash
# 1. Ensure .env has MODE=development
MODE=development

# 2. Start dev server
npm run dev

# ✅ Uses: http://localhost:4000
```

### Production Build
```bash
# 1. Build for production
npm run build

# ✅ Automatically uses: http://196.189.23.33:4000

# 2. Preview production build locally
npm run preview
```

### Deploy to Server
```bash
# 1. Build for production
npm run build

# 2. Copy dist/ folder to server
scp -r dist/* user@196.189.23.33:/var/www/html/

# ✅ Server will use: http://196.189.23.33:4000
```

## Environment Variables

| Variable | Development | Production |
|----------|-------------|------------|
| `VITE_DEV_BASE_URL` | `http://localhost:4000` | Not used |
| `VITE_PROD_BASE_URL` | Not used | `http://196.189.23.33:4000` |
| `VITE_DEV_ASTERISK_URL` | `127.0.0.1` | Not used |
| `VITE_PROD_ASTERISK_URL` | Not used | `196.189.23.33` |
| `MODE` | `development` | `production` |

## Switching Environments

### To Use Local Backend
```bash
# In .env
MODE=development
```

### To Use Server Backend (while developing)
```bash
# In .env
MODE=production
```

### To Build for Server
```bash
npm run build
# Automatically uses production settings
```

## Troubleshooting

### Issue: Still connecting to localhost in production
**Solution:** Check that `MODE=production` in `.env.production`

### Issue: CORS errors
**Solution:** Ensure backend allows requests from your domain

### Issue: Can't connect to server
**Solution:** 
1. Check server IP is correct: `196.189.23.33`
2. Ensure backend is running on port 4000
3. Check firewall allows port 4000

## Files Updated

All files now use the centralized config:
- ✅ `src/config.ts` - Main configuration
- ✅ `src/util/baseUrl.ts` - Updated to use config
- ✅ `.env` - Development settings
- ✅ `.env.production` - Production settings
- ✅ `.env.example` - Template

## Benefits

1. **No Code Changes** - Switch environments by changing MODE
2. **Centralized Config** - All URLs in one place
3. **Type Safe** - TypeScript support
4. **Easy Deployment** - Build once, deploy anywhere
5. **Clear Separation** - Development vs Production

## Quick Reference

```bash
# Local development
MODE=development npm run dev

# Production build
npm run build

# Test production build locally
npm run preview
```

## Server Deployment Checklist

- [ ] Update `.env.production` with server IP
- [ ] Run `npm run build`
- [ ] Copy `dist/` folder to server
- [ ] Ensure backend is running on server
- [ ] Test application on server
- [ ] Check browser console for errors

## Need Help?

- Check `src/config.ts` for current configuration
- Look at browser console for environment logs (development only)
- Verify `.env` and `.env.production` files exist
- Ensure `MODE` variable is set correctly
