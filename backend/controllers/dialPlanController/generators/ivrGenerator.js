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

// Helper to generate Asterisk dialplan for IVR menus
const generateIvrDialplan = (allIVRs, allRecordings) => {
  console.log("Generating IVR Dialplan...");

  let ivrConfigSections = ''; // For [ivr_ID] contexts
  let ivrBindings = '';       // For include => in [from-internal-custom]

  // Helper to get destination goto string based on type for IVR entries
  const getDestinationGoto = (destinationValue, currentIvrId) => {
    if (!destinationValue || destinationValue === 'None' || destinationValue === 'Hangup') {
      return 'Hangup()';
    }
    if (destinationValue === 'Return to IVR') {
      return `Goto(ivr_${currentIvrId},s,1)`;
    }
    if (destinationValue.startsWith('ivr_')) {
      const targetIvrId = destinationValue.substring(4);
      return `Goto(ivr_${targetIvrId},s,1)`;
    }
    if (destinationValue.startsWith('queue_')) {
      const targetQueueId = destinationValue.substring(6);
      return `Goto(ext-queues-custom,${targetQueueId},1)`;
    }
    return `Goto(from-internal,${destinationValue},1)`;
  };

  allIVRs.forEach(menu => {
    const safeId = menu._id.toString();
    const dtmf = menu.dtmf || {};

    ivrConfigSections += `\n[ivr_${safeId}]\n`;
    ivrConfigSections += `exten => s,1,NoOp(IVR Menu: ${menu.name} - ID: ${safeId})\n`;
    ivrConfigSections += `same => n,Answer()\n`;
    ivrConfigSections += `same => n,Set(TIMEOUT(digit)=${dtmf.timeout || 10})\n`;
    ivrConfigSections += `same => n,Set(TIMEOUT(response)=10)\n`;

    // Alert Info - Set SIP header if specified
    if (dtmf.alertInfo && dtmf.alertInfo !== '' && dtmf.alertInfo !== 'None') {
      ivrConfigSections += `same => n,Set(SIPADDHEADER=Alert-Info: ${dtmf.alertInfo})\n`;
    }

    // Ringer Volume Override
    if (dtmf.ringerVolumeOverride && dtmf.ringerVolumeOverride !== 'None') {
      ivrConfigSections += `same => n,Set(CHANNEL(ringer_volume)=${dtmf.ringerVolumeOverride})\n`;
    }

    // Play announcement recording(s)
    const announcementFilenames = getRecordingFilenamesArray(dtmf.announcement?.id, allRecordings);
    if (announcementFilenames.length > 0) {
      announcementFilenames.forEach(filename => {
        ivrConfigSections += `same => n,Background(${filename})\n`;
      });
    }

    // Ignore Trailing Key - Add 'h' option to ignore # key
    let waitExtenOptions = dtmf.ignoreTrailingKey === 'Yes' ? 'h' : '';
    ivrConfigSections += `same => n,WaitExten(10${waitExtenOptions ? `,${waitExtenOptions}` : ''})\n`;

    menu.entries.forEach(entry => {
      ivrConfigSections += `\nexten => ${entry.digit},1,NoOp(Option ${entry.digit} - ${entry.label || entry.type})\n`;
      switch (entry.type) {
        case 'extension': 
          ivrConfigSections += `same => n,Dial(PJSIP/${entry.value},30)\n`; 
          break;
        case 'queue': 
          ivrConfigSections += `same => n,Queue(${entry.value})\n`; 
          break;
        case 'ivr': 
          ivrConfigSections += `same => n,Goto(ivr_${entry.value},s,1)\n`; 
          break;
        case 'voicemail':
          ivrConfigSections += `same => n,VoiceMail(${entry.value}@default)\n`;
          if (dtmf.returnToIVRAfterVM === 'Yes') {
            ivrConfigSections += `same => n,Goto(ivr_${safeId},s,1)\n`;
          }
          break;
        case 'recording':
          const entryRecordingFilenames = getRecordingFilenamesArray(entry.value, allRecordings);
          if (entryRecordingFilenames.length > 0) {
            entryRecordingFilenames.forEach(filename => 
              ivrConfigSections += `same => n,Playback(${filename})\n`
            );
          }
          break;
        case 'hangup': 
          ivrConfigSections += `same => n,Hangup()\n`; 
          break;
        default: 
          ivrConfigSections += `same => n,Playback(invalid)\n`;
      }
      
      // Ensure calls hang up after action unless it's a specific IVR or voicemail return
      if (entry.type !== 'ivr' && entry.type !== 'recording' && 
          !(entry.type === 'voicemail' && dtmf.returnToIVRAfterVM === 'Yes')) {
        ivrConfigSections += `same => n,Hangup()\n`;
      }
    });

    // Invalid Input Handler (i extension)
    ivrConfigSections += `\nexten => i,1,NoOp(Invalid option for IVR: ${menu.name})\n`;
    
    // Append announcement to invalid if enabled
    if (dtmf.appendAnnouncementToInvalid === 'Yes' && announcementFilenames.length > 0) {
      announcementFilenames.forEach(filename => 
        ivrConfigSections += `same => n,Background(${filename})\n`
      );
    }
    
    // Play invalid retry recording or use invalid recording
    const invalidRetryRecFilenames = getRecordingFilenamesArray(dtmf.invalidRetryRecording?.id, allRecordings);
    const invalidRecFilenames = getRecordingFilenamesArray(dtmf.invalidRecording?.id, allRecordings);
    
    if (invalidRetryRecFilenames.length > 0) {
      invalidRetryRecFilenames.forEach(filename => 
        ivrConfigSections += `same => n,Playback(${filename})\n`
      );
    } else if (invalidRecFilenames.length > 0) {
      invalidRecFilenames.forEach(filename => 
        ivrConfigSections += `same => n,Playback(${filename})\n`
      );
    } else {
      ivrConfigSections += `same => n,Playback(invalid)\n`;
    }
    
    // Handle invalid destination or return to IVR
    if (dtmf.returnOnInvalid === 'Yes') {
      ivrConfigSections += `same => n,Goto(ivr_${safeId},s,1)\n`;
    } else if (dtmf.invalidDestination && dtmf.invalidDestination !== 'None') {
      ivrConfigSections += `same => n,${getDestinationGoto(dtmf.invalidDestination, safeId)}\n`;
    } else {
      ivrConfigSections += `same => n,Hangup()\n`;
    }

    // Timeout Handler (t extension)
    ivrConfigSections += `\nexten => t,1,NoOp(Timeout for IVR: ${menu.name})\n`;
    
    // Append announcement to timeout if enabled
    if (dtmf.appendAnnouncementOnTimeout === 'Yes' && announcementFilenames.length > 0) {
      announcementFilenames.forEach(filename => 
        ivrConfigSections += `same => n,Background(${filename})\n`
      );
    }
    
    // Play timeout retry recording or use timeout recording
    const timeoutRetryRecFilenames = getRecordingFilenamesArray(dtmf.timeoutRetryRecording?.id, allRecordings);
    const timeoutRecFilenames = getRecordingFilenamesArray(dtmf.timeoutRecording?.id, allRecordings);
    
    if (timeoutRetryRecFilenames.length > 0) {
      timeoutRetryRecFilenames.forEach(filename => 
        ivrConfigSections += `same => n,Playback(${filename})\n`
      );
    } else if (timeoutRecFilenames.length > 0) {
      timeoutRecFilenames.forEach(filename => 
        ivrConfigSections += `same => n,Playback(${filename})\n`
      );
    } else {
      ivrConfigSections += `same => n,Playback(vm-timeout)\n`;
    }
    
    // Handle timeout destination or return to IVR
    if (dtmf.returnOnTimeout === 'Yes') {
      ivrConfigSections += `same => n,Goto(ivr_${safeId},s,1)\n`;
    } else if (dtmf.timeoutDestination && dtmf.timeoutDestination !== 'None') {
      ivrConfigSections += `same => n,${getDestinationGoto(dtmf.timeoutDestination, safeId)}\n`;
    } else {
      ivrConfigSections += `same => n,Hangup()\n\n`;
    }

    // Generate include statement for IVR instead of direct extension binding
    ivrBindings += `include => ivr_${safeId}\n`;
  });

  return { 
    ivrConfigSections: ivrConfigSections.trim() + '\n', 
    ivrBindings: ivrBindings.trim() + '\n' 
  };
};

module.exports = { generateIvrDialplan };