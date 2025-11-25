const AudioRecording = require('../../../models/audioRecording');

/**
 * Helper function to get recording file path from recording ID
 * @param {string} recordingId - The recording ID from the database
 * @param {Array} allRecordings - Array of all recordings
 * @returns {string} - The file path for Asterisk (e.g., 'custom/filename')
 */
const getRecordingPath = (recordingId, allRecordings) => {
  if (!recordingId || recordingId === 'None' || recordingId === '') {
    return '';
  }

  const recording = allRecordings.find(r => r._id.toString() === recordingId.toString());

  if (recording) {
    if (recording.audioFiles && recording.audioFiles.length > 0) {
      // Get the first audio file and remove extension
      const originalName = recording.audioFiles[0].originalName;
      const fileName = originalName.replace(/\.[^/.]+$/, '');
      const fullPath = `custom/${fileName}`;
      return fullPath;
    } else {
      console.log('⚠️ DEBUG - Recording has no audio files');
      return '';
    }
  }

  console.log('❌ DEBUG - Recording not found in allRecordings array');
  console.log('🔍 DEBUG - Available recording IDs:', allRecordings.map(r => r._id.toString()).join(', '));

  // 🔥 IMPORTANT FIX: Never return the recordingId anymore
  return '';
};

/**
 * Generates Asterisk dialplan code for call queues.
 * This function creates queue extension bindings and queue processing contexts.
 *
 * @param {Array<Object>} allQueues An array of queue objects from the database.
 * @param {Array<Object>} allRecordings An array of recording objects from the database.
 * @returns {Object} Object containing queue bindings and contexts.
 */
const generateQueueDialplan = (allQueues, allRecordings = []) => {
  let queueBindings = '';
  let queueContexts = '';

  allQueues.forEach(queue => {
    const queueId = queue.queueId;

    const joinAnnouncementId = queue.joinAnnouncement || queue.generalSettings?.joinAnnouncement;
    const joinAnnouncement = getRecordingPath(joinAnnouncementId, allRecordings);
    const hasJoinMsg = !!joinAnnouncement;

    const failoverDestId = queue.failOverDestination || queue.generalSettings?.failOverDestination;
    const failoverDest = getRecordingPath(failoverDestId, allRecordings);
    const hasFailover = !!failoverDest;

    const moh = queue.musicOnHold || queue.generalSettings?.musicOnHold || 'default';
    const maxWaitTime = queue.timingAgentOptions?.maxWaitTime;
    const hasMaxWait = maxWaitTime && maxWaitTime !== 'Unlimited' && !isNaN(maxWaitTime);

    const callRecording = queue.generalSettings?.callRecording || 'dontcare';
    const callConfirm = queue.generalSettings?.callConfirm || 'No';
    const hasCallConfirm = callConfirm === 'Yes';

    queueBindings += `exten => ${queueId},1,Gosub(macro-user-callerid,s,1())\n`;
    queueBindings += `same => n,Set(__MCQUEUE=\${EXTEN})\n`;
    queueBindings += `same => n,Answer\n`;
    queueBindings += `same => n,Set(__FROMQUEUEEXTEN=\${CALLERID(number)})\n`;
    queueBindings += `same => n,Gosub(macro-blkvm-set,s,1(reset))\n`;
    queueBindings += `same => n,ExecIf($["\${REGEX("(M\\(auto-blkvm\\))" \${DIAL_OPTIONS})}" != "1"]?Set(_DIAL_OPTIONS=\${DIAL_OPTIONS}U(macro-auto-blkvm)))\n`;
    queueBindings += `same => n,Set(__NODEST=\${EXTEN})\n`;

    if (hasJoinMsg) {
      queueBindings += `same => n,Set(QJOINMSG=${joinAnnouncement})\n`;
    }

    queueBindings += `same => n,Set(QRINGOPTS=R)\n`;
    queueBindings += `same => n(qoptions),Set(QOPTIONS=t\${QRINGOPTS})\n`;
    queueBindings += `same => n,Gosub(sub-record-check,s,1(q,${queueId},${callRecording}))\n`;
    queueBindings += `same => n,Set(__SIGNORE=TRUE)\n`;

    if (hasCallConfirm) {
      queueBindings += `same => n,Set(__QC_CONFIRM=1)\n`;
      queueBindings += `same => n,GotoIf($[$["\${QC_CONFIRM}"="1"]]?QVQANNOUNCE:NOQVQANNOUNCE)\n`;
      queueBindings += `same => n(QVQANNOUNCE),Set(__FORCE_CONFIRM=\${CHANNEL})\n`;
      queueBindings += `same => n,Set(SHARED(ANSWER_STATUS)=NOANSWER)\n`;
      queueBindings += `same => n,Set(__CALLCONFIRMCID=\${CALLERID(number)})\n`;
      queueBindings += `same => n,Set(__ALT_CONFIRM_MSG=default)\n`;
      queueBindings += `same => n(NOQVQANNOUNCE),NoOp()\n`;
    } else {
      queueBindings += `same => n,Set(__QC_CONFIRM=0)\n`;
    }

    if (hasJoinMsg) {
      queueBindings += `same => n,ExecIf($["\${QJOINMSG}"!=""]?Playback(\${QJOINMSG}))\n`;
    }

    queueBindings += `same => n,QueueLog(${queueId},\${UNIQUEID},NONE,DID,\${FROM_DID})\n`;

    queueBindings += `same => n,Set(QMOH=${moh})\n`;
    queueBindings += `same => n,ExecIf($["\${QMOH}"!=""]?Set(__MOHCLASS=\${QMOH}))\n`;
    queueBindings += `same => n,ExecIf($["\${MOHCLASS}"!=""]?Set(CHANNEL(musicclass)=\${MOHCLASS}))\n`;

    if (hasMaxWait) {
      queueBindings += `same => n,Set(QMAXWAIT=${maxWaitTime})\n`;
    }

    queueBindings += `same => n,Set(QUEUENUM=${queueId})\n`;
    queueBindings += `same => n,Set(QUEUEJOINTIME=\${EPOCH})\n`;

    if (hasMaxWait) {
      queueBindings += `same => n(qcall),Queue(${queueId},\${QOPTIONS},,,\${QMAXWAIT})\n`;
    } else {
      queueBindings += `same => n(qcall),Queue(${queueId},\${QOPTIONS})\n`;
    }

    queueBindings += `same => n,Gosub(macro-blkvm-clr,s,1())\n`;
    queueBindings += `same => n,Gosub(sub-record-cancel,s,1())\n`;
    queueBindings += `same => n,Set(__NODEST=)\n`;
    queueBindings += `same => n,Set(_QUEUE_PRIO=0)\n`;
    queueBindings += `same => n,Set(QRINGOPTS=)\n`;

    if (hasFailover) {
      queueBindings += `same => n(gotodest),Playback(${failoverDest})\n`;
      queueBindings += `same => n,Hangup()\n`;
    } else {
      queueBindings += `same => n(gotodest),Hangup()\n`;
    }

    queueBindings += '\n';
  });

  queueContexts += '[ext-queues-custom]\n';
  queueContexts += '; This context is for queue processing from other sources\n';
  allQueues.forEach(queue => {
    const queueId = queue.queueId;
    const queueName = queue.name || 'Queue';
    const timeout = queue.timeout || 30;
    const failoverExt = queue.failoverExt || '';

    queueContexts += `exten => ${queueId},1,NoOp(Processing Custom Queue: ${queueName} - ID: ${queueId})\n`;
    queueContexts += `same => n,Gosub(macro-user-callerid,s,1())\n`;
    queueContexts += `same => n,Answer\n`;
    queueContexts += `same => n,Set(__FROMQUEUEEXTEN=\${CALLERID(number)})\n`;
    queueContexts += `same => n,Gosub(macro-blkvm-set,s,1(reset))\n`;
    queueContexts += `same => n,ExecIf($["\${REGEX("(M\\(auto-blkvm\\))" \${DIAL_OPTIONS})}" != "1"]?Set(_DIAL_OPTIONS=\${DIAL_OPTIONS}U(macro-auto-blkvm)))\n`;
    queueContexts += `same => n,Set(__NODEST=\${EXTEN})\n`;
    queueContexts += `same => n,Set(__MOHCLASS=default)\n`;
    queueContexts += `same => n,ExecIf($["\${MOHCLASS}"!=""]?Set(CHANNEL(musicclass)=\${MOHCLASS}))\n`;
    queueContexts += `same => n,Set(QUEUEJOINTIME=\${EPOCH})\n`;
    queueContexts += `same => n,QueueLog(${queueId},\${UNIQUEID},NONE,DID,\${FROM_DID})\n`;
    queueContexts += `same => n(qcall),Queue(${queueId},\${QOPTIONS},,,${timeout})\n`;
    queueContexts += `same => n,Gosub(macro-blkvm-clr,s,1())\n`;
    queueContexts += `same => n,Set(__NODEST=)\n`;
    queueContexts += `same => n,Goto(from-did-direct,${failoverExt},1)\n\n`;
  });

  return {
    queueBindings: queueBindings.trim() + '\n',
    queueContexts: queueContexts.trim() + '\n'
  };
};

module.exports = { generateQueueDialplan };
