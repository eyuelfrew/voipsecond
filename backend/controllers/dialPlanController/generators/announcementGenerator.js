const mongoose = require('mongoose');

// Helper to get recording filename(s)
const getRecordingFilenamesArray = (recordingId, allRecordings) => {
  if (!recordingId || !allRecordings) return [];

  let idToCompare = mongoose.Types.ObjectId.isValid(recordingId)
    ? recordingId.toString()
    : recordingId;

  const rec = allRecordings.find(r => r._id.toString() === idToCompare);
  if (!rec || !rec.audioFiles?.length) return [];

  return rec.audioFiles.map(file =>
    `custom/${file.originalName.split('/').pop().replace(/\.\w+$/, '')}`
  );
};

const generateAnnouncementDialplan = (allAnnouncements, allRecordings) => {
  let announcementConfigSections = '';
  let announcementBindings = '';

  // Destination router
  const getAnnouncementDestinationGoto = (destination) => {
    switch (destination.type) {
      case 'ivr': return `Goto(ivr_${destination.id},s,1)`;
      case 'queue': return `Goto(ext-queues-custom,${destination.id},1)`;
      case 'extension': return `Goto(from-internal,${destination.id},1)`;
      case 'hangup': return 'Hangup()';
      case 'none':
      default:
        return 'Hangup()';
    }
  };

  allAnnouncements.forEach(announcement => {
    if (!announcement.isActive) return;

    const safeId = announcement._id.toString();

    announcementConfigSections += `\n[announcement_${safeId}]\n`;

    // If channel must not be answered
    if (announcement.dontAnswerChannel === 'yes') {
      announcementConfigSections += `exten => s,1,Progress\n`;
    } else {
      announcementConfigSections += `exten => s,1,Answer\n`;
      announcementConfigSections += `same => n,Wait(1)\n`;
    }

    announcementConfigSections += `same => n(begin),NoOp(Playing announcement ${announcement.description})\n`;

    // Play recording(s)
    if (announcement.recording?.id && announcement.recording.name !== 'None') {
      const recFiles = getRecordingFilenamesArray(announcement.recording.id, allRecordings);

      recFiles.forEach(filename => {
        // If skipping is allowed → Background
        if (announcement.allowSkip === 'yes') {
          announcementConfigSections += `same => n(play),Background(${filename},nm)\n`;
        } else {
          // If no skip → Playback (never waits)
          announcementConfigSections += `same => n(play),Playback(${filename})\n`;
        }
      });
    }

    // No waiting for input anymore
    // NO WaitExten(), NO TIMEOUT, nothing.

    const gotoDest = getAnnouncementDestinationGoto(announcement.destinationAfterPlayback);
    announcementConfigSections += `same => n,${gotoDest}\n`;

    // Skip handler only if skipping allowed
    if (announcement.allowSkip === 'yes') {
      announcementConfigSections += `\nexten => _[0-9*#],1,NoOp(User skipped announcement)\n`;
      announcementConfigSections += `same => n,${gotoDest}\n`;
    }

    // Bind extension
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
