// Helper: Generate Asterisk config for one Queue
const generateAsteriskQueueConfig = (queue) => {
  // Note: This function uses the *saved Mongoose document* structure,
  // which now includes both top-level and nested fields.
  const settings = queue.generalSettings;
  const timing = queue.timingAgentOptions;
  const capacity = queue.capacityOptions;

  // Start with the queue context header, using queueId from the schema
  let config = `\n[${queue.queueId}]\n`;

  // --- Use top-level queue fields (from schema) for Asterisk config ---
  config += `announce-frequency=${queue.announceFrequency || 0}\n`;
  config += `announce-holdtime=${queue.announceHoldtime || 'no'}\n`;
  config += `announce-position=${queue.announcePosition || 'no'}\n`;
  config += `autofill=${queue.autofill || 'no'}\n`;
  config += `autopause=${queue.autopause || 'no'}\n`;
  config += `autopausebusy=${queue.autopausebusy || 'no'}\n`;
  config += `autopausedelay=${queue.autopausedelay || 0}\n`;
  config += `autopauseunavail=${queue.autopauseunavail || 'no'}\n`;
  config += `joinempty=${queue.joinempty || 'yes'}\n`;
  config += `leavewhenempty=${queue.leavewhenempty || 'no'}\n`;
  config += `maxlen=${queue.maxlen || 0}\n`;
  config += `memberdelay=${queue.memberdelay || 0}\n`;
  config += `min-announce-frequency=${queue.minAnnounceFrequency || 15}\n`;
  config += `penaltymemberslimit=${queue.penaltymemberslimit || 0}\n`;
  config += `periodic-announce-frequency=${queue.periodicAnnounceFrequency || 0}\n`;
  config += `queue-callswaiting=${queue.queueCallsWaiting || 'silence/1'}\n`;
  config += `queue-thereare=${queue.queueThereAre || 'silence/1'}\n`;
  config += `queue-youarenext=${queue.queueYouAreNext || 'silence/1'}\n`;
  config += `reportholdtime=${queue.reportholdtime || 'no'}\n`;
  config += `retry=${queue.retry || 5}\n`;
  config += `ringinuse=${queue.ringinuse || 'yes'}\n`;
  config += `servicelevel=${queue.servicelevel || 60}\n`;
  config += `strategy=${queue.strategy || 'ringall'}\n`;
  config += `timeout=${queue.timeout || 30}\n`;
  config += `timeoutpriority=${queue.timeoutpriority || 'app'}\n`;
  config += `timeoutrestart=${queue.timeoutrestart || 'no'}\n`;
  config += `weight=${queue.weight || 0}\n`;
  config += `wrapuptime=${queue.wrapuptime || 0}\n`;
  config += `context=${queue.context || 'from-internal'}\n`;

  // Debug logging for important fields
  console.log('🔍 DEBUG - Config Generator - Queue:', queue.queueId);
  console.log('🔍 DEBUG - Config Generator - joinempty:', queue.joinempty);
  console.log('🔍 DEBUG - Config Generator - ringinuse:', queue.ringinuse);

  // --- Agent Settings ---
  // Using the nested queueAgents array for detailed member configuration
  if (Array.isArray(queue.queueAgents)) {
    queue.queueAgents.forEach(agent => {
      // Assuming penalty is 0 by default, and context is 'from-internal'.
      config += `member=Local/${agent.extension}@from-internal/n,0,${agent.name}\n`;
    });
  }

  return config;
};

const util = require('util');
const { exec } = require('child_process');
const execPromise = util.promisify(exec);

// Helper: Reload Asterisk Queue module
const reloadAsteriskQueues = async () => {
  try {
    // Reloads only the queue application module, which is more targeted.
    await execPromise('sudo asterisk -rx "module reload app_queue.so"');
    console.log('Asterisk queue application reloaded successfully');
  } catch (error) {
    console.error('Error reloading Asterisk queue application:', error);
    throw error;
  }
};

module.exports = {
  generateAsteriskQueueConfig,
  reloadAsteriskQueues
};