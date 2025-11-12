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
  if (recording && recording.audioFiles && recording.audioFiles.length > 0) {
    // Get the first audio file and remove extension
    const fileName = recording.audioFiles[0].originalName.replace(/\.[^/.]+$/, '');
    return `custom/${fileName}`;
  }

  // If not found, return the original value (might already be a path)
  return recordingId;
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

  // Generate queue extension bindings for [from-internal]
  allQueues.forEach(queue => {
    const queueId = queue.queueId;
    const queueName = queue.name || 'Queue';

    // Get join announcement (if configured) and convert to file path
    const joinAnnouncementId = queue.joinAnnouncement || queue.generalSettings?.joinAnnouncement;
    const joinAnnouncement = getRecordingPath(joinAnnouncementId, allRecordings);
    const hasJoinMsg = joinAnnouncement && joinAnnouncement !== 'None' && joinAnnouncement !== '';

    // Get fail over destination (recording) and convert to file path
    const failoverDestId = queue.failOverDestination || queue.generalSettings?.failOverDestination;
    const failoverDest = getRecordingPath(failoverDestId, allRecordings);
    const hasFailover = failoverDest && failoverDest !== 'None' && failoverDest !== '';

    // Get music on hold
    const moh = queue.musicOnHold || queue.generalSettings?.musicOnHold || 'default';

    // Get max wait time (if configured)
    const maxWaitTime = queue.timingAgentOptions?.maxWaitTime;
    const hasMaxWait = maxWaitTime && maxWaitTime !== 'Unlimited' && maxWaitTime !== '' && !isNaN(maxWaitTime);

    // Start queue dialplan
    queueBindings += `exten => ${queueId},1,Gosub(macro-user-callerid,s,1())\n`;
    queueBindings += `same => n,Set(__MCQUEUE=\${EXTEN})\n`;
    queueBindings += `same => n,Answer\n`;
    queueBindings += `same => n,Set(__FROMQUEUEEXTEN=\${CALLERID(number)})\n`;
    queueBindings += `same => n,Gosub(macro-blkvm-set,s,1(reset))\n`;
    queueBindings += `same => n,ExecIf($["\${REGEX("(M\\(auto-blkvm\\))" \${DIAL_OPTIONS})}" != "1"]?Set(_DIAL_OPTIONS=\${DIAL_OPTIONS}U(macro-auto-blkvm)))\n`;
    queueBindings += `same => n,Set(__NODEST=\${EXTEN})\n`;

    // Set join announcement if configured
    if (hasJoinMsg) {
      queueBindings += `same => n,Set(QJOINMSG=${joinAnnouncement})\n`;
    }

    // Set music on hold
    queueBindings += `same => n,Set(QMOH=${moh})\n`;
    queueBindings += `same => n,ExecIf($["\${QMOH}"!=""]?Set(__MOHCLASS=\${QMOH}))\n`;
    queueBindings += `same => n,ExecIf($["\${MOHCLASS}"!=""]?Set(CHANNEL(musicclass)=\${MOHCLASS}))\n`;

    // Set max wait time if configured (only if not Unlimited)
    if (hasMaxWait) {
      queueBindings += `same => n,Set(QMAXWAIT=${maxWaitTime})\n`;
    }

    queueBindings += `same => n,Set(QUEUENUM=${queueId})\n`;
    queueBindings += `same => n,Set(QUEUEJOINTIME=\${EPOCH})\n`;

    // Play join message if configured and no free agents
    if (hasJoinMsg) {
      queueBindings += `same => n,ExecIf($["\${QJOINMSG}"!="" && \${QUEUE_MEMBER(${queueId},free)}<1]?Playback(\${QJOINMSG}))\n`;
    }

    queueBindings += `same => n,QueueLog(${queueId},\${UNIQUEID},NONE,DID,\${FROM_DID})\n`;

    // Call the queue with options
    const queueOptions = 't'; // Basic options (allow transfer)
    if (hasMaxWait) {
      queueBindings += `same => n(qcall),Queue(${queueId},${queueOptions},,,,\${QMAXWAIT})\n`;
    } else {
      queueBindings += `same => n(qcall),Queue(${queueId},${queueOptions})\n`;
    }

    queueBindings += `same => n,Gosub(macro-blkvm-clr,s,1())\n`;
    queueBindings += `same => n,Set(__NODEST=)\n`;
    queueBindings += `same => n,Set(_QUEUE_PRIO=0)\n`;

    // Fail over destination - play recording and hangup
    if (hasFailover) {
      queueBindings += `same => n(gotodest),Playback(${failoverDest})\n`;
      queueBindings += `same => n,Hangup()\n`;
    } else {
      // Default: just hangup
      queueBindings += `same => n(gotodest),Hangup()\n`;
    }

    queueBindings += '\n'; // Add blank line between queues
  });

  // Generate [ext-queues-custom] context for queue processing (if needed for other integrations)
  queueContexts += '[ext-queues-custom]\n';
  queueContexts += '; This context is for queue processing from other sources\n';
  allQueues.forEach(queue => {
    const queueId = queue.queueId;
    const queueName = queue.name || 'Queue';
    const timeout = queue.timeout || 30;
    const failoverExt = queue.failoverExt || '1003';

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
    queueContexts += `same => n,Queue(${queueId},t,,,${timeout})\n`;
    queueContexts += `same => n,Gosub(macro-blkvm-clr,s,1())\n`;
    queueContexts += `same => n,Set(__NODEST=)\n`;
    queueContexts += `same => n,Goto(from-did-direct,${failoverExt},1)\n`;
    queueContexts += '\n';
  });

  return {
    queueBindings: queueBindings.trim() + '\n',
    queueContexts: queueContexts.trim() + '\n'
  };
};

module.exports = { generateQueueDialplan };
