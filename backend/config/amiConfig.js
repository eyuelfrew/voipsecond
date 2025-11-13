// /ami/handler.js (Example file path)
const CallLog = require("../models/callLog.js");
const Queue = require("../models/queue.js");
const QueueStatistics = require("../models/queueStatistics.js");
const WrapUpTime = require("../models/wrapUpTime.js");
const CallQualityMetrics = require("../models/callQualityMetrics.js");
const fs = require("fs");
const path = require("path");
const Shift = require("../models/shiftModel");
const Agent = require("../models/agent");

const recordingsBasePath =
  process.env.RECORDINGS_BASE_PATH ||
  "/var/spool/asterisk/monitor/insaRecordings";

if (!fs.existsSync(recordingsBasePath)) {
  fs.mkdirSync(recordingsBasePath, { recursive: true });
}
let queueNameMap = {};
async function loadQueueNamesMap() {
  const queues = await Queue.find({}, { queueId: 1, name: 1 }).lean();
  const map = {};
  queues.forEach((q) => {
    map[q.queueId] = q.name;
  });
  queueNameMap = map;
}

// Agent mapping similar to queue mapping - using Extension model for frontend compatibility
let agentDataMap = {};
async function loadAgentDataMap() {
  const Extension = require("../models/extension");
  const extensions = await Extension.find(
    {},
    { userExtension: 1, displayName: 1, _id: 1 }
  ).lean();
  const map = {};
  extensions.forEach((ext) => {
    // Parse displayName to get first and last name (assuming format "First Last")
    const nameParts = ext.displayName
      ? ext.displayName.split(" ")
      : ["Agent", ext.userExtension];
    const firstName = nameParts[0] || "Agent";
    const lastName = nameParts.slice(1).join(" ") || ext.userExtension;

    map[ext.userExtension] = {
      // Use userExtension as key
      id: ext._id,
      extension: ext.userExtension,
      first_name: firstName,
      last_name: lastName,
      full_name: ext.displayName || `Agent ${ext.userExtension}`,
      displayName: ext.displayName,
    };
  });
  agentDataMap = map;
}

// Centralized in-memory state for the application
const state = {
  ongoingCalls: {},
  activeRinging: {},
  queueData: {},
  queueMembers: {},
  queueCallers: [],
  endpointList: [],
  agentShifts: {},
  activeBridges: {},
  recordedLinkedIds: {},
  agentStatus: {}, // Track real-time agent status
  pendingWrap: {}, // Track wrap-up time: { "queueId:agentExtension": { callEndTime, linkedId, queue, agent, ... } }
  agentWrapStatus: {}, // Track current wrap status per agent: { "agentExtension": { inWrapUp: true, wrapStartTime, ... } }
  wrapUpTimers: {}, // Track auto-unpause timers: { "queueId:agentExtension": timerId }
};

// On startup, load all ongoing shifts and pending ends into memory
async function syncAgentShiftsFromDB() {
  const ongoingShifts = await Shift.find({ endTime: null });
  ongoingShifts.forEach((shift) => {
    if (shift.agentId && shift._id) {
      // If shift has a pendingEndUntil, set a timer
      if (
        shift.pendingEndUntil &&
        new Date(shift.pendingEndUntil) > new Date()
      ) {
        const msLeft = new Date(shift.pendingEndUntil) - new Date();
        shift._pendingEnd = setTimeout(async () => {
          shift.endTime = new Date();
          shift.duration = (shift.endTime - shift.startTime) / 1000;
          await shift.save();
          delete state.agentShifts[shift.agentId];
        }, msLeft);
      }
      state.agentShifts[shift.agentId] = shift._id;
    }
  });
  // console.log("Agent shifts synced from DB.");
}
// --- AGENT SHIFT TRACKING ---

// Use extension number for shift monitoring
async function startAgentShiftByExtension(extensionNumber) {
  try {
    // Always check DB for any ongoing shift (no endTime)
    // If a shift is already active in memory, resume
    if (state.agentShifts[extensionNumber]) {
      // Resume logic: check for pending end in DB
      const agent = await Agent.findOne({ username: extensionNumber });
      if (!agent)
        throw new Error(`Agent not found for username: ${extensionNumber}`);
      let ongoingShift = await Shift.findOne({
        agentId: agent._id,
        endTime: null,
      });
      if (
        ongoingShift &&
        ongoingShift.pendingEndUntil &&
        new Date(ongoingShift.pendingEndUntil) > new Date()
      ) {
        // Cancel pending end
        ongoingShift.pendingEndUntil = null;
        await ongoingShift.save();
        if (ongoingShift._pendingEnd) {
          clearTimeout(ongoingShift._pendingEnd);
          delete ongoingShift._pendingEnd;
        }
      }
      return;
    }
    // Find agent by username (which is the extension number)
    const agent = await Agent.findOne({ username: extensionNumber });
    if (!agent)
      throw new Error(`Agent not found for username: ${extensionNumber}`);
    // Check for any ongoing shift in DB (no endTime)
    let ongoingShift = await Shift.findOne({
      agentId: agent._id,
      endTime: null,
    });
    if (ongoingShift) {
      // Resume the ongoing shift
      state.agentShifts[extensionNumber] = ongoingShift._id;
      if (
        ongoingShift.pendingEndUntil &&
        new Date(ongoingShift.pendingEndUntil) > new Date()
      ) {
        // Cancel pending end
        ongoingShift.pendingEndUntil = null;
        await ongoingShift.save();
        if (ongoingShift._pendingEnd) {
          clearTimeout(ongoingShift._pendingEnd);
          delete ongoingShift._pendingEnd;
        }
      } else {
        console.log(
          `Resumed ongoing shift for agent username ${extensionNumber}: ${ongoingShift._id}`
        );
      }
      return;
    }
    // Otherwise, start a new shift
    const shift = new Shift({ agentId: agent._id, startTime: new Date() });
    const createdShift = await shift.save();
    state.agentShifts[extensionNumber] = createdShift._id;
  } catch (err) {
    console.error("Error starting agent shift:", err.message);
  }
}

// End agent shift and record reason
async function endAgentShiftByExtension(extensionNumber, reason = "unknown") {
  try {
    const shiftId = state.agentShifts[extensionNumber];
    if (shiftId) {
      const shift = await Shift.findById(shiftId);
      if (shift && !shift.endTime) {
        // Instead of ending immediately, set a timer for 5 min
        const pendingEndUntil = new Date(Date.now() + 5 * 60 * 1000);
        shift.pendingEndUntil = pendingEndUntil;
        await shift.save();
        shift._pendingEnd = setTimeout(async () => {
          shift.endTime = new Date();
          shift.duration = (shift.endTime - shift.startTime) / 1000;
          shift.reason = reason;
          shift.pendingEndUntil = null;
          await shift.save();

          delete state.agentShifts[extensionNumber];
        }, 5 * 60 * 1000); // 5 minutes
        console.log(
          `Shift for agent extension ${extensionNumber} will end in 5 min unless agent returns.`
        );
      } else {
        delete state.agentShifts[extensionNumber];
      }
    }
  } catch (err) {
    console.error("Error ending agent shift:", err.message);
  }
}

// --- HELPER FUNCTIONS ---

/**
 * A centralized function to update the call log in the database.
 * This reduces code repetition and centralizes error handling.
 * @param {string} linkedId - The unique ID of the call.
 * @param {object} updateData - The data to update in the database.
 * @param {object} [options={}] - Optional Mongoose `findOneAndUpdate` options.
 */
async function updateCallLog(linkedId, updateData, options = {}) {
  try {
    await CallLog.findOneAndUpdate({ linkedId }, updateData, {
      ...options,
      new: true,
    });
    // console.log(`Call log updated for ${linkedId}:`, updateData);
  } catch (err) {
    console.error(`Error updating call log for linkedId ${linkedId}:`, err);
  }
}

/**
 * Emits the current queue caller status to all clients.
 * Calculates wait times on the fly.
 * @param {object} io - The Socket.IO server instance.
 */
function emitQueueCallersStatus(io) {
  const flattened = state.queueCallers.map((caller) => {
    return {
      ...caller,
      // caller.queue already contains the queue name from handleQueueCallerJoin
      waitTime: Math.floor((Date.now() - caller.waitStart) / 1000),
    };
  });

  console.log(`📊 Emitting ${flattened.length} queue callers to all clients`);
  io.emit("queueStatus", flattened);
}

/**
 * Emits the current queue members to all clients.
 * Flattens the queue members data structure for frontend consumption.
 * @param {object} io - The Socket.IO server instance.
 */
function emitQueueMembersStatus(io) {
  const flattenedMembers = [];
  Object.keys(state.queueMembers).forEach((queueId) => {
    state.queueMembers[queueId].forEach((member) => {
      flattenedMembers.push({
        ...member,
        queueName: queueNameMap[queueId] || queueId,
      });
    });
  });

  console.log(
    `📊 Emitting ${flattenedMembers.length} queue members to all clients`
  );
  io.emit("queueMembers", flattenedMembers);
}

/**
 * Emits the current ongoing calls to all clients.
 * @param {object} io - The Socket.IO server instance.
 */
function emitOngoingCallsStatus(io) {
  const ongoingCallsArray = Object.values(state.ongoingCalls);
  console.log(
    `📞 Emitting ${ongoingCallsArray.length} ongoing calls to all clients`
  );
  io.emit("ongoingCalls", ongoingCallsArray);
}

/**
 * Emits ALL agents from database with their real-time status and stats mapped.
 * This ensures frontend gets complete agent list (online + offline) with stats.
 * @param {object} ioOrSocket - The Socket.IO server instance or individual socket.
 */
// Agent status emission is now handled by realTimeAgent.js
// This function is kept for compatibility but delegates to realTimeAgent
function emitAgentStatus(ioOrSocket) {
  // Delegate to realTimeAgent system
  const {
    emitAgentStatus: realTimeEmitAgentStatus,
  } = require("../controllers/agentControllers/realTimeAgent");
  realTimeEmitAgentStatus(ioOrSocket);
}

// --- CALL LIFECYCLE EVENT HANDLERS ---

/**
 * Handles the 'DialBegin' event when a call starts ringing.
 * @param {object} event - The AMI event object.
 * @param {object} io - The Socket.IO server instance.
 */
function handleDialBegin(event, io) {
  const {
    Linkedid,
    CallerIDNum,
    CallerIDName,
    DestExten,
    DialString,
    DestChannel,
  } = event;

  if (!state.activeRinging[Linkedid]) {
    state.activeRinging[Linkedid] = {
      callInfo: {
        callerId: CallerIDNum,
        callerName: CallerIDName,
        destination: DestExten,
      },
      ringingChannels: new Set(),
    };
  }

  state.activeRinging[Linkedid].ringingChannels.add(DestChannel);

  // Store call info in memory but don't create CallLog yet
  // We'll only create it when the call has a final status (answered, missed, etc.)
  state.activeRinging[Linkedid].callInfo = {
    ...state.activeRinging[Linkedid].callInfo,
    linkedId: Linkedid,
    callerId: CallerIDNum,
    callerName: CallerIDName,
    callee: DestExten,
    startTime: new Date(),
    channels: [DestChannel],
    direction: DialString && DialString.startsWith("PJSIP/") ? "outbound" : "inbound",
  };
}

const handleQueueStatus = (event) => {
  // console.log("QueueStatus Event:", event);
};

/**
 * 🆕 REVISED: Handles the 'BridgeEnter' event to detect a two-party conversation and start recording.
 * This version uses the Linkedid to ensure only one recording is started per call, and the PJSIP
 * channel to ensure it's the correct bridge.
 * @param {object} event - The AMI event object.
 * @param {object} io - The Socket.IO server instance.
 * @param {object} ami - The AMI client instance.
 */
// Add to state
state.recordingByLinkedId = {};

function handleBridgeEnter(event, io, ami) {
  const {
    BridgeUniqueid,
    Linkedid,
    Channel,
    CallerIDNum,
    CallerIDName,
    ConnectedLineNum,
    ConnectedLineName,
  } = event;

  // 🆕 NEW: Ensure Linkedid is valid before proceeding
  if (!Linkedid) {
    return;
  }

  if (!state.activeBridges[BridgeUniqueid]) {
    state.activeBridges[BridgeUniqueid] = {
      channels: new Set(),
      linkedId: Linkedid,
      callerId: CallerIDNum,
      callerName: CallerIDName,
      connectedLineNum: ConnectedLineNum,
      connectedLineName: ConnectedLineName,
    };
  }

  state.activeBridges[BridgeUniqueid].channels.add(Channel);
}

// --- Bridge Destroy Handler ---
// 🆕 NEW: This function cleans up the state when a bridge is destroyed.
function handleBridgeDestroy(event) {
  const { BridgeUniqueid } = event;
  if (state.activeBridges[BridgeUniqueid]) {
    delete state.activeBridges[BridgeUniqueid];
    console.log(`Bridge ${BridgeUniqueid} destroyed. State cleaned up.`);
  }
}

/**
 * Handles the 'Hangup' event, consolidating all end-of-call logic.
 * This is the single source of truth for terminated calls.
 * @param {object} event - The AMI event object.
 * @param {object} io - The Socket.IO server instance.
 */
function handleHangup(event, io) {
  const { Linkedid, Channel, Cause, CauseTxt } = event;

  // Case 1: Call was hung up while ringing -> Missed Call
  if (state.activeRinging[Linkedid]?.ringingChannels.has(Channel)) {
    state.activeRinging[Linkedid].ringingChannels.delete(Channel);

    if (state.activeRinging[Linkedid].ringingChannels.size === 0) {
      console.log(`💔 Missed call ${Linkedid}`);
      const callInfo = state.activeRinging[Linkedid].callInfo;

      io.emit("callState", {
        event: "missed",
        linkedId: Linkedid,
        data: callInfo,
      });

      // Create call log with missed status (first time creating it)
      updateCallLog(Linkedid, {
        linkedId: Linkedid,
        callerId: callInfo.callerId,
        callerName: callInfo.callerName,
        callee: callInfo.callee,
        startTime: callInfo.startTime,
        endTime: new Date(),
        status: "missed",
        channels: callInfo.channels,
        direction: callInfo.direction,
        hangupCause: Cause,
        hangupCauseTxt: CauseTxt,
      }, { upsert: true, setDefaultsOnInsert: true });

      delete state.activeRinging[Linkedid];
    }
    return;
  }

  // Case 2: An answered call was hung up -> Ended, Busy, Failed etc.
  if (state.ongoingCalls[Linkedid]) {
    // Remove the hung up channel from the call's channel list
    state.ongoingCalls[Linkedid].channels = state.ongoingCalls[
      Linkedid
    ].channels.filter((c) => c !== Channel);

    // If no channels remain, the call is completely ended
    if (state.ongoingCalls[Linkedid].channels.length === 0) {
      const call = state.ongoingCalls[Linkedid];
      const duration = Math.floor((Date.now() - call.startTime) / 1000);

      let finalStatus = "ended";
      switch (String(Cause)) {
        case "17":
          finalStatus = "busy";
          break;
        case "18":
        case "19":
          finalStatus = "unanswered";
          break;
        case "21":
          finalStatus = "failed";
          break;
      }

      console.log(`👋 Call ${Linkedid} ended. Duration: ${duration}s`);

      // Emit call ended event with call details
      io.emit("callEnded", {
        ...call,
        linkedId: Linkedid,
        endTime: Date.now(),
        duration,
        finalStatus,
      });

      // Update call log in database
      updateCallLog(Linkedid, {
        endTime: new Date(),
        duration,
        status: finalStatus,
        hangupCause: Cause,
        hangupCauseTxt: CauseTxt,
      });

      // Remove call from ongoing calls state
      delete state.ongoingCalls[Linkedid];

      // Emit updated ongoing calls list to all clients
      emitOngoingCallsStatus(io);
    }
  } else {
    // Force remove any call that might match this LinkedId (fallback cleanup)
    let foundAndRemoved = false;
    Object.keys(state.ongoingCalls).forEach((callId) => {
      if (
        callId === Linkedid ||
        state.ongoingCalls[callId].channels?.includes(Channel)
      ) {
        delete state.ongoingCalls[callId];
        foundAndRemoved = true;
      }
    });

    if (foundAndRemoved) {
      emitOngoingCallsStatus(io);
    }
  }
}

function handleHold(event, io) {
  if (state.ongoingCalls[event.Linkedid]) {
    state.ongoingCalls[event.Linkedid].state = "On Hold";
    console.log(`📞 Call ${event.Linkedid} put on hold`);
    // updateCallLog(event.Linkedid, { status: "on_hold" });
    emitOngoingCallsStatus(io);
  }
}

function handleUnhold(event, io) {
  if (state.ongoingCalls[event.Linkedid]) {
    state.ongoingCalls[event.Linkedid].state = "Talking";
    console.log(`📞 Call ${event.Linkedid} resumed from hold`);
    updateCallLog(event.Linkedid, { status: "answered" });
    emitOngoingCallsStatus(io);
  }
}

// --- QUEUE EVENT HANDLERS ---

function handleQueueParams(event) {
  state.queueData[event.Queue] = { name: event.Queue, ...event };
}

function handleQueueMember(event) {
  const { Queue, Location } = event;

  // Get human-readable queue name if available
  const readableQueueName = queueNameMap[Queue] || Queue;

  // Add queueName to the event
  event.queueName = readableQueueName;

  if (!state.queueMembers[Queue]) {
    state.queueMembers[Queue] = [];
  }

  const existingIndex = state.queueMembers[Queue].findIndex(
    (m) => m.Location === Location
  );

  if (existingIndex !== -1) {
    state.queueMembers[Queue][existingIndex] = event;
  } else {
    state.queueMembers[Queue].push(event);
  }
}

/**
 * Handles the 'QueueMemberStatus' event from AMI
 * @param {object} event - The AMI event object containing member status information.
 */
function handleQueueMemberStatus(event) {
  // console.log("QueueMemberStatus Event Data:", event);
}

function handleQueueStatusComplete(io) {
  io.emit("queueUpdate", state.queueData);
  emitQueueMembersStatus(io);
}

function handleQueueCallerJoin(event, io) {
  const { Queue, Uniqueid, CallerIDNum, Position, Linkedid } = event;

  const alreadyExists = state.queueCallers.some((c) => c.id === Uniqueid);
  if (!alreadyExists) {
    state.queueCallers.push({
      id: Uniqueid,
      caller_id: CallerIDNum,
      position: parseInt(Position),
      queue: queueNameMap[Queue] || Queue, // Map number to name here
      queueId: Queue,
      waitStart: Date.now(),
      linkedId: Linkedid,
    });
  }

  // Update call log with queue information
  if (Linkedid) {
    updateCallLog(Linkedid, {
      queue: Queue,
      queueName: queueNameMap[Queue] || Queue,
      status: "queued",
    });
  }

  console.log(
    `📞 Caller ${CallerIDNum} joined queue ${Queue} at position ${Position}`
  );
  // console.log(state.queueCallers);
  emitQueueCallersStatus(io);
}

function handleQueueCallerLeave(event, io) {
  const { Uniqueid, Linkedid } = event;

  // Find the caller to get wait time before removing
  const caller = state.queueCallers.find((c) => c.id === Uniqueid);
  if (caller) {
    const waitTime = Math.floor((Date.now() - caller.waitStart) / 1000);

    // Update call log with wait time
    if (Linkedid || caller.linkedId) {
      updateCallLog(Linkedid || caller.linkedId, {
        waitTime: waitTime,
        status: "answered", // Assuming leave means answered, abandon event handles abandonment
      });
    }

    console.log(
      `📞 Caller ${caller.caller_id} left queue ${caller.queueId} after waiting ${waitTime}s`
    );
  }

  // Filter out caller by ID from the array (ignore queue)
  state.queueCallers = state.queueCallers.filter((c) => c.id !== Uniqueid);
  emitQueueCallersStatus(io);
}

async function handleQueueCallerAbandon(event, io) {
  const { Uniqueid, Linkedid, Queue: queueId } = event;

  // Find the caller to get wait time before removing
  const caller = state.queueCallers.find((c) => c.id === Uniqueid);
  if (caller) {
    const waitTime = Math.floor((Date.now() - caller.waitStart) / 1000);

    // Update call log with abandon status and wait time
    if (Linkedid || caller.linkedId) {
      updateCallLog(Linkedid || caller.linkedId, {
        waitTime: waitTime,
        status: "abandoned",
        endTime: new Date(),
      });
    }

    console.log(
      `📞 Caller ${caller.caller_id} abandoned queue ${caller.queueId} after waiting ${waitTime}s`
    );

    // Update queue statistics for abandoned call
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const currentHour = new Date().getHours();
      const queueName = queueNameMap[queueId] || queueId;

      // Find or create today's statistics for this queue
      let stats = await QueueStatistics.findOne({
        queueId: queueId,
        date: today
      });

      if (!stats) {
        stats = new QueueStatistics({
          queueId: queueId,
          queueName: queueName,
          date: today
        });
      }

      // Update overall statistics
      stats.totalCalls += 1;
      stats.abandonedCalls += 1;
      stats.totalWaitTime += waitTime;

      // Update average wait time
      if (stats.totalCalls > 0) {
        stats.averageWaitTime = stats.totalWaitTime / stats.totalCalls;
      }

      // Update longest/shortest wait time
      if (waitTime > stats.longestWaitTime) {
        stats.longestWaitTime = waitTime;
      }
      if (stats.shortestWaitTime === null || waitTime < stats.shortestWaitTime) {
        stats.shortestWaitTime = waitTime;
      }

      // Update hourly statistics using Map (more reliable)
      const hourKey = currentHour.toString();

      // Get or initialize hourly stats for this hour
      let hourlyData = stats.hourlyStats.get(hourKey) || {
        calls: 0,
        answered: 0,
        abandoned: 0,
        totalWaitTime: 0,
        totalTalkTime: 0,
        avgWaitTime: 0,
        avgTalkTime: 0
      };

      // Update hourly data
      hourlyData.calls += 1;
      hourlyData.abandoned += 1;
      hourlyData.totalWaitTime += waitTime;

      // Recalculate hourly average wait time
      if (hourlyData.calls > 0) {
        hourlyData.avgWaitTime = hourlyData.totalWaitTime / hourlyData.calls;
      }

      // Save back to Map
      stats.hourlyStats.set(hourKey, hourlyData);

      // Calculate abandonment rate
      if (stats.totalCalls > 0) {
        const abandonmentRate = (stats.abandonedCalls / stats.totalCalls) * 100;
        console.log(`📊 Queue ${queueName} abandonment rate: ${abandonmentRate.toFixed(2)}%`);
      }

      stats.lastUpdated = new Date();
      await stats.save();

      console.log(`✅ Updated queue statistics for ${queueName}: +1 abandoned call (total: ${stats.abandonedCalls})`);
    } catch (error) {
      console.error('❌ Error updating queue statistics for abandoned call:', error);
    }
  }

  // Filter out caller by ID from the array
  state.queueCallers = state.queueCallers.filter((c) => c.id !== Uniqueid);
  emitQueueCallersStatus(io);
}

/**
 * Handles the 'AgentCalled' event when an agent receives a call
 * @param {object} event - The AMI event object.
 */
async function handleAgentCalled(event) {
  const { MemberName, Interface, Queue, CallerIDNum, CallerIDName } = event;

  // Extract extension from Interface (e.g., "Local/1003@from-internal" -> "1003")
  const extensionMatch = Interface.match(/Local\/(\d+)@/);
  const agentExtension = extensionMatch ? extensionMatch[1] : MemberName;

  // Track that agent received a call
  const { trackAgentCall } = require('../controllers/agentControllers/callStatsController');
  await trackAgentCall(agentExtension, 'received', {
    queue: Queue,
    callerId: CallerIDNum,
    callerName: CallerIDName
  });
}

/**
 * Handles the 'AgentComplete' event when a queue call ends.
 * Uses DestLinkedid to remove the ongoing call and emit updated list.
 * @param {object} event - The AMI event object.
 * @param {object} io - The Socket.IO server instance.
 */
/**
 * Handles the 'AgentRingNoAnswer' event when an agent doesn't answer a call
 * @param {object} event - The AMI event object.
 */
async function handleAgentRingNoAnswer(event) {
  const { MemberName, Interface, Queue, RingTime, CallerIDNum } = event;

  // Extract extension from Interface
  const extensionMatch = Interface?.match(/Local\/(\d+)@/);
  const agentExtension = extensionMatch ? extensionMatch[1] : MemberName;

  console.log(`📵 AgentRingNoAnswer: Agent ${agentExtension} missed call from ${CallerIDNum} in queue ${Queue} (Rang for ${RingTime}s)`);

  // Track missed call
  const { trackAgentCall } = require('../controllers/agentControllers/callStatsController');
  trackAgentCall(agentExtension, 'missed', {
    queue: Queue,
    ringTime: parseInt(RingTime) || 0,
    callerId: CallerIDNum
  }).catch(err => console.error('Error tracking missed call:', err));
}

/**
 * Optimized AgentComplete handler
 * Handles queue call completion and prepares wrap-up tracking (manual pause system)
 */
async function handleAgentComplete(event, io) {
  const {
    DestLinkedid,
    Queue,
    MemberName,
    Interface,
    HoldTime,
    TalkTime,
    Reason,
    CallerIDNum,
    CallerIDName,
  } = event;

  // Parse times once
  const holdTime = parseInt(HoldTime) || 0;
  const talkTime = parseInt(TalkTime) || 0;
  const totalDuration = holdTime + talkTime;

  // Extract extension from Interface (optimized regex)
  const extensionMatch = Interface?.match(/Local\/(\d+)@/);
  const agentExtension = extensionMatch ? extensionMatch[1] : MemberName;

  console.log(
    `🎯 AgentComplete: ${agentExtension} completed call from ${CallerIDNum} in queue ${Queue} (Talk: ${talkTime}s, Hold: ${holdTime}s)`
  );

  // Update agent statistics (non-blocking)
  const { trackAgentCall } = require('../controllers/agentControllers/callStatsController');
  trackAgentCall(agentExtension, 'completed', {
    queue: Queue,
    talkTime: talkTime,
    holdTime: holdTime
  }).catch(err => console.error('Error tracking agent call:', err));

  // PHASE 1: Record call end timestamp
  const key = `${Queue}:${agentExtension}`;
  const queueName = queueNameMap[Queue] || Queue;
  const callEndTime = Date.now();

  state.pendingWrap[key] = {
    callEndTime: callEndTime,
    linkedId: DestLinkedid,
    queue: Queue,
    queueName: queueName,
    agent: agentExtension,
    agentName: MemberName,
    callerId: CallerIDNum,
    callerName: CallerIDName,
    talkTime: talkTime,
    interface: Interface,
  };

  console.log(`⏱️ Wrap-up tracking ready for agent ${agentExtension} in queue ${Queue} (waiting for manual pause)`);

  // Handle ongoing call state
  const call = state.ongoingCalls[DestLinkedid];

  if (call) {
    // Update call log with completion data
    updateCallLog(DestLinkedid, {
      endTime: new Date(),
      duration: totalDuration,
      status: "completed",
      holdTime: holdTime,
      waitTime: holdTime,
      queue: Queue,
      agentName: MemberName,
      agentExtension: agentExtension,
      hangupReason: Reason,
    });

    // Remove from ongoing calls
    delete state.ongoingCalls[DestLinkedid];

    // Emit call ended event
    io.emit("callEnded", {
      ...call,
      linkedId: DestLinkedid,
      endTime: Date.now(),
      duration: totalDuration,
      holdTime: holdTime,
      talkTime: talkTime,
      queue: Queue,
      agent: MemberName,
      agentExtension: agentExtension,
      reason: Reason,
      finalStatus: "completed",
    });

    // Emit updated ongoing calls list
    emitOngoingCallsStatus(io);
  }
}

// --- RTP STATISTICS HANDLERS FOR CALL QUALITY ---

/**
 * Handles the 'RTPStat' event from AMI to gather call quality metrics
 * @param {object} event - The AMI event object containing RTP statistics
 */
async function handleRTPStat(event) {
  try {
    if (!event) {
      console.error('❌ Invalid RTPStat event: event is null or undefined');
      return;
    }

    const {
      Channel,
      LocalAddress,
      LocalPort,
      RemoteAddress,
      RemotePort,
      LocalLoss,
      RemoteLoss,
      LocalJitter,
      RemoteJitter,
      LocalPackets,
      RemotePackets,
      LocalRTT,
      RemoteRTT,
      DroppedFrames,
      OOOFrames,
      RxJitter,
      TxJitter,
      LocalCount,
      RemoteCount,
      Accountcode,
      Linkedid
    } = event;

    // Extract linked ID from channel name if needed
    const linkedId = Linkedid || extractLinkedIdFromChannel(Channel);

    if (!linkedId) {
      console.warn('⚠️ Could not extract linkedId from RTPStat event:', event.Channel);
      return;
    }

    // Validate required numeric values
    const localPackets = parseFloat(LocalPackets) || 0;
    const remotePackets = parseFloat(RemotePackets) || 0;
    const localLoss = parseFloat(LocalLoss) || 0;
    const remoteLoss = parseFloat(RemoteLoss) || 0;
    const localJitter = parseFloat(LocalJitter) || 0;
    const remoteJitter = parseFloat(RemoteJitter) || 0;
    const localRtt = parseFloat(LocalRTT) || 0;
    const remoteRtt = parseFloat(RemoteRTT) || 0;

    // Calculate quality metrics
    const localLossRate = localPackets > 0 ? (localLoss / localPackets) * 100 : 0;
    const remoteLossRate = remotePackets > 0 ? (remoteLoss / remotePackets) * 100 : 0;
    const avgLossRate = (localLossRate + remoteLossRate) / 2;

    const avgJitter = (localJitter + remoteJitter) / 2;
    const avgRtt = Math.max(localRtt, remoteRtt);

    // Calculate MOS (Mean Opinion Score) based on ITU-T G.107 recommendation
    const mosScore = calculateMOS(avgLossRate, avgJitter, avgRtt);

    // Find the existing call log to link quality metrics
    const callLog = await CallLog.findOne({ linkedId });

    if (callLog) {
      // Update or create call quality metrics
      const qualityMetrics = await CallQualityMetrics.findOneAndUpdate(
        { callLogId: callLog._id },
        {
          callLogId: callLog._id,
          jitter: avgJitter,
          packetLoss: avgLossRate,
          rtt: avgRtt,
          averageJitter: avgJitter,
          maxJitter: Math.max(localJitter, remoteJitter),
          packetLossRate: avgLossRate,
          averageLatency: avgRtt,
          maxLatency: avgRtt,
          qualityScore: mosScore * 20, // MOS to 0-100 scale
          mosScore: mosScore,
          hasQualityIssues: avgLossRate > 2 || avgJitter > 30 || avgRtt > 100,
          qualityIssues: [
            ...(avgLossRate > 2 ? ['packet_loss'] : []),
            ...(avgJitter > 30 ? ['jitter'] : []),
            ...(avgRtt > 100 ? ['latency'] : [])
          ]
        },
        { upsert: true, new: true }
      );

      console.log(`📊 RTP Stats for ${linkedId}: Jitter=${avgJitter.toFixed(2)}ms, Loss=${avgLossRate.toFixed(2)}%, RTT=${avgRtt.toFixed(2)}ms, MOS=${mosScore.toFixed(2)}`);

      // Update real-time queue statistics with quality metrics
      try {
        const { updateQueueQualityMetrics } = require('../controllers/queueControllers/realTimeQueueStats');
        await updateQueueQualityMetrics(callLog, qualityMetrics);
      } catch (queueUpdateError) {
        console.error('❌ Error updating real-time queue quality metrics:', queueUpdateError);
      }
    } else {
      console.warn('⚠️ No call log found for linkedId:', linkedId);
    }
  } catch (error) {
    console.error('❌ Error handling RTP statistics:', error);
    console.error('Event details:', event ? { Channel: event.Channel, Linkedid: event.Linkedid } : 'No event data');
  }
}

/**
 * Extract linked ID from channel name
 * @param {string} channel - Channel name from AMI event
 * @returns {string} Linked ID extracted from channel
 */
function extractLinkedIdFromChannel(channel) {
  if (!channel) return null;

  // Example: PJSIP/trunks-0000001a;1678901234.123 -> extract linkedId
  const match = channel.match(/\.(\d+)$|;(\d+)$/);
  return match ? match[1] || match[2] : null;
}

/**
 * Calculate MOS (Mean Opinion Score) based on network quality metrics
 * @param {number} packetLoss - Packet loss percentage
 * @param {number} jitter - Jitter in milliseconds
 * @param {number} rtt - Round-trip time in milliseconds
 * @returns {number} MOS score (1.0 to 5.0)
 */
function calculateMOS(packetLoss, jitter, rtt) {
  try {
    // Convert RTT to delay (half of RTT) and add codec delay (assumed 20ms)
    const delay = Math.min(rtt / 2 + 20, 200);

    // Calculate effective latency (in milliseconds)
    const effectiveLatency = delay + (jitter * 2);

    // Calculate R-factor based on ITU-T G.107
    let R = 0;
    if (effectiveLatency < 160) {
      R = 93.2 - (effectiveLatency / 40);
    } else {
      R = 93.2 - ((effectiveLatency - 120) / 10);
    }

    // Factor in packet loss (subtract 2.5 per percentage point of packet loss above 0.5%)
    if (packetLoss > 0.5) {
      R -= (packetLoss - 0.5) * 2.5;
    }

    // Ensure R-factor stays within reasonable bounds
    R = Math.max(0, Math.min(100, R));

    // Convert R-factor to MOS
    let mos = 1.0 + (0.035 * R) + (R * (R - 60) * (100 - R) * 7) / 1000000;

    // Ensure MOS is within bounds
    mos = Math.max(1.0, Math.min(5.0, mos));

    return mos;
  } catch (error) {
    console.error('❌ Error calculating MOS score:', error);
    return 3.5; // Return "good" quality if calculation fails
  }
}

// --- ENDPOINT & AGENT STATUS HANDLERS ---

function handleEndpointList(event) {
  // console.log(event)
  // Track agent status in real-time
  const agentId = event.ObjectName;
  const status = event.State === "Online" ? "online" : "offline";

  state.agentStatus[agentId] = {
    extension: agentId,
    aor: event.AOR,
    state: event.State,
    contacts: event.Contacts,
    transport: event.Transport,
    deviceState: event.DeviceState,
    status: status,
    lastUpdated: new Date(),
  };

  state.endpointList.push(event);
}

function handleEndpointListComplete(event, io) {
  // Emit the enriched agent status to all connected clients
  emitAgentStatus(io);

  // Reset for the next batch
  state.endpointList = [];
}

// Enhanced: Track agent shift on status change
async function handleContactStatus(event, io) {
  const { EndpointName, ContactStatus } = event;
  let status = "";
  let reason = "unknown";
  if (ContactStatus === "Reachable") {
    status = "online";
    reason = "manual login";
  } else if (ContactStatus === "Unreachable") {
    status = "offline";
    reason = "connection lost";
  } else if (ContactStatus === "Removed") {
    status = "offline";
    reason = "power outage or removed";
  }

  if (status) {
    // Update agent status in state
    if (state.agentStatus[EndpointName]) {
      state.agentStatus[EndpointName].status = status;
      state.agentStatus[EndpointName].lastUpdated = new Date();
    } else {
      state.agentStatus[EndpointName] = {
        extension: EndpointName,
        status: status,
        lastUpdated: new Date(),
      };
    }

    // Emit real-time status update to all clients
    io.emit("agentStatusUpdate", {
      agentId: EndpointName,
      status: status,
      timestamp: new Date(),
    });

    // Emit the enriched agent status
    emitAgentStatus(io);

  }
}

/**
 * Handle QueueMemberPause event - Confirms wrap-up start or handles manual pause
 */
async function handleQueueMemberPause(event, io) {

  const { Queue, MemberName, Interface, Paused, PausedReason } = event;
  // Extract extension from Interface
  const extensionMatch = Interface?.match(/Local\/(\d+)@/);
  const agentExtension = extensionMatch ? extensionMatch[1] : MemberName;

  if (Paused === "1") {
    const key = `${Queue}:${agentExtension}`;

    // PHASE 2 CONFIRMATION: Check if there's a pending wrap-up for this agent
    if (state.pendingWrap[key]) {
      const wrapStartTime = Date.now();
      state.pendingWrap[key].wrapStartTime = wrapStartTime;

      // Move from pending to active
      state.agentWrapStatus[agentExtension] = {
        inWrapUp: true,
        wrapStartTime: wrapStartTime,
        callEndTime: state.pendingWrap[key].callEndTime,
        queue: Queue,
        queueName: state.pendingWrap[key].queueName,
        pauseReason: PausedReason || 'Wrap-up',
      };

      console.log(`✅ Agent ${agentExtension} paused in queue ${Queue} - Wrap-up ACTIVE (auto-paused)`);

      // Emit wrap-up status to frontend
      io.emit('agentWrapStatus', {
        agent: agentExtension,
        agentName: state.pendingWrap[key].agentName,
        queue: Queue,
        queueName: state.pendingWrap[key].queueName,
        inWrapUp: true,
        paused: true,
        pauseReason: PausedReason || 'Wrap-up',
        wrapStartTime: wrapStartTime,
        callEndTime: state.pendingWrap[key].callEndTime,
      });


    } else {
      // This is a manual pause (not related to wrap-up)
      console.log(`⏸️ Agent ${agentExtension} manually paused in queue ${Queue} (not wrap-up)`);
    }
  }
}

/**
 * Handle QueueMemberPause event - Agent unpauses (completes wrap-up)
 */
async function handleQueueMemberUnpause(event, io) {
  const { Queue, MemberName, Interface } = event;

  // Extract extension from Interface
  const extensionMatch = Interface?.match(/Local\/(\d+)@/);
  const agentExtension = extensionMatch ? extensionMatch[1] : MemberName;

  const key = `${Queue}:${agentExtension}`;

  // PHASE 3: Check if there's an active wrap-up for this agent
  if (state.pendingWrap[key]) {
    const wrapEndTime = Date.now();
    const wrapData = state.pendingWrap[key];

    // Calculate wrap-up time from call end (includes pause delay)
    const totalWrapTimeSec = Math.round((wrapEndTime - wrapData.callEndTime) / 1000);

    // Calculate active wrap-up time (from pause confirmation)
    const activeWrapTimeSec = wrapData.wrapStartTime
      ? Math.round((wrapEndTime - wrapData.wrapStartTime) / 1000)
      : totalWrapTimeSec;

    console.log(`✅ Agent ${agentExtension} unpaused in queue ${Queue} - Wrap-up COMPLETED`);
    console.log(`   Total wrap-up time: ${totalWrapTimeSec}s (from call end)`);
    console.log(`   Active wrap-up time: ${activeWrapTimeSec}s (from pause)`);

    // Save wrap-up time to database
    try {
      await WrapUpTime.create({
        queue: Queue,
        queueName: wrapData.queueName,
        agent: agentExtension,
        agentName: wrapData.agentName,
        callEndTime: new Date(wrapData.callEndTime),
        wrapStartTime: wrapData.wrapStartTime ? new Date(wrapData.wrapStartTime) : new Date(wrapData.callEndTime),
        wrapEndTime: new Date(wrapEndTime),
        wrapTimeSec: totalWrapTimeSec, // Store total time
        activeWrapTimeSec: activeWrapTimeSec, // Store active time
        linkedId: wrapData.linkedId,
        callerId: wrapData.callerId,
        callerName: wrapData.callerName,
        talkTime: wrapData.talkTime,
        status: 'completed',
      });

      console.log(`💾 Wrap-up time saved to database: ${totalWrapTimeSec}s total, ${activeWrapTimeSec}s active`);
    } catch (error) {
      console.error('❌ Error saving wrap-up time:', error);
    }

    // Update agent's average wrap time (use total time for statistics)
    const { updateAgentWrapTime } = require('../controllers/agentControllers/realTimeAgent');
    if (updateAgentWrapTime) {
      await updateAgentWrapTime(agentExtension, totalWrapTimeSec, io);
    }

    // Emit wrap-up completion to frontend via Socket.IO
    io.emit('wrapupComplete', {
      queue: Queue,
      queueName: wrapData.queueName,
      agent: agentExtension,
      agentName: wrapData.agentName,
      wrapTimeSec: totalWrapTimeSec,
      activeWrapTimeSec: activeWrapTimeSec,
      timestamp: new Date(),
      linkedId: wrapData.linkedId,
    });

    // Clear wrap-up status
    delete state.pendingWrap[key];
    delete state.agentWrapStatus[agentExtension];

    // Emit status update to frontend
    io.emit('agentWrapStatus', {
      agent: agentExtension,
      queue: Queue,
      queueName: wrapData.queueName,
      inWrapUp: false,
      wrapTimeSec: totalWrapTimeSec,
    });

    console.log(`🎉 Wrap-up tracking completed for agent ${agentExtension} in queue ${Queue}`);
  } else {
    // This is a regular unpause (not related to wrap-up)
    console.log(`▶️ Agent ${agentExtension} unpaused in queue ${Queue} (not wrap-up related)`);
  }
}

// --- MAIN SETUP FUNCTION ---

/**
 * Sets up all Asterisk AMI event listeners.
 * This function should be called ONLY ONCE when your server starts.
 * @param {AmiClient} ami - The configured and connected AMI client instance.
 * @param {object} io - The Socket.IO server instance.
 */
async function setupAmiEventListeners(ami, io) {
  ami.setMaxListeners(50);
  await loadQueueNamesMap();
  await loadAgentDataMap();

  // Make queue name map globally accessible
  global.queueNameMap = queueNameMap;
  global.state = state;

  // Initialize real-time agent tracking with stats
  const {
    setupAgentListeners,
  } = require("../controllers/agentControllers/realTimeAgent");
  setupAgentListeners(ami, io);

  // Initialize real-time queue statistics tracking
  const {
    setupQueueStatsListeners,
  } = require("../controllers/queueControllers/realTimeQueueStats");
  setupQueueStatsListeners(ami, io);

  ami.on("BridgeEnter", (event) => handleBridgeEnter(event, io, ami));
  ami.on("BridgeDestroy", handleBridgeDestroy);

  // Agent call tracking events
  ami.on("AgentCalled", handleAgentCalled);
  // AgentConnect is now handled in realTimeAgent.js for better organization
  ami.on("AgentRingNoAnswer", handleAgentRingNoAnswer);
  ami.on("AgentComplete", (event) => handleAgentComplete(event, io));

  ami.on("DialBegin", (event) => handleDialBegin(event, io));
  ami.on("Hangup", (event) => handleHangup(event, io));
  ami.on("Hold", (event) => handleHold(event, io));
  ami.on("Unhold", (event) => handleUnhold(event, io));

  ami.on("QueueParams", handleQueueParams);
  ami.on("QueueMember", handleQueueMember);
  ami.on("QueueMemberStatus", handleQueueMemberStatus);
  ami.on("QueueStatus", handleQueueStatus);
  ami.on("QueueStatusComplete", () => handleQueueStatusComplete(io));
  ami.on("QueueCallerJoin", (event) => handleQueueCallerJoin(event, io));
  ami.on("QueueCallerLeave", (event) => handleQueueCallerLeave(event, io));
  ami.on("QueueCallerAbandon", async (event) => await handleQueueCallerAbandon(event, io));
  ami.on("RTPStat", (event) => handleRTPStat(event));
  ami.on("AgentDump", (event) => { console.log(event) })
  // Wrap-up time tracking events
  ami.on("QueueMemberPause", (event) => {
    // Check if this is an unpause event (Paused: 0)
    if (event.Paused === "0") {
      handleQueueMemberUnpause(event, io);
    } else {
      handleQueueMemberPause(event, io);
    }
  });

  // Endpoint/Agent Status Events
  ami.on("EndpointList", handleEndpointList);
  ami.on("EndpointListComplete", (event) =>
    handleEndpointListComplete(event, io)
  );
  ami.on("ContactStatus", (event) => handleContactStatus(event, io));

  // NOTE: The generic ami.on('event', ...) listener has been REMOVED for performance.
  // Its logic has been merged into the specific 'Hangup' handler.

  // -- Start periodic polling actions --
  setInterval(() => ami.action({ Action: "QueueStatus" }), 2000);
  setInterval(() => ami.action({ Action: "PJSIPShowEndpoints" }), 5000);

  console.log("✅ AMI event listeners registered and ready.");

  // It's better to handle socket-specific events outside this function,
  // in your main server file where you handle `io.on('connection', ...)`.
  // This avoids adding duplicate listeners.
}

module.exports = {
  setupAmiEventListeners,
  state,
  loadQueueNamesMap,
  loadAgentDataMap,
  emitAgentStatus,
  emitOngoingCallsStatus,
  updateCallLog,
};
