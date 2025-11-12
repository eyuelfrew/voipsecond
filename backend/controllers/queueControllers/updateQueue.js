const { loadQueueNamesMap } = require('../../config/amiConfig');
const Queue = require('../../models/queue');
const { writeFileWithSudo } = require('../../utils/sudo');
const { generateAsteriskQueueConfig, reloadAsteriskQueues } = require('./queueConfigGenerator');

// Helper function to map skipBusyAgents form values to ringinuse config values
const mapSkipBusyAgentsToRinginuse = (skipBusyAgentsValue) => {
  const value = String(skipBusyAgentsValue || 'yes').toLowerCase();

  // Form value mapping:
  // "yes" -> ringinuse=yes
  // "no" -> ringinuse=no  
  // "yes(ringinuse=no)" -> ringinuse=no
  // "queue calls only" -> ringinuse=no

  if (value === 'yes') {
    return 'yes';
  } else if (value === 'no' || value.includes('ringinuse=no') || value.includes('queue calls only')) {
    return 'no';
  } else {
    return 'yes'; // default fallback
  }
};

// Update a queue by _id, processing the data like createQueue
const updateQueue = async (req, res) => {
  console.log(req.body)
  try {
    const {
      generalSettings,
      queueAgents,
      timingAgentOptions,
      capacityOptions
    } = req.body;

    const queueId = req.params.queueId;

    // Validate required fields
    if (!generalSettings.queueName || !generalSettings.queueNumber) {
      return res.status(400).json({
        status: 400,
        error: 'Missing required queueName or queueNumber in generalSettings.'
      });
    }

    // Debug: Log the received options for update
    console.log('🔍 DEBUG UPDATE - Received generalSettings:', JSON.stringify(generalSettings, null, 2));
    console.log('🔍 DEBUG UPDATE - Received capacityOptions:', JSON.stringify(capacityOptions, null, 2));
    console.log('🔍 DEBUG UPDATE - skipBusyAgents value:', generalSettings?.skipBusyAgents);
    console.log('🔍 DEBUG UPDATE - Mapped ringinuse value:', mapSkipBusyAgentsToRinginuse(generalSettings?.skipBusyAgents));
    console.log('🔍 DEBUG UPDATE - joinEmpty value:', capacityOptions?.joinEmpty);

    // Build update object like createQueue - map nested fields to top-level schema fields
    const updateObj = {
      queueId: generalSettings.queueNumber,
      name: generalSettings.queueName,
      description: generalSettings?.description || '',
      announceFrequency: generalSettings?.announceFrequency || 0,
      announceHoldtime: (generalSettings?.announceHoldtime || 'no').toLowerCase(),
      announcePosition: (generalSettings?.announcePosition || 'no').toLowerCase(),
      autofill: (generalSettings?.autofill || 'no').toLowerCase(),
      autopause: (timingAgentOptions?.autoPause || 'no').toLowerCase(),
      autopausebusy: (timingAgentOptions?.autoPauseOnBusy || 'no').toLowerCase(),
      autopausedelay: timingAgentOptions?.autoPauseDelay || 0,
      autopauseunavail: (timingAgentOptions?.autoPauseOnUnavailable || 'no').toLowerCase(),
      joinempty: capacityOptions?.joinEmpty ? String(capacityOptions.joinEmpty).toLowerCase() : 'yes',
      leavewhenempty: capacityOptions?.leaveEmpty ? String(capacityOptions.leaveEmpty).toLowerCase() : 'no',
      maxlen: capacityOptions?.maxCallers || 0,
      memberdelay: parseInt(timingAgentOptions?.memberDelay) || 0,
      minAnnounceFrequency: generalSettings?.minAnnounceFrequency || 15,
      periodicAnnounceFrequency: generalSettings?.periodicAnnounceFrequency || 0,
      periodicAnnounce: generalSettings?.periodicAnnounce || '',
      queueCallsWaiting: generalSettings?.queueCallsWaiting || 'silence/1',
      queueThereAre: generalSettings?.queueThereAre || 'silence/1',
      queueYouAreNext: generalSettings?.queueYouAreNext || 'silence/1',
      musicOnHold: generalSettings?.musicOnHold || 'default',
      reportholdtime: (generalSettings?.reportHoldTime || 'no').toLowerCase(),
      retry: generalSettings?.retry || 5,
      ringinuse: mapSkipBusyAgentsToRinginuse(generalSettings?.skipBusyAgents),
      servicelevel: generalSettings?.serviceLevel || 60,
      strategy: generalSettings?.strategy || 'ringall',
      timeout: generalSettings?.timeout || 30,
      timeoutpriority: generalSettings?.timeoutPriority || 'app',
      timeoutrestart: (generalSettings?.timeoutRestart || 'no').toLowerCase(),
      weight: generalSettings?.weight || 0,
      wrapuptime: timingAgentOptions?.wrapUpTime || 0,
      context: generalSettings?.context || 'from-internal',

      // Keep nested objects for compatibility
      generalSettings,
      queueAgents,
      timingAgentOptions,
      capacityOptions
    };


    // Debug: Log the final values being saved
    console.log('🔍 DEBUG UPDATE - Final joinempty value being saved:', updateObj.joinempty);
    console.log('🔍 DEBUG UPDATE - Final ringinuse value being saved:', updateObj.ringinuse);

    // Update in DB
    const updatedQueue = await Queue.findByIdAndUpdate(queueId, updateObj, { new: true });
    if (!updatedQueue) {
      return res.status(404).json({ status: 404, error: 'Queue not found' });
    }

    console.log('🔍 DEBUG UPDATE - Updated queue joinempty in DB:', updatedQueue.joinempty);
    await loadQueueNamesMap();
    // After update, regenerate config for all queues
    const allQueues = await Queue.find({});
    let combinedAsteriskConfig = '';
    for (const queue of allQueues) {
      combinedAsteriskConfig += generateAsteriskQueueConfig(queue);
    }
    const configPath = '/etc/asterisk/queues_custom.conf';
    await writeFileWithSudo(configPath, combinedAsteriskConfig);
    await reloadAsteriskQueues();
    res.status(200).json({ status: 200, message: 'Queue updated successfully', updatedQueue });
  } catch (error) {
    console.error('Error updating queue:', error);
    res.status(500).json({ status: 500, error: 'Failed to update queue', details: error.message });
  }
};

module.exports = { updateQueue };
