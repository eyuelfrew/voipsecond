# Wrap-Up Time Visual Guide

## Queue Members Page

### Before Integration
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Queue Members                                                                │
├─────────┬────────┬────────────┬────────┬────────┬──────────────┬───────────┤
│ Queue   │ Agent  │ Membership │ Status │ Paused │ Pause Reason │ Calls     │
├─────────┼────────┼────────────┼────────┼────────┼──────────────┼───────────┤
│ Support │ 1003   │ dynamic    │ Idle   │ Active │ -            │ 15        │
│ Support │ 1004   │ dynamic    │ In Use │ Active │ -            │ 12        │
└─────────┴────────┴────────────┴────────┴────────┴──────────────┴───────────┘
```

### After Integration
```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Queue Members                                                                         │
├─────────┬────────┬────────────┬────────┬────────┬──────────────┬──────────┬─────────┤
│ Queue   │ Agent  │ Membership │ Status │ Paused │ Pause Reason │ Wrap-Up  │ Calls   │
├─────────┼────────┼────────────┼────────┼────────┼──────────────┼──────────┼─────────┤
│ Support │ 1003   │ dynamic    │ Idle   │ Active │ -            │ -        │ 15      │
│ Support │ 1004   │ dynamic    │ In Use │ Paused │ Wrap-up      │ 🔄 In    │ 12      │
│         │        │            │        │        │              │  Wrap-Up │         │
└─────────┴────────┴────────────┴────────┴────────┴──────────────┴──────────┴─────────┘
```

**New Column: "Wrap-Up"**
- Shows "-" when agent is not in wrap-up
- Shows animated purple badge "🔄 In Wrap-Up" when agent is wrapping up
- Badge has spinning clock icon and pulse animation

## Agent Dashboard

### Before Integration
```
┌─────────────────────────────────────────────────────────────────┐
│ Call Handling Metrics                                            │
├─────────────────────────────────────────────────────────────────┤
│ Average Wrap Time                                    0s          │
│ Average Hold Time                                    15s         │
│ Longest Idle Time                                    120s        │
└─────────────────────────────────────────────────────────────────┘
```

### After Integration
```
┌─────────────────────────────────────────────────────────────────┐
│ Call Handling Metrics                                            │
├─────────────────────────────────────────────────────────────────┤
│ Average Wrap Time                                    45s         │
│ Average Hold Time                                    15s         │
│ Longest Idle Time                                    120s        │
└─────────────────────────────────────────────────────────────────┘
```

**Updates:**
- Shows average wrap-up time for today
- Refreshes every 10 seconds automatically
- No live timer (keeps dashboard simple)
- Consistent with other metrics

## Visual Elements

### Wrap-Up Badge (Queue Members)
```
┌──────────────────────────────┐
│  🔄  In Wrap-Up              │  ← Purple background
│                              │  ← Pulse animation
│                              │  ← Spinning clock icon
└──────────────────────────────┘
```

**CSS Classes:**
- `bg-purple-500/20` - Purple background with transparency
- `text-purple-400` - Purple text
- `animate-pulse` - Pulsing animation
- `animate-spin` - Spinning clock icon

### Live Timer (Dashboard)
```
┌──────────────────────┐
│  🔄  0:45            │  ← Purple badge
│                      │  ← Counts up every second
│                      │  ← Spinning clock icon
└──────────────────────┘
```

**Features:**
- Updates every second
- Format: M:SS (e.g., 0:05, 1:23, 10:45)
- Appears only when agent is in wrap-up
- Positioned next to average wrap time

## User Experience Flow

### Agent Perspective

1. **Call Ends**
   ```
   [Call Completed] → [Wrap-Up Starts]
   ```
   - Agent performs wrap-up activities
   - Can pause queue if needed

2. **During Wrap-Up**
   ```
   [Performing Wrap-Up Activities]
   ```
   - Agent completes post-call tasks
   - Dashboard shows current average wrap time

3. **Wrap-Up Complete**
   ```
   [Unpause] → [Wrap-Up Ends]
   ```
   - Average wrap time updates within 10 seconds
   - Ready for next call

### Supervisor Perspective

1. **Monitoring Queue Members**
   ```
   [View Queue Members Page]
   ```
   - See all agents in real-time
   - Identify agents in wrap-up
   - Monitor wrap-up duration

2. **Agent in Wrap-Up**
   ```
   Agent 1003: [🔄 In Wrap-Up]
   Agent 1004: [-]
   Agent 1005: [🔄 In Wrap-Up]
   ```
   - Purple badges indicate wrap-up status
   - Can see which agents are unavailable
   - Can identify patterns

3. **Performance Tracking**
   ```
   [View Analytics]
   ```
   - Average wrap times per agent
   - Wrap-up trends over time
   - Identify training needs

## Color Scheme

### Wrap-Up Indicators
- **Purple** (`#a855f7`): Wrap-up in progress
  - Background: `bg-purple-500/20` (20% opacity)
  - Text: `text-purple-400`
  - Border: `border-purple-500`

### Status Colors (Existing)
- **Green** (`#10b981`): Available/Idle
- **Blue** (`#3b82f6`): In Use/On Call
- **Red** (`#ef4444`): Paused/Unavailable
- **Yellow** (`#f59e0b`): Ringing
- **Orange** (`#f97316`): On Hold

## Animation Details

### Pulse Animation
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```
- Duration: 2 seconds
- Infinite loop
- Applied to wrap-up badge

### Spin Animation
```css
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```
- Duration: 1 second
- Infinite loop
- Applied to clock icon

## Responsive Design

### Desktop View (>1024px)
```
┌────────────────────────────────────────────────────────────────┐
│ Queue │ Agent │ Membership │ Status │ Paused │ Reason │ Wrap-Up│
├───────┼───────┼────────────┼────────┼────────┼────────┼────────┤
│ Full table with all columns visible                            │
└────────────────────────────────────────────────────────────────┘
```

### Tablet View (768px - 1024px)
```
┌──────────────────────────────────────────────────────┐
│ Queue │ Agent │ Status │ Paused │ Wrap-Up │ Calls   │
├───────┼───────┼────────┼────────┼─────────┼─────────┤
│ Condensed view with essential columns               │
└──────────────────────────────────────────────────────┘
```

### Mobile View (<768px)
```
┌────────────────────────┐
│ Agent: 1003            │
│ Status: In Use         │
│ Wrap-Up: 🔄 In Wrap-Up │
│ Calls: 15              │
├────────────────────────┤
│ Agent: 1004            │
│ Status: Idle           │
│ Wrap-Up: -             │
│ Calls: 12              │
└────────────────────────┘
```

## Accessibility

### Screen Reader Support
- Wrap-up badge: "Agent in wrap-up mode"
- Live timer: "Wrap-up time: 45 seconds"
- Status changes announced automatically

### Keyboard Navigation
- Tab through table rows
- Focus indicators on interactive elements
- Keyboard shortcuts for common actions

### Color Contrast
- Purple badge: WCAG AA compliant
- Text contrast ratio: 4.5:1 minimum
- Icons have text alternatives

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Features Used
- CSS Grid/Flexbox
- CSS Animations
- WebSocket (Socket.IO)
- ES6+ JavaScript

## Performance

### Rendering
- Virtual scrolling for large agent lists
- Debounced updates (max 1 per second)
- Optimized re-renders with React.memo

### Network
- Socket.IO for real-time updates
- Minimal payload size
- Automatic reconnection

### Memory
- Cleanup on component unmount
- No memory leaks
- Efficient state management
