const Announcement = require('../models/announcement');
const AudioRecording = require('../models/audioRecording');
const IVRMenu = require('../models/ivr_model');
const Queue = require('../models/queue');
const { generateAndWriteDialplan } = require('./dialPlanController/configDialPlan');

// Get all announcements
const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({})
      .sort({ createdAt: -1 });
    
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch announcements',
      error: error.message 
    });
  }
};

// Get announcement by ID
const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const announcement = await Announcement.findById(id);
    
    if (!announcement) {
      return res.status(404).json({ 
        success: false, 
        message: 'Announcement not found' 
      });
    }
    
    res.json(announcement);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch announcement',
      error: error.message 
    });
  }
};

// Create new announcement
const createAnnouncement = async (req, res) => {
  try {
    const { 
      description, 
      recording, 
      repeat, 
      allowSkip, 
      returnToIVR, 
      dontAnswerChannel, 
      destinationAfterPlayback, 
      extension, 
      isActive 
    } = req.body;

    // Validate required fields
    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    // Validate recording exists if provided
    if (recording?.id && recording.id !== '') {
      const recordingExists = await AudioRecording.findById(recording.id);
      if (!recordingExists) {
        return res.status(400).json({
          success: false,
          message: 'Selected recording does not exist'
        });
      }
    }

    // Validate destination exists based on type
    if (destinationAfterPlayback?.type && destinationAfterPlayback.type !== 'none' && destinationAfterPlayback.type !== 'hangup') {
      let destinationExists = false;
      switch (destinationAfterPlayback.type) {
        case 'ivr':
          destinationExists = await IVRMenu.findById(destinationAfterPlayback.id);
          break;
        case 'queue':
          destinationExists = await Queue.findById(destinationAfterPlayback.id);
          break;
        case 'extension':
          destinationExists = /^\d+$/.test(destinationAfterPlayback.id);
          break;
      }

      if (!destinationExists) {
        return res.status(400).json({
          success: false,
          message: `Selected ${destinationAfterPlayback.type} destination does not exist`
        });
      }
    }

    // Check for duplicate extension if provided
    if (extension) {
      const existingExtension = await Announcement.findOne({ 
        extension: extension
      });
      
      if (existingExtension) {
        return res.status(400).json({
          success: false,
          message: `Extension ${extension} is already in use by another announcement`
        });
      }
    }

    const announcement = new Announcement({
      description,
      recording: recording || { id: null, name: 'None' },
      repeat: repeat || 'disable',
      allowSkip: allowSkip || 'yes',
      returnToIVR: returnToIVR || 'no',
      dontAnswerChannel: dontAnswerChannel || 'no',
      destinationAfterPlayback: destinationAfterPlayback || { type: 'none', id: '', name: '' },
      extension: extension || undefined,
      isActive: isActive !== undefined ? isActive : true
    });

    const savedAnnouncement = await announcement.save();

    // Regenerate dialplan to include the new announcement
    try {
      await generateAndWriteDialplan();
    } catch (dialplanError) {
      console.error('Error regenerating dialplan:', dialplanError);
    }

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: savedAnnouncement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create announcement',
      error: error.message 
    });
  }
};

// Update announcement
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      description, 
      recording, 
      repeat, 
      allowSkip, 
      returnToIVR, 
      dontAnswerChannel, 
      destinationAfterPlayback, 
      extension, 
      isActive 
    } = req.body;

    // Validate required fields
    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    // Check if announcement exists
    const existingAnnouncement = await Announcement.findById(id);
    if (!existingAnnouncement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Validate recording exists if provided
    if (recording?.id && recording.id !== '') {
      const recordingExists = await AudioRecording.findById(recording.id);
      if (!recordingExists) {
        return res.status(400).json({
          success: false,
          message: 'Selected recording does not exist'
        });
      }
    }

    // Validate destination exists based on type
    if (destinationAfterPlayback?.type && destinationAfterPlayback.type !== 'none' && destinationAfterPlayback.type !== 'hangup') {
      let destinationExists = false;
      switch (destinationAfterPlayback.type) {
        case 'ivr':
          destinationExists = await IVRMenu.findById(destinationAfterPlayback.id);
          break;
        case 'queue':
          destinationExists = await Queue.findById(destinationAfterPlayback.id);
          break;
        case 'extension':
          destinationExists = /^\d+$/.test(destinationAfterPlayback.id);
          break;
      }

      if (!destinationExists) {
        return res.status(400).json({
          success: false,
          message: `Selected ${destinationAfterPlayback.type} destination does not exist`
        });
      }
    }

    // Check for duplicate extension if provided and different from current
    if (extension && extension !== existingAnnouncement.extension) {
      const existingExtension = await Announcement.findOne({ 
        extension: extension,
        _id: { $ne: id }
      });
      
      if (existingExtension) {
        return res.status(400).json({
          success: false,
          message: `Extension ${extension} is already in use by another announcement`
        });
      }
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      {
        description,
        recording: recording || { id: null, name: 'None' },
        repeat: repeat || 'disable',
        allowSkip: allowSkip || 'yes',
        returnToIVR: returnToIVR || 'no',
        dontAnswerChannel: dontAnswerChannel || 'no',
        destinationAfterPlayback: destinationAfterPlayback || { type: 'none', id: '', name: '' },
        extension: extension || undefined,
        isActive: isActive !== undefined ? isActive : true
      },
      { new: true, runValidators: true }
    );

    // Regenerate dialplan to reflect the changes
    try {
      await generateAndWriteDialplan();
    } catch (dialplanError) {
      console.error('Error regenerating dialplan:', dialplanError);
    }

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: updatedAnnouncement
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update announcement',
      error: error.message 
    });
  }
};

// Toggle announcement active status
const toggleAnnouncementStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    announcement.isActive = isActive;
    await announcement.save();

    // Regenerate dialplan to reflect the status change
    try {
      await generateAndWriteDialplan();
    } catch (dialplanError) {
      console.error('Error regenerating dialplan:', dialplanError);
    }

    res.json({
      success: true,
      message: `Announcement ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: announcement
    });
  } catch (error) {
    console.error('Error toggling announcement status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update announcement status',
      error: error.message 
    });
  }
};

// Delete announcement
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    await Announcement.findByIdAndDelete(id);

    // Regenerate dialplan to remove the announcement
    try {
      await generateAndWriteDialplan();
    } catch (dialplanError) {
      console.error('Error regenerating dialplan:', dialplanError);
    }

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete announcement',
      error: error.message 
    });
  }
};

module.exports = {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  toggleAnnouncementStatus,
  deleteAnnouncement
};