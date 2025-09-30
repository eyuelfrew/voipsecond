const IVRMenu = require('../../models/ivr_model');

// Get all IVR menus
const getAllMenus = async (req, res) => {
  try {
    const menus = await IVRMenu.find().sort({ createdAt: -1 });
    res.json(menus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } 
};

// Get a single IVR menu by ID
const getMenuById = async (req, res) => {
  try {
    const menu = await IVRMenu.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update an IVR menu
const updateMenu = async (req, res) => {
  try {
    const { name, description, dtmf, entries, extension } = req.body;
    console.log('Updating IVR menu:', req.params.id, req.body);

    // 1. Find the existing menu
    const menu = await IVRMenu.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({
        status: 404,
        message: "IVR menu not found",
        error: "Menu with the specified ID does not exist"
      });
    }

    // 2. Validate required fields
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

    // 3. Update the menu fields
    menu.name = name;
    menu.description = description || '';
    menu.dtmf = {
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
    };
    menu.entries = (entries || []).map(entry => ({
      id: entry.id || Date.now(),
      type: entry.type,
      digit: entry.digit,
      value: entry.value,
      label: entry.label || `Option ${entry.digit}`
    }));
    menu.extension = extension || '';

    // 4. Save the updated menu
    await menu.save();

    res.status(200).json({
      status: 200,
      message: 'IVR menu updated successfully',
      menu
    });
  } catch (error) {
    console.error('Error updating IVR menu:', error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete an IVR menu
const deleteMenu = async (req, res) => {
  try {
    const menu = await IVRMenu.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }
    // Delete from database
    await menu.deleteOne();
    res.status(204).send();

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllMenus,
  getMenuById,
  updateMenu,
  deleteMenu
};
