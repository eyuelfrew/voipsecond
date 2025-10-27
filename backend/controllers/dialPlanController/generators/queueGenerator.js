/**
 * Generates Asterisk dialplan code for call queues.
 * This function creates queue extension bindings and queue processing contexts.
 *
 * @param {Array<Object>} allQueues An array of queue objects from the database.
 * @returns {Object} Object containing queue bindings and contexts.
 */
const generateQueueDialplan = (allQueues) => {
  let queueBindings = '';
  let queueContexts = '';
  
  // Generate queue extension bindings for [from-internal-custom]
  allQueues.forEach(queue => {
    queueBindings += `exten => ${queue.queueId},1,NoOp(Route to Queue: ${queue.name} - ID: ${queue.queueId})\n`;
    queueBindings += `same => n,Goto(ext-queues-custom,${queue.queueId},1)\n`;
    queueBindings += `same => n,Hangup()\n`;
  });

  // Generate [ext-queues-custom] context for queue processing
  queueContexts += '[ext-queues-custom]\n';
  allQueues.forEach(queue => {
    const timeout = queue.timeout || 30;
    const failoverExt = queue.failoverExt || '1003';

    queueContexts += `exten => ${queue.queueId},1,NoOp(Processing Custom Queue: ${queue.name} - ID: ${queue.queueId})\n`;
    queueContexts += `same => n,Gosub(macro-user-callerid,s,1())\n`;
    queueContexts += `same => n,Answer\n`;
    queueContexts += `same => n,Set(__FROMQUEUEEXTEN=\${CALLERID(number)})\n`;
    queueContexts += `same => n,Gosub(macro-blkvm-set,s,1(reset))\n`;
    queueContexts += `same => n,ExecIf($["\${REGEX("(M\\(auto-blkvm\\))" \${DIAL_OPTIONS})}" != "1"]?Set(_DIAL_OPTIONS=\${DIAL_OPTIONS}U(macro-auto-blkvm)))\n`;
    queueContexts += `same => n,Set(__NODEST=\${EXTEN})\n`;
    queueContexts += `same => n,Set(__MOHCLASS=default)\n`;
    queueContexts += `same => n,ExecIf($["\${MOHCLASS}"!=""]?Set(CHANNEL(musicclass)=\${MOHCLASS}))\n`;
    queueContexts += `same => n,Set(QUEUEJOINTIME=\${EPOCH})\n`;
    queueContexts += `same => n,QueueLog(${queue.queueId},\${UNIQUEID},NONE,DID,\${FROM_DID})\n`;
    queueContexts += `same => n,Queue(${queue.queueId},t,,,${timeout})\n`;
    queueContexts += `same => n,Gosub(macro-blkvm-clr,s,1())\n`;
    queueContexts += `same => n,Set(__NODEST=)\n`;
    queueContexts += `same => n,Goto(from-did-direct,${failoverExt},1)\n`;
  });

  return { 
    queueBindings: queueBindings.trim() + '\n', 
    queueContexts: queueContexts.trim() + '\n' 
  };
};

module.exports = { generateQueueDialplan };