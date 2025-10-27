const express = require("express");
const uploadAudio = require("../controllers/audioControllers/uploadAudio");
const { getRecordings, getRecordingById } = require("../controllers/audioControllers/getRecordings");
const { deleteRecording, deleteAudioFile } = require("../controllers/audioControllers/deleteRecording");
const reorderRecording = require("../controllers/audioControllers/reorderRecording");

const recordingRoutes = express.Router()


// Audio Upload Route
recordingRoutes.post('/upload', uploadAudio);
// Audio retrieval routes
recordingRoutes.get('/recordings', getRecordings);
recordingRoutes.get('/recordings/:id', getRecordingById);
// Delete routes
recordingRoutes.delete('/recordings/:id', deleteRecording);  // Delete entire recording
recordingRoutes.delete('/recordings/:recordingId/files/:fileId', deleteAudioFile);
// Reorder route
recordingRoutes.put('/recordings/:id/reorder', reorderRecording);

module.exports = recordingRoutes;