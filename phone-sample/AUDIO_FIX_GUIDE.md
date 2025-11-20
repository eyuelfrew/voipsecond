# Audio Fix Guide - Simple WebRTC Phone

## The Problem

The simple-webrtc-phone wasn't playing remote audio (IVR, ringback tones, or voice) even though the audio stream was being received.

## Root Cause

The code was setting `srcObject` on the audio element but **never calling `.play()`**. 

### What Was Missing:

```javascript
// ❌ WRONG - Audio won't play
this.elements.remoteAudio.srcObject = remoteAudioStream;
```

### What's Needed:

```javascript
// ✅ CORRECT - Audio will play
this.elements.remoteAudio.srcObject = remoteAudioStream;
this.elements.remoteAudio.onloadedmetadata = () => {
    this.elements.remoteAudio.play();
};
```

## The Fix

I've added the critical `.play()` call in two places:

### 1. In the `trackAdded` event handler:

```javascript
if (remoteAudioStream.getAudioTracks().length > 0) {
    this.elements.remoteAudio.srcObject = remoteAudioStream;
    this.elements.remoteAudio.volume = 1.0;
    
    // CRITICAL: Wait for metadata to load, then play
    this.elements.remoteAudio.onloadedmetadata = () => {
        console.log('Remote audio metadata loaded, playing...');
        this.elements.remoteAudio.play()
            .then(() => {
                console.log('Remote audio playing successfully');
            })
            .catch((error) => {
                console.error('Error playing remote audio:', error);
                alert('Click OK to enable audio playback');
                this.elements.remoteAudio.play();
            });
    };
}
```

### 2. In the `SessionState.Established` handler:

```javascript
if (remoteAudioStream.getAudioTracks().length > 0) {
    this.elements.remoteAudio.srcObject = remoteAudioStream;
    this.elements.remoteAudio.volume = 1.0;
    
    // CRITICAL: Wait for metadata to load, then play
    this.elements.remoteAudio.onloadedmetadata = () => {
        console.log('Remote audio metadata loaded (established), playing...');
        this.elements.remoteAudio.play()
            .then(() => {
                console.log('Remote audio playing successfully');
            })
            .catch((error) => {
                console.error('Error playing remote audio:', error);
                alert('Click OK to enable audio playback');
                this.elements.remoteAudio.play();
            });
    };
}
```

## Why This Works

### 1. `onloadedmetadata` Event
- Waits for the audio stream metadata to be loaded
- Ensures the audio element is ready to play
- Prevents "NotSupportedError" or "AbortError"

### 2. `.play()` Method
- Actually starts audio playback
- Returns a Promise for error handling
- Required by browsers - autoplay alone isn't enough

### 3. Error Handling
- Catches autoplay policy violations
- Shows alert to get user interaction
- Retries playback after user clicks OK

## Browser Autoplay Policies

Modern browsers block autoplay of audio unless:
1. User has interacted with the page (click, tap, etc.)
2. The site is whitelisted
3. The user has enabled autoplay in settings

Our fix handles this by:
- Trying to play automatically
- If blocked, showing an alert (user interaction)
- Playing again after the alert is dismissed

## Testing

### 1. Make a Call
```
1. Register with extension (e.g., 102)
2. Call another extension (e.g., 100)
3. Should hear ringback tone
4. When answered, should hear voice
```

### 2. Receive a Call
```
1. Register with extension (e.g., 102)
2. Have someone call you
3. Should hear ringing
4. Answer the call
5. Should hear voice
```

### 3. Call IVR
```
1. Register with extension
2. Call an IVR number (e.g., *65 for music on hold)
3. Should hear IVR prompts/music
```

## Console Logs

When audio is working, you'll see:

```
✅ GOOD:
Adding remote audio track: MediaStreamTrack
Attached remote audio to remoteAudio element
Remote audio metadata loaded, playing...
Remote audio playing successfully
```

If there's an issue:

```
❌ BAD:
Error playing remote audio: NotAllowedError
(Then alert appears for user interaction)
```

## Comparison with Main Phone Code

The main `phone.js` does this correctly:

```javascript
var remoteAudio = $("#line-" + lineObj.LineNumber + "-remoteAudio").get(0);
remoteAudio.srcObject = remoteAudioStream;
remoteAudio.onloadedmetadata = function(e) {
    if (typeof remoteAudio.sinkId !== 'undefined') {
        remoteAudio.setSinkId(getAudioOutputID()).then(function(){
            console.log("sinkId applied: "+ getAudioOutputID());
        }).catch(function(e){
            console.warn("Error using setSinkId: ", e);
        });
    }
    remoteAudio.play();  // ← THE CRITICAL LINE
}
```

## HTML Audio Element

The HTML already has the audio element configured correctly:

```html
<audio id="remoteAudio" autoplay style="display: none;"></audio>
```

- `autoplay` attribute helps but isn't sufficient alone
- `style="display: none;"` hides it (audio doesn't need to be visible)
- Still needs `.play()` to be called in JavaScript

## Additional Improvements

### Volume Control
```javascript
this.elements.remoteAudio.volume = 1.0; // Full volume
```

### Error Recovery
```javascript
.catch((error) => {
    console.error('Error playing remote audio:', error);
    alert('Click OK to enable audio playback');
    this.elements.remoteAudio.play(); // Retry after user interaction
});
```

## Common Issues

### Issue 1: "NotAllowedError"
**Cause**: Browser autoplay policy
**Fix**: User must interact with page first (click, tap)
**Solution**: Alert prompts user interaction, then retries

### Issue 2: "AbortError"
**Cause**: Trying to play before metadata loaded
**Fix**: Use `onloadedmetadata` event
**Solution**: Already implemented

### Issue 3: No audio tracks
**Cause**: Remote party not sending audio
**Fix**: Check remote party's microphone
**Solution**: Log shows "Adding remote audio track" when working

### Issue 4: Volume too low
**Cause**: Volume not set
**Fix**: Set volume to 1.0
**Solution**: Already implemented

## Summary

The fix was simple but critical:

1. ✅ Set `srcObject` on audio element
2. ✅ Wait for `onloadedmetadata` event
3. ✅ Call `.play()` method
4. ✅ Handle errors with user interaction
5. ✅ Set volume to maximum

**Audio should now work perfectly!** 🎉🔊

## Testing Checklist

- [ ] Can hear ringback tone when calling
- [ ] Can hear remote party's voice
- [ ] Can hear IVR prompts
- [ ] Can hear music on hold
- [ ] Volume is loud enough
- [ ] No console errors
- [ ] Works on first call
- [ ] Works on subsequent calls
- [ ] Works for incoming calls
- [ ] Works for outgoing calls

All should be ✅ now!
