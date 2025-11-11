const { writeFileWithSudo } = require('../../utils/sudo');
const util = require('util');
const { exec } = require('child_process');

// Import models
const IVRMenu = require('../../models/ivr_model');
const audioRecording = require('../../models/audioRecording');
const Queue = require('../../models/queue');
const Extension = require('../../models/extension');
const MiscApplication = require('../../models/miscApplicationModel');
const Announcement = require('../../models/announcement');

// Import generators
const { generateIvrDialplan } = require('./generators/ivrGenerator');
const { generateAnnouncementDialplan } = require('./generators/announcementGenerator');
const { generateQueueDialplan } = require('./generators/queueGenerator');
const { generateAgentDialplan } = require('./generators/agentGenerator');
const { generateMiscApplicationDialplan } = require('./generators/miscAppGenerator');
const { generateChanSpyDialplan } = require('./generators/chanSpyGenerator');

const execPromise = util.promisify(exec);

// Main function to generate and write the combined dialplan
const generateAndWriteDialplan = async () => {
  try {
    // Fetch all necessary data from the database
    const allIVRs = await IVRMenu.find({});
    const allRecordings = await audioRecording.find({});
    const allQueues = await Queue.find({});
    const allExtensions = await Extension.find({});
    const allMiscApps = await MiscApplication.find({});
    const allAnnouncements = await Announcement.find({});

    console.log('Generating dialplan with:', {
      ivrs: allIVRs.length,
      recordings: allRecordings.length,
      queues: allQueues.length,
      extensions: allExtensions.length,
      miscApps: allMiscApps.length,
      announcements: allAnnouncements.length
    });

    let combinedDialplan = '';

    // Generate dialplan for each section
    const { ivrConfigSections, ivrBindings } = generateIvrDialplan(allIVRs, allRecordings);
    const { announcementConfigSections, announcementBindings } = generateAnnouncementDialplan(allAnnouncements, allRecordings);
    const agentBindings = generateAgentDialplan(allExtensions);
    const { queueBindings, queueContexts } = generateQueueDialplan(allQueues);
    const { miscAppBindings, miscAppContext } = generateMiscApplicationDialplan(allMiscApps, allRecordings);
    const chanSpyDialplan = generateChanSpyDialplan();

    // Start with the main custom context and add dynamic and static content
    combinedDialplan += '[from-internal-custom]\n';
    combinedDialplan += ';*******************************************************************************\n';
    combinedDialplan += '; AUTO-GENERATED DIALPLAN By INSA-PBX - DO NOT EDIT MANUALLY                             *\n';
    combinedDialplan += ';*******************************************************************************\n';

    // Add Announcements section
    if (announcementBindings.trim().length > 0) {
      combinedDialplan += '\n; --- Announcements ---\n';
      combinedDialplan += announcementBindings;
    }

    // Add IVR section
    if (ivrBindings.trim().length > 0) {
      combinedDialplan += '\n; --- IVR (Interactive Voice Response) Menus ---\n';
      combinedDialplan += ivrBindings;
    }

    // Add Agent (Extension) section
    if (agentBindings.trim().length > 0) {
      combinedDialplan += '\n; --- Agent (Extension) Dialplan ---\n';
      combinedDialplan += agentBindings;
    }

    // Add Queue section to [from-internal] context as requested (only place to avoid duplication)
    if (queueBindings.trim().length > 0) {
      combinedDialplan += '\n[from-internal]\n';
      combinedDialplan += '; --- Queue Dialplan ---\n';
      combinedDialplan += queueBindings;
    }

    // Add Misc Application section
    if (miscAppBindings.trim().length > 0) {
      combinedDialplan += '\n; --- Miscellaneous Applications (Feature Codes) ---\n';
      combinedDialplan += miscAppBindings;
    }

    // Add the include directives for the ChanSpy contexts
    combinedDialplan += '\n; Include targeted-chanspy contexts\n';
    combinedDialplan += 'include => targeted-chanspy\n';
    combinedDialplan += 'include => targeted-chanspy-whisper\n';
    combinedDialplan += 'include => targeted-chanspy-barge\n';

    // Add the Announcement and IVR config sections outside of from-internal-custom
    if (announcementConfigSections.trim().length > 0) {
      combinedDialplan += '\n' + announcementConfigSections;
    }

    if (ivrConfigSections.trim().length > 0) {
      combinedDialplan += '\n' + ivrConfigSections;
    }

    // Add queue contexts
    if (queueContexts.trim().length > 0) {
      combinedDialplan += '\n' + queueContexts;
    }
    
    // Add misc application context
    if (miscAppContext.trim().length > 0) {
      combinedDialplan += '\n' + miscAppContext;
    }

    // Append the static ChanSpy dialplan contexts to the end of the file
    combinedDialplan += chanSpyDialplan;

    const configPath = '/etc/asterisk/extensions_custom.conf';

    // Write the combined configuration to the file
    await writeFileWithSudo(configPath, combinedDialplan.trim());
    console.log('extensions_custom.conf regenerated successfully.');

    // Reload Asterisk dialplan
    await execPromise('sudo asterisk -rx "dialplan reload"');
    console.log('Asterisk dialplan reloaded successfully.');

  } catch (error) {
    console.error('Error generating and writing dialplan:', error);
    throw error;
  }
};

module.exports = { generateAndWriteDialplan };