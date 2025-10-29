# ⚡ Performance Optimization Guide

## Overview
This guide provides comprehensive performance optimization strategies for the Agent Portal application.

## 🎯 Performance Metrics

### Target Metrics
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### Measuring Performance
```bash
# Build and analyze
npm run build
npx source-map-explorer 'build/static/js/*.js'

# Lighthouse audit
npx lighthouse http://localhost:3000 --view

# Bundle analyzer
npm install --save-dev webpack-bundle-analyzer
npm run build -- --stats
npx webpack-bundle-analyzer build/bundle-stats.json
```

## 🚀 Build Optimization

### 1. Production Build
```bash
# Optimized production build
GENERATE_SOURCEMAP=false npm run build

# With compression
GENERATE_SOURCEMAP=false INLINE_RUNTIME_CHUNK=false npm run build
```

### 2. Code Splitting
Already implemented in the app:
```javascript
// Lazy load components
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const TicketList = React.lazy(() => import('./components/TicketList'));
```

### 3. Tree Shaking
Ensure proper imports:
```javascript
// ✅ Good - imports only what's needed
import { Phone, PhoneOff } from 'lucide-react';

// ❌ Bad - imports entire library
import * as Icons from 'lucide-react';
```

### 4. Minimize Dependencies
```bash
# Check bundle size
npm run build
ls -lh build/static/js/*.js

# Remove unused dependencies
npm prune
npm dedupe
```

## 🎨 React Optimization

### 1. Memoization
```javascript
// Memoize expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* render */}</div>;
});

// Memoize callbacks
const handleClick = useCallback(() => {
  // handler logic
}, [dependencies]);

// Memoize computed values
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

### 2. Avoid Unnecessary Re-renders
```javascript
// Use React.memo for pure components
export default React.memo(MyComponent);

// Use proper key props in lists
{items.map(item => (
  <Item key={item.id} {...item} />
))}

// Avoid inline object/array creation
// ❌ Bad
<Component style={{ margin: 10 }} />

// ✅ Good
const style = { margin: 10 };
<Component style={style} />
```

### 3. Virtual Scrolling
For long lists:
```bash
npm install react-window
```

```javascript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={1000}
  itemSize={50}
  width="100%"
>
  {Row}
</FixedSizeList>
```

## 🌐 Network Optimization

### 1. API Optimization
```javascript
// Debounce API calls
import { debounce } from 'lodash';

const debouncedSearch = debounce((query) => {
  fetchResults(query);
}, 300);

// Cache API responses
const cache = new Map();

async function fetchWithCache(url) {
  if (cache.has(url)) {
    return cache.get(url);
  }
  const data = await fetch(url).then(r => r.json());
  cache.set(url, data);
  return data;
}
```

### 2. Image Optimization
```javascript
// Lazy load images
<img 
  src={image} 
  loading="lazy" 
  alt="description"
/>

// Use WebP format
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="description" />
</picture>
```

### 3. Compression
Enable gzip/brotli compression on server:
```nginx
# Nginx configuration
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

## 📱 WebRTC Optimization

### 1. Connection Configuration
```javascript
// Optimized PC configuration
const PC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ],
  rtcpMuxPolicy: 'require',
  bundlePolicy: 'max-bundle',
  iceCandidatePoolSize: 10
};
```

### 2. Audio Optimization
```javascript
// Use optimal codecs
const audioConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 1
  }
};
```

### 3. Connection Monitoring
```javascript
// Monitor connection quality
session.connection.addEventListener('iceconnectionstatechange', () => {
  const state = session.connection.iceConnectionState;
  if (state === 'failed' || state === 'disconnected') {
    // Handle reconnection
  }
});
```

## 💾 Memory Management

### 1. Cleanup
```javascript
useEffect(() => {
  const timer = setInterval(() => {
    // Do something
  }, 1000);

  // Cleanup
  return () => {
    clearInterval(timer);
  };
}, []);
```

### 2. Event Listeners
```javascript
useEffect(() => {
  const handleResize = () => {
    // Handle resize
  };

  window.addEventListener('resize', handleResize);

  // Cleanup
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

### 3. WebRTC Cleanup
```javascript
// Properly close connections
const cleanup = () => {
  if (session) {
    session.terminate();
  }
  if (ua) {
    ua.stop();
  }
};
```

## 🔧 Browser Optimization

### 1. Service Worker
```javascript
// Register service worker for caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### 2. Web Workers
For heavy computations:
```javascript
// worker.js
self.addEventListener('message', (e) => {
  const result = heavyComputation(e.data);
  self.postMessage(result);
});

// main.js
const worker = new Worker('worker.js');
worker.postMessage(data);
worker.addEventListener('message', (e) => {
  console.log(e.data);
});
```

### 3. IndexedDB
For offline storage:
```javascript
// Store data locally
const db = await openDB('agent-db', 1, {
  upgrade(db) {
    db.createObjectStore('calls');
  }
});

await db.put('calls', callData, callId);
```

## 📊 Monitoring

### 1. Performance API
```javascript
// Measure performance
const perfData = performance.getEntriesByType('navigation')[0];
console.log('Load time:', perfData.loadEventEnd - perfData.fetchStart);

// Custom marks
performance.mark('call-start');
// ... do something
performance.mark('call-end');
performance.measure('call-duration', 'call-start', 'call-end');
```

### 2. Error Tracking
```javascript
// Track errors
window.addEventListener('error', (e) => {
  console.error('Error:', e.error);
  // Send to monitoring service
});

// Track unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
});
```

### 3. Analytics
```javascript
// Track user interactions
const trackEvent = (category, action, label) => {
  // Send to analytics service
  console.log('Event:', category, action, label);
};

// Track call metrics
trackEvent('Call', 'Start', callId);
trackEvent('Call', 'End', callId);
```

## 🎯 Specific Optimizations

### Dashboard
```javascript
// Lazy load charts
const Charts = React.lazy(() => import('./Charts'));

// Debounce stats updates
const updateStats = debounce(() => {
  fetchStats();
}, 1000);

// Use pagination for large datasets
const [page, setPage] = useState(1);
const itemsPerPage = 20;
```

### Webphone
```javascript
// Optimize animations
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
  will-change: opacity, transform;
}

// Use CSS transforms instead of position
transform: translateY(10px);  // ✅ Good
top: 10px;                    // ❌ Bad
```

### State Management
```javascript
// Use Zustand selectors
const username = useStore(state => state.agent.username);

// Instead of
const agent = useStore(state => state.agent);
const username = agent.username;
```

## 🚀 Deployment Optimization

### 1. CDN
```bash
# Upload static assets to CDN
aws s3 sync build/static s3://your-cdn-bucket/static
```

### 2. Caching Headers
```nginx
# Nginx caching
location /static/ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

### 3. HTTP/2
```nginx
# Enable HTTP/2
listen 443 ssl http2;
```

## 📈 Performance Checklist

- [ ] Production build with optimizations
- [ ] Code splitting implemented
- [ ] Images optimized and lazy loaded
- [ ] API calls debounced/throttled
- [ ] Proper cleanup in useEffect
- [ ] Memoization for expensive operations
- [ ] Virtual scrolling for long lists
- [ ] Service worker for caching
- [ ] Compression enabled
- [ ] CDN for static assets
- [ ] HTTP/2 enabled
- [ ] Monitoring and analytics
- [ ] Error tracking
- [ ] Performance budgets set

## 🔍 Debugging Performance

### Chrome DevTools
1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Interact with app
5. Stop recording
6. Analyze flame graph

### React DevTools Profiler
1. Install React DevTools extension
2. Open Profiler tab
3. Click Record
4. Interact with app
5. Stop recording
6. Analyze render times

### Network Analysis
1. Open DevTools Network tab
2. Reload page
3. Check:
   - Total size
   - Number of requests
   - Load time
   - Waterfall chart

## 📚 Resources

- [Web.dev Performance](https://web.dev/performance/)
- [React Performance](https://reactjs.org/docs/optimizing-performance.html)
- [WebRTC Best Practices](https://webrtc.org/getting-started/overview)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

---

**Remember**: Measure first, optimize second. Don't optimize prematurely!
