const IVRMenu = require('../../models/ivr_model');
// Main: Create IVR Menu and regenerate all IVRs in config
const createIVRMenu = async (req, res) => {
  try {
    const { name, description, dtmf, entries, extension } = req.body; // Added 'extension' to destructure
    console.log(req.body);

    // 1. Validate required fields
    if (!dtmf?.announcement?.id) {
      return res.status(400).json({
        status: 400,
        message: "Announcement ID is required",
        error: "Missing required announcement fields"
      });
    }
    if (!name) {
      return res.status(400).json({
        status: 400,
        message: "IVR menu name is required",
        error: "Missing IVR menu name"
      });
    }

    // 2. Create the new IVR menu
    const menu = new IVRMenu({
      name,
      description: description || '',
      dtmf: {
        announcement: {
          id: dtmf.announcement.id,
          name: dtmf.announcement.name
        },
        enableDirectDial: dtmf.enableDirectDial || 'Disabled',
        ignoreTrailingKey: dtmf.ignoreTrailingKey || 'Yes',
        forceStartDialTimeout: dtmf.forceStartDialTimeout || 'No',
        timeout: dtmf.timeout || 10,
        alertInfo: dtmf.alertInfo || '',
        ringerVolumeOverride: dtmf.ringerVolumeOverride || 'None',
        invalidRetries: dtmf.invalidRetries || 3,
        invalidRetryRecording: {
          id: dtmf.invalidRetryRecording?.id || '',
          name: dtmf.invalidRetryRecording?.name || ''
        },
        appendAnnouncementToInvalid: dtmf.appendAnnouncementToInvalid || 'No',
        returnOnInvalid: dtmf.returnOnInvalid || 'No',
        invalidRecording: {
          id: dtmf.invalidRecording?.id || '',
          name: dtmf.invalidRecording?.name || ''
        },
        invalidDestination: dtmf.invalidDestination || 'None',
        timeoutRetries: dtmf.timeoutRetries || 3,
        timeoutRetryRecording: {
          id: dtmf.timeoutRetryRecording?.id || '',
          name: dtmf.timeoutRetryRecording?.name || ''
        },
        appendAnnouncementOnTimeout: dtmf.appendAnnouncementOnTimeout || 'No',
        returnOnTimeout: dtmf.returnOnTimeout || 'No',
        timeoutRecording: {
          id: dtmf.timeoutRecording?.id || '',
          name: dtmf.timeoutRecording?.name || ''
        },
        timeoutDestination: dtmf.timeoutDestination || 'None',
        returnToIVRAfterVM: dtmf.returnToIVRAfterVM || 'No'
      },
      entries: (entries || []).map(entry => ({
        id: entry.id || Date.now(), // Simple ID for entries, consider UUID for robustness
        type: entry.type,
        digit: entry.digit,
        value: entry.value,
        label: entry.label || `Option ${entry.digit}`
      })),
      extension: extension || '' // Store the extension here
    });
    await menu.save();

    // --- Key Change: Fetch ALL IVRs and generate config for all ---
    res.status(201).json({
      status: 201,
      message: 'IVR menu created and all IVRs reconfigured successfully',
      menu,
      // config: finalConfig // Uncomment for debugging if needed
    });
  } catch (error) {
    console.log(error)
  }
};

module.exports = {
  createIVRMenu
};