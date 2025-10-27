const AudioRecording = require('../../models/audioRecording');

/**
 * Update the order of audio files in a recording
 * @route PUT /api/audio/recordings/:id/reorder
 */
const reorderRecording = async (req, res) => {
  try {
    const { id } = req.params;
    const { audioFiles } = req.body;

    if (!audioFiles || !Array.isArray(audioFiles)) {
      return res.status(400).json({
        success: false,
        message: 'audioFiles array is required'
      });
    }

    // Find the recording
    const recording = await AudioRecording.findById(id);
    
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found'
      });
    }

    // Update the order of each audio file
    audioFiles.forEach(({ _id, order }) => {
      const fileIndex = recording.audioFiles.findIndex(
        file => file._id.toString() === _id
      );
      
      if (fileIndex !== -1) {
        recording.audioFiles[fileIndex].order = order;
      }
    });

    // Mark the audioFiles array as modified (required for nested arrays in Mongoose)
    recording.markModified('audioFiles');
    
    // Save the updated recording
    await recording.save();

    res.status(200).json({
      success: true,
      message: 'Recording order updated successfully',
      data: recording
    });

  } catch (error) {
    console.error('Error reordering recording:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating recording order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = reorderRecording;
