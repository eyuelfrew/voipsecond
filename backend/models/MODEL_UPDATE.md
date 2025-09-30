# IVR Menu Model Update Documentation

## Overview
This document outlines the required updates to the IVR Menu MongoDB schema to support all the new fields added to the frontend form.

## Current Schema vs Updated Schema

### Current Schema Fields
```javascript
{
  name: String (required),
  description: String,
  dtmf: {
    announcement: { id: String, name: String },
    timeout: Number (default: 5),
    invalidRetries: Number (default: 3),
    timeoutRetries: Number (default: 3),
    invalidRetryRecording: { id: String, name: String }
  },
  entries: [{ id, type, digit, value }]
}
```

### Updated Schema - New Fields Required

The following fields need to be added to the `dtmf` object in the schema:

```javascript
dtmf: {
  // Existing fields
  announcement: { id: String, name: String },
  timeout: Number,
  invalidRetries: Number,
  timeoutRetries: Number,
  invalidRetryRecording: { id: String, name: String },
  
  // NEW FIELDS TO ADD:
  enableDirectDial: {
    type: String,
    enum: ['Disabled', 'Enabled'],
    default: 'Disabled'
  },
  ignoreTrailingKey: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'Yes'
  },
  forceStartDialTimeout: {
    type: String,
    enum: ['Yes', 'No', 'No - Legacy'],
    default: 'No'
  },
  alertInfo: {
    type: String,
    default: ''
  },
  ringerVolumeOverride: {
    type: String,
    enum: ['None', 'Low', 'Medium', 'High'],
    default: 'None'
  },
  appendAnnouncementToInvalid: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  returnOnInvalid: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  invalidRecording: {
    id: {
      type: String,
      default: ''
    },
    name: {
      type: String,
      default: ''
    }
  },
  invalidDestination: {
    type: String,
    default: 'None'
  },
  timeoutRetryRecording: {
    id: {
      type: String,
      default: ''
    },
    name: {
      type: String,
      default: ''
    }
  },
  appendAnnouncementOnTimeout: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  returnOnTimeout: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  timeoutRecording: {
    id: {
      type: String,
      default: ''
    },
    name: {
      type: String,
      default: ''
    }
  },
  timeoutDestination: {
    type: String,
    default: 'None'
  },
  returnToIVRAfterVM: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  }
}
```

## Complete Updated Schema

```javascript
// IVR Menu Schema - UPDATED VERSION
const mongoose = require('mongoose');

const ivrMenuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dtmf: {
    announcement: {
      id: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      }
    },
    enableDirectDial: {
      type: String,
      enum: ['Disabled', 'Enabled'],
      default: 'Disabled'
    },
    ignoreTrailingKey: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'Yes'
    },
    forceStartDialTimeout: {
      type: String,
      enum: ['Yes', 'No', 'No - Legacy'],
      default: 'No'
    },
    timeout: {
      type: Number,
      default: 10
    },
    alertInfo: {
      type: String,
      default: ''
    },
    ringerVolumeOverride: {
      type: String,
      enum: ['None', 'Low', 'Medium', 'High'],
      default: 'None'
    },
    invalidRetries: {
      type: Number,
      default: 3
    },
    invalidRetryRecording: {
      id: {
        type: String,
        default: ''
      },
      name: {
        type: String,
        default: ''
      }
    },
    appendAnnouncementToInvalid: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No'
    },
    returnOnInvalid: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No'
    },
    invalidRecording: {
      id: {
        type: String,
        default: ''
      },
      name: {
        type: String,
        default: ''
      }
    },
    invalidDestination: {
      type: String,
      default: 'None'
    },
    timeoutRetries: {
      type: Number,
      default: 3
    },
    timeoutRetryRecording: {
      id: {
        type: String,
        default: ''
      },
      name: {
        type: String,
        default: ''
      }
    },
    appendAnnouncementOnTimeout: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No'
    },
    returnOnTimeout: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No'
    },
    timeoutRecording: {
      id: {
        type: String,
        default: ''
      },
      name: {
        type: String,
        default: ''
      }
    },
    timeoutDestination: {
      type: String,
      default: 'None'
    },
    returnToIVRAfterVM: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No'
    }
  },
  entries: [{
    id: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    digit: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true
});

// Create indexes for better query performance
ivrMenuSchema.index({ name: 1 }); 
ivrMenuSchema.index({ 'entries.digit': 1 });

const IVRMenu = mongoose.model('IVRMenu', ivrMenuSchema);

module.exports = IVRMenu;
```

## Migration Notes

### Important Changes:
1. **Default timeout changed**: From `5` to `10` seconds (matches frontend default)
2. **16 new fields added** to the `dtmf` object
3. **All new fields have default values** - existing documents will work without migration
4. **Enums added** for validation on toggle fields (Yes/No options)

### Backward Compatibility:
- ✅ All new fields have default values
- ✅ Existing documents will automatically get defaults when queried
- ✅ No breaking changes to existing fields
- ✅ No data migration required

### Testing Checklist:
- [ ] Update the model file in `/backend/models/`
- [ ] Test creating new IVR menu with all fields
- [ ] Test updating existing IVR menu
- [ ] Verify existing IVR menus still load correctly
- [ ] Test form submission from frontend
- [ ] Verify all toggle buttons save correctly
- [ ] Test all recording dropdowns save properly

## API Endpoint Updates

No changes required to API endpoints - they will automatically handle the new fields since we're using the same structure.

## Frontend-Backend Field Mapping

All frontend fields map 1:1 to backend schema fields:

| Frontend Field | Backend Path | Type |
|----------------|--------------|------|
| Enable Direct Dial | `dtmf.enableDirectDial` | String (Disabled/Enabled) |
| Ignore Trailing Key | `dtmf.ignoreTrailingKey` | String (Yes/No) |
| Force Start Dial Timeout | `dtmf.forceStartDialTimeout` | String (Yes/No/No - Legacy) |
| Alert Info | `dtmf.alertInfo` | String |
| Ringer Volume Override | `dtmf.ringerVolumeOverride` | String (None/Low/Medium/High) |
| Append Announcement to Invalid | `dtmf.appendAnnouncementToInvalid` | String (Yes/No) |
| Return on Invalid | `dtmf.returnOnInvalid` | String (Yes/No) |
| Invalid Recording | `dtmf.invalidRecording` | Object {id, name} |
| Invalid Destination | `dtmf.invalidDestination` | String |
| Timeout Retry Recording | `dtmf.timeoutRetryRecording` | Object {id, name} |
| Append Announcement on Timeout | `dtmf.appendAnnouncementOnTimeout` | String (Yes/No) |
| Return on Timeout | `dtmf.returnOnTimeout` | String (Yes/No) |
| Timeout Recording | `dtmf.timeoutRecording` | Object {id, name} |
| Timeout Destination | `dtmf.timeoutDestination` | String |
| Return to IVR after VM | `dtmf.returnToIVRAfterVM` | String (Yes/No) |

---

**Last Updated**: 2025-09-30  
**Status**: Ready for Implementation  
**Breaking Changes**: None
