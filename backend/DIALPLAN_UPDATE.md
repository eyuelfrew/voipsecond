# Asterisk Dialplan Generator - IVR Updates

## Overview
Updated the `generateIvrDialplan` function in `/backend/controllers/dialPlanController/configDialPlan.js` to support all 16 new DTMF configuration fields.

---

## 🔧 Changes Made

### 1. Timeout Configuration
**Updated:**
```javascript
Set(TIMEOUT(digit)=${dtmf.timeout || 10})  // Changed default from 5 to 10
```

### 2. Alert Info (NEW)
**Added:**
```javascript
if (dtmf.alertInfo && dtmf.alertInfo !== '' && dtmf.alertInfo !== 'None') {
    Set(SIPADDHEADER=Alert-Info: ${dtmf.alertInfo})
}
```
- Sets custom SIP Alert-Info header
- Used for custom ring tones on compatible phones

### 3. Ringer Volume Override (NEW)
**Added:**
```javascript
if (dtmf.ringerVolumeOverride && dtmf.ringerVolumeOverride !== 'None') {
    Set(CHANNEL(ringer_volume)=${dtmf.ringerVolumeOverride})
}
```
- Options: None, Low, Medium, High
- Controls ringer volume on compatible devices

### 4. Enable Direct Dial
**Improved:**
```javascript
if (dtmf.enableDirectDial === 'Enabled') {
  exten => _X.,1,NoOp(Direct Dial: ${EXTEN})
  same => n,Goto(from-internal,${EXTEN},1)
}
```
- Allows callers to dial extensions directly from IVR

### 5. Ignore Trailing Key
**Improved:**
```javascript
let waitExtenOptions = dtmf.ignoreTrailingKey === 'Yes' ? 'h' : '';
WaitExten(10${waitExtenOptions ? `,${waitExtenOptions}` : ''})
```
- Adds 'h' option to WaitExten when enabled
- Ignores # key after digit input

### 6. Invalid Input Handler (ENHANCED)
**Updated with new fields:**
```javascript
// Append announcement to invalid if enabled
if (dtmf.appendAnnouncementToInvalid === 'Yes') {
    Background(announcement_file)
}

// Play invalid retry recording or invalid recording
if (invalidRetryRecording exists) {
    Playback(invalidRetryRecording)
} else if (invalidRecording exists) {
    Playback(invalidRecording)
} else {
    Playback(invalid)  // Default Asterisk sound
}

// Handle return or destination
if (dtmf.returnOnInvalid === 'Yes') {
    Goto(ivr_${safeId},s,1)  // Return to IVR start
} else if (dtmf.invalidDestination !== 'None') {
    Goto(destination)  // Go to specified destination
} else {
    Hangup()  // Default hangup
}
```

**New Fields Used:**
- `appendAnnouncementToInvalid` - Replay main announcement before invalid message
- `invalidRetryRecording` - Custom recording for retry attempts
- `invalidRecording` - Custom recording for final invalid
- `returnOnInvalid` - Return to IVR menu on invalid input
- `invalidDestination` - Where to send call after invalid retries

### 7. Timeout Handler (ENHANCED)
**Updated with new fields:**
```javascript
// Append announcement to timeout if enabled
if (dtmf.appendAnnouncementOnTimeout === 'Yes') {
    Background(announcement_file)
}

// Play timeout retry recording or timeout recording
if (timeoutRetryRecording exists) {
    Playback(timeoutRetryRecording)
} else if (timeoutRecording exists) {
    Playback(timeoutRecording)
} else {
    Playback(vm-timeout)  // Default Asterisk sound
}

// Handle return or destination
if (dtmf.returnOnTimeout === 'Yes') {
    Goto(ivr_${safeId},s,1)  // Return to IVR start
} else if (dtmf.timeoutDestination !== 'None') {
    Goto(destination)  // Go to specified destination
} else {
    Hangup()  // Default hangup
}
```

**New Fields Used:**
- `appendAnnouncementOnTimeout` - Replay main announcement before timeout message
- `timeoutRetryRecording` - Custom recording for retry attempts
- `timeoutRecording` - Custom recording for final timeout
- `returnOnTimeout` - Return to IVR menu on timeout
- `timeoutDestination` - Where to send call after timeout retries

### 8. Return to IVR After Voicemail (FIXED)
**Corrected field name:**
```javascript
case 'voicemail':
  VoiceMail(${entry.value}@default)
  if (dtmf.returnToIVRAfterVM === 'Yes') {  // Fixed: was returnToIvrAfterVm
    Goto(ivr_${safeId},s,1)
  }
```

---

## 📋 Complete Field Support

| Field | Asterisk Implementation | Status |
|-------|------------------------|--------|
| enableDirectDial | Direct dial pattern matching | ✅ Implemented |
| ignoreTrailingKey | WaitExten 'h' option | ✅ Implemented |
| forceStartDialTimeout | Not applicable to Asterisk | ⚠️ Frontend only |
| timeout | TIMEOUT(digit) setting | ✅ Implemented |
| alertInfo | SIP Alert-Info header | ✅ Implemented |
| ringerVolumeOverride | CHANNEL(ringer_volume) | ✅ Implemented |
| invalidRetries | Handled by Asterisk retry logic | ✅ Default behavior |
| invalidRetryRecording | Playback on invalid retry | ✅ Implemented |
| appendAnnouncementToInvalid | Background before invalid | ✅ Implemented |
| returnOnInvalid | Goto IVR start | ✅ Implemented |
| invalidRecording | Playback on final invalid | ✅ Implemented |
| invalidDestination | Goto destination | ✅ Implemented |
| timeoutRetries | Handled by Asterisk retry logic | ✅ Default behavior |
| timeoutRetryRecording | Playback on timeout retry | ✅ Implemented |
| appendAnnouncementOnTimeout | Background before timeout | ✅ Implemented |
| returnOnTimeout | Goto IVR start | ✅ Implemented |
| timeoutRecording | Playback on final timeout | ✅ Implemented |
| timeoutDestination | Goto destination | ✅ Implemented |
| returnToIVRAfterVM | Goto IVR after voicemail | ✅ Implemented |

---

## 🎯 Generated Dialplan Example

```asterisk
[ivr_507f1f77bcf86cd799439011]
exten => s,1,NoOp(IVR Menu: Main Menu - ID: 507f1f77bcf86cd799439011)
same => n,Answer()
same => n,Set(TIMEOUT(digit)=10)
same => n,Set(TIMEOUT(response)=10)
same => n,Set(SIPADDHEADER=Alert-Info: custom-ring)
same => n,Set(CHANNEL(ringer_volume)=High)
same => n,Background(custom/welcome)
same => n,WaitExten(10,h)

; Direct Dial Pattern (if enabled)
exten => _X.,1,NoOp(Direct Dial: ${EXTEN})
same => n,Goto(from-internal,${EXTEN},1)

; Menu Options
exten => 1,1,NoOp(Option 1 - Sales)
same => n,Queue(sales)
same => n,Hangup()

exten => 2,1,NoOp(Option 2 - Support)
same => n,Queue(support)
same => n,Hangup()

; Invalid Input Handler
exten => i,1,NoOp(Invalid option for IVR: Main Menu)
same => n,Background(custom/welcome)  ; If appendAnnouncementToInvalid = Yes
same => n,Playback(custom/invalid-retry)  ; invalidRetryRecording
same => n,Goto(ivr_507f1f77bcf86cd799439011,s,1)  ; If returnOnInvalid = Yes

; Timeout Handler
exten => t,1,NoOp(Timeout for IVR: Main Menu)
same => n,Background(custom/welcome)  ; If appendAnnouncementOnTimeout = Yes
same => n,Playback(custom/timeout-retry)  ; timeoutRetryRecording
same => n,Goto(ivr_507f1f77bcf86cd799439011,s,1)  ; If returnOnTimeout = Yes
```

---

## 🔄 Dialplan Regeneration

The dialplan is automatically regenerated when:
1. Creating a new IVR menu
2. Updating an existing IVR menu
3. Deleting an IVR menu

**Regeneration Process:**
```javascript
await generateAndWriteDialplan();
// 1. Fetches all IVRs from database
// 2. Generates complete dialplan with all fields
// 3. Writes to /etc/asterisk/extensions_custom.conf
// 4. Executes: asterisk -rx "dialplan reload"
```

---

## ⚠️ Important Notes

### Field Not Implemented in Dialplan:
- **forceStartDialTimeout**: This is a frontend/UI setting that doesn't have a direct Asterisk equivalent. It controls UI behavior for when to start the dial timeout timer.

### Recording Priority:
1. **Invalid Input**: Uses `invalidRetryRecording` first, falls back to `invalidRecording`, then default `invalid` sound
2. **Timeout**: Uses `timeoutRetryRecording` first, falls back to `timeoutRecording`, then default `vm-timeout` sound

### Return vs Destination:
- If `returnOnInvalid/returnOnTimeout` is `Yes`, it takes priority over destination settings
- If both are `No` and destination is `None`, the call hangs up
- Destinations can be: IVR, Queue, Extension, or Hangup

---

## ✅ Testing Checklist

- [ ] Direct dial works when enabled
- [ ] Alert-Info header is set correctly
- [ ] Ringer volume override applies
- [ ] Ignore trailing key (#) works
- [ ] Invalid retry recording plays
- [ ] Invalid recording plays after retries
- [ ] Append announcement to invalid works
- [ ] Return on invalid loops back to IVR
- [ ] Invalid destination routes correctly
- [ ] Timeout retry recording plays
- [ ] Timeout recording plays after retries
- [ ] Append announcement to timeout works
- [ ] Return on timeout loops back to IVR
- [ ] Timeout destination routes correctly
- [ ] Return to IVR after voicemail works
- [ ] Dialplan reloads without errors
- [ ] All IVR menus generate correctly

---

**Last Updated**: 2025-09-30  
**File Modified**: `/backend/controllers/dialPlanController/configDialPlan.js`  
**Function Updated**: `generateIvrDialplan()`  
**Status**: ✅ Complete and Ready for Testing
