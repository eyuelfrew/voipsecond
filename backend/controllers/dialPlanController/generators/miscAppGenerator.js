const mongoose = require('mongoose');

// Helper to get recording filename(s) from recording ID
const getRecordingFilenamesArray = (recordingId, allRecordings) => {
  if (!recordingId || !allRecordings) {
    return [];
  }
  let idToCompare = mongoose.Types.ObjectId.isValid(recordingId) ? recordingId.toString() : recordingId;
  const rec = allRecordings.find(r => r._id.toString() === idToCompare);
  if (!rec || !rec.audioFiles || rec.audioFiles.length === 0) {
    return [];
  }
  return rec.audioFiles
    .map(file => `custom/${file.originalName.split('/').pop().replace(/\.\w+$/, '')}`)
    .filter(name => name !== 'custom/');
};

/**
 * Generates Asterisk dialplan code for miscellaneous applications.
 * This function creates feature code bindings that route to various destinations.
 *
 * @param {Array<Object>} allMiscApps An array of misc application objects from the database.
 * @param {Array<Object>} allRecordings An array of recording objects to map recording IDs to filenames.
 * @returns {string} The complete Asterisk dialplan code for misc applications.
 */
const generateMiscApplicationDialplan = (allMiscApps, allRecordings) => {
  let miscAppBindings = '';
  let miscAppContext = '';

  if (allMiscApps.length > 0) {
    // Generate include statement for the main context

    // Generate the [app-miscapps-custom] context
    miscAppContext = '\n[app-miscapps-custom]\n';

    allMiscApps.forEach(app => {
      const destinationType = app.destination.type;
      const destinationId = app.destination.id;
      let asteriskAction = '';

      switch (destinationType) {
        case 'extension':
          asteriskAction = `Dial(PJSIP/${destinationId},30)`;
          break;
        case 'queue':
          asteriskAction = `Goto(ext-queues-custom,${destinationId},1)`;
          break;
        case 'ivr':
          asteriskAction = `Goto(ivr_${destinationId},s,1)`;
          break;
        case 'recording':
          const recordingFilenames = getRecordingFilenamesArray(destinationId, allRecordings);
          if (recordingFilenames.length > 0) {
            // Play all associated recording files
            asteriskAction = recordingFilenames.map(filename => `Playback(${filename})`).join('\nsame => n,');
          } else {
            // Handle case where recording files are not found
            asteriskAction = `NoOp(Recording ID ${destinationId} not found or has no files)`;
          }
          break;
        case 'announcement':
          asteriskAction = `Goto(announcement_${destinationId},s,1)`;
          break;
        default:
          // Handle unknown destination types gracefully
          asteriskAction = `NoOp(Unknown destination type: ${destinationType} for Misc App: ${app.name})`;
          break;
      }

      // Generate the dialplan code for the current miscellaneous application
      miscAppContext += `\n; Feature Code: ${app.name} (${destinationType}: ${destinationId})\n`;
      miscAppContext += `exten => ${app.featureCode},1,NoOp(Executing Misc App: ${app.name})\n`;
      miscAppContext += `same => n,Answer()\n`;
      miscAppContext += `same => n,${asteriskAction}\n`;
      miscAppContext += `same => n,Hangup()\n`;
    });

    miscAppContext += '\n';
  }

  return {
    miscAppBindings: miscAppBindings,
    miscAppContext: miscAppContext
  };
};

module.exports = { generateMiscApplicationDialplan };