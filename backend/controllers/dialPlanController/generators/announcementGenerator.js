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
 * Generates Asterisk dialplan code for announcements (FreePBX style).
 * This function creates dialplan entries for announcements that play
 * recordings and then route to the specified destination.
 *
 * @param {Array<Object>} allAnnouncements An array of announcement objects from the database.
 * @param {Array<Object>} allRecordings An array of recording objects to map recording IDs to filenames.
 * @returns {Object} Object containing announcement config sections and bindings.
 */
const generateAnnouncementDialplan = (allAnnouncements, allRecordings) => {
  let announcementConfigSections = ''; // For [announcement_ID] contexts
  let announcementBindings = '';       // For exten => in [from-internal-custom]

  // Helper to get destination goto string for announcements
  const getAnnouncementDestinationGoto = (destination) => {
    switch (destination.type) {
      case 'ivr':
        return `Goto(ivr_${destination.id},s,1)`;
      case 'queue':
        return `Goto(ext-queues-custom,${destination.id},1)`;
      case 'extension':
        return `Goto(from-internal,${destination.id},1)`;
      case 'hangup':
        return 'Hangup()';
      case 'none':
      default:
        return 'Hangup()';
    }
  };

  allAnnouncements.forEach(announcement => {
    // Only generate dialplan for active announcements
    if (!announcement.isActive) return;

    const safeId = announcement._id.toString();

    // Generate announcement context
    announcementConfigSections += `\n[announcement_${safeId}]\n`;
    
    // Start with Progress if don't answer channel is enabled
    if (announcement.dontAnswerChannel === 'yes') {
      announcementConfigSections += `exten => s,1,Progress\n`;
    } else {
      announcementConfigSections += `exten => s,1,Answer\n`;
      announcementConfigSections += `same => n,Wait(1)\n`;
    }
    
    announcementConfigSections += `same => n(begin),Noop(Playing announcement ${announcement.description})\n`;

    // Set timeout for response if repeat is enabled
    if (announcement.repeat !== 'disable') {
      announcementConfigSections += `same => n,Set(TIMEOUT(response)=1)\n`;
    }

    // Play announcement recording(s) if specified
    if (announcement.recording?.id && announcement.recording.name !== 'None') {
      const announcementRecordingFilenames = getRecordingFilenamesArray(announcement.recording.id, allRecordings);
      if (announcementRecordingFilenames.length > 0) {
        announcementRecordingFilenames.forEach(filename => {
          // Use Background with options based on settings
          let backgroundOptions = '';
          if (announcement.allowSkip === 'no') {
            backgroundOptions = ',n'; // No skip option
          } else {
            backgroundOptions = ',nm'; // Allow skip with no answer
          }
          
          announcementConfigSections += `same => n(play),Background(${filename}${backgroundOptions})\n`;
        });
      } else {
        announcementConfigSections += `same => n,NoOp(Announcement recording not found: ${announcement.recording.id})\n`;
      }
    }

    // Add WaitExten if repeat is enabled
    if (announcement.repeat !== 'disable') {
      announcementConfigSections += `same => n,WaitExten(,)\n`;
    }

    // Route to destination after playback
    const destinationGoto = getAnnouncementDestinationGoto(announcement.destinationAfterPlayback);
    
    // Handle DTMF input if skip is allowed (FreePBX style)
    if (announcement.allowSkip === 'yes') {
      announcementConfigSections += `\nexten => _[0-9*#],1,Noop(User skipped announcement)\n`;
      if (announcement.returnToIVR === 'yes') {
        announcementConfigSections += `same => n,GotoIf($["x\${IVR_CONTEXT}" = "x"]?${destinationGoto}:\${IVR_CONTEXT},return,1)\n`;
      } else {
        announcementConfigSections += `same => n,${destinationGoto}\n`;
      }
    }

    // Add repeat key handler if repeat is enabled
    if (announcement.repeat !== 'disable') {
      announcementConfigSections += `\nexten => ${announcement.repeat},1,Goto(s,play)\n`;
    }

    // Add timeout handler
    announcementConfigSections += `\nexten => t,1,GotoIf($["x\${IVR_CONTEXT}" = "x"]?${destinationGoto}:\${IVR_CONTEXT},return,1)\n`;

    // Handle invalid input
    announcementConfigSections += `\nexten => i,1,GotoIf($["x\${IVR_CONTEXT}" = "x"]?${destinationGoto}:\${IVR_CONTEXT},return,1)\n`;

    // Handle fax detection (FreePBX standard)
    announcementConfigSections += `\nexten => fax,1,Goto(\${CUT(FAX_DEST,^,1)},\${CUT(FAX_DEST,^,2)},\${CUT(FAX_DEST,^,3)})\n`;

    // Generate extension binding if extension is specified
    if (announcement.extension) {
      announcementBindings += `exten => ${announcement.extension},1,Goto(announcement_${safeId},s,1)\n`;
    }
  });

  return { 
    announcementConfigSections: announcementConfigSections.trim() + '\n', 
    announcementBindings: announcementBindings.trim() + '\n' 
  };
};

module.exports = { generateAnnouncementDialplan };