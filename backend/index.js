require("dotenv").config();
const https = require("https");
const fs = require("fs");
const { Server } = require("socket.io");
const AmiClient = require("asterisk-ami-client");
const app = require("./app"); // Your Express app
const { setupAmiEventListeners, state } = require("./config/amiConfig");
const {
  emitAgentStatusOnly,
  state: agentState,
} = require("./controllers/agentControllers/realTimeAgent");

// Import queue statistics scheduler
const { scheduleQueueStatsCalculation } = require("./utils/queueStatsScheduler");

// Import the setup function and state from our refactored AMI handler

// --- Configuration ---
const PORT = process.env.PORT || 4000;
const AMI_USERNAME = process.env.AMI_USERNAME || "admin";
const AMI_PASSWORD = process.env.AMI_PASSWORD || "admin@123";
const NODE_ENV = process.env.NODE_ENV || 'development';
console.log('Environment:', AMI_PASSWORD, AMI_USERNAME, NODE_ENV);
// Dynamic IP configuration based on NODE_ENV
const AMI_HOST = NODE_ENV === 'production'
  ? (process.env.PROD_AMI_HOST || '172.20.47.18')
  : (process.env.DEV_AMI_HOST || '127.0.0.1');
console.log('AMI Host:', AMI_HOST);
const AMI_PORT = parseInt(process.env.AMI_PORT || 5038, 10);

// --- SSL Certificate Configuration ---
let sslOptions = null;
// try {
//   sslOptions = {
//     key: fs.readFileSync('/etc/ssl/private/selfsigned.key'),
//     cert: fs.readFileSync('/etc/ssl/certs/selfsigned.crt')
//   };
//   console.log('✅ SSL certificates loaded successfully');
// } catch (error) {
//   console.log('⚠️  SSL certificate loading failed:', error.message);
//   console.log('🔄 Falling back to HTTP mode');
//   sslOptions = null;
// }

// --- Server & Socket.IO Setup ---
const server = sslOptions ? https.createServer(sslOptions, app) : require('http').createServer(app);
console.log(NODE_ENV)
// CORS configuration based on environment
const corsOrigins = NODE_ENV === 'production'
  ? ['https://172.20.47.53', 'https://172.20.47.53:443', 'https://172.20.47.53:5173', 'https://172.20.47.53:3000', 'https://172.20.47.53:4000', 'http://172.20.47.53', 'http://172.20.47.53:5173', 'http://172.20.47.53:3000', 'http://172.20.47.53:4000']
  : [ 'http://localhost:4000', 'http://localhost:5173','http://localhost:5174', 'https://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST", "PATCH"],
  },
});

// --- AMI Connection and Application Logic ---
const ami = new AmiClient();

// Make AMI and Socket.IO globally accessible
global.ami = ami;
global.amiReady = false;
global.io = io;

// Connect to AMI, then set up all event listeners and socket connections.
ami
  .connect(AMI_USERNAME, AMI_PASSWORD, { host: AMI_HOST, port: AMI_PORT })
  .then(() => {
    console.log("✅ [AMI] Connected successfully!");
    global.amiReady = true;

    // CRITICAL: Set up the AMI event listeners ONCE after a successful connection.
    setupAmiEventListeners(ami, io);

    // Initialize queue statistics scheduler
    scheduleQueueStatsCalculation();
    // Handle individual client (browser) connections.
    io.on("connection", (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // When a new client connects, send them the current state immediately.
      // This ensures their dashboard is populated without waiting for a new event.

      // Send current queue members to new clients
      const { emitQueueMembersStatus } = require("./config/amiConfig");
      // For individual socket, we need to emit directly
      const flattenedMembers = [];
      Object.keys(state.queueMembers).forEach(queueId => {
        state.queueMembers[queueId].forEach(member => {
          flattenedMembers.push({
            ...member,
            queueName: global.queueNameMap?.[queueId] || queueId
          });
        });
      });
      socket.emit("queueMembers", flattenedMembers);

      // Send current enriched agent status if available
      if (Object.keys(agentState.agents).length > 0) {
        emitAgentStatusOnly(socket); // Send to this specific socket
      }

      // Send current queue statistics if available
      const { emitAllQueueStats } = require("./controllers/queueControllers/realTimeQueueStats");
      emitAllQueueStats(socket);

      // Send current ongoing calls to new clients immediately
      socket.emit("ongoingCalls", Object.values(state.ongoingCalls));
      console.log(`📞 Sent ${Object.keys(state.ongoingCalls).length} ongoing calls to new client ${socket.id}`);

      // Send current queue callers (incoming calls) to new clients immediately
      const queueCallersWithWaitTime = state.queueCallers.map((caller) => {
        return {
          ...caller,
          waitTime: Math.floor((Date.now() - caller.waitStart) / 1000),
        };
      });
      socket.emit("queueStatus", queueCallersWithWaitTime);
      console.log(`📞 Sent ${state.queueCallers.length} queue callers to new client ${socket.id}`);

      // Handle request for current agent list - now uses enriched data.
      socket.on("on-going-calles", () => {
        io.emit('ongoingCalls', Object.values(state.ongoingCalls))
        io.emit('queueStatus', state.queueCallers.map((caller) => ({
          ...caller,
          waitTime: Math.floor((Date.now() - caller.waitStart) / 1000),
        })))
      })
      socket.on("requestAgentList", () => {
        try {
          if (!global.amiReady) {
            socket.emit("agentListError", { error: "AMI not connected" });
            return;
          }

          // Send the enriched agent data immediately from memory
          emitAgentStatusOnly(socket);
        } catch (error) {
          socket.emit("agentListError", { error: error.message });
        }
      });

      // Handle request for current queue statistics
      socket.on("requestAllQueueStats", () => {
        try {
          if (!global.amiReady) {
            socket.emit("queueStatsError", { error: "AMI not connected" });
            return;
          }

          // Send current queue statistics
          const { emitAllQueueStats } = require("./controllers/queueControllers/realTimeQueueStats");
          emitAllQueueStats(socket);
        } catch (error) {
          console.error("Error sending queue stats:", error);
          socket.emit("queueStatsError", { error: error.message });
        }
      });

      // Handle request for current queue callers (incoming calls)
      socket.on("requestQueueCallers", () => {
        try {
          if (!global.amiReady) {
            socket.emit("queueStatusError", { error: "AMI not connected" });
            return;
          }

          // Send current queue callers with calculated wait times
          const queueCallersWithWaitTime = state.queueCallers.map((caller) => {
            return {
              ...caller,
              waitTime: Math.floor((Date.now() - caller.waitStart) / 1000),
            };
          });
          socket.emit("queueStatus", queueCallersWithWaitTime);
          console.log(`📞 Sent ${state.queueCallers.length} queue callers to client ${socket.id} on request`);
        } catch (error) {
          console.error("Error sending queue callers:", error);
          socket.emit("queueStatusError", { error: error.message });
        }
      });

      // Handle request for current active calls (ongoing calls)
      socket.on("requestActiveCalls", () => {
        try {
          if (!global.amiReady) {
            socket.emit("activeCallsError", { error: "AMI not connected" });
            return;
          }

          // Send current ongoing calls
          const ongoingCallsArray = Object.values(state.ongoingCalls);
          socket.emit("ongoingCalls", ongoingCallsArray);
          console.log(`📞 Sent ${ongoingCallsArray.length} active calls to client ${socket.id} on request`);
        } catch (error) {
          console.error("Error sending active calls:", error);
          socket.emit("activeCallsError", { error: error.message });
        }
      });

      // Handle events received FROM this specific client.
      socket.on("hangupCall", (linkedId) => {
        if (!linkedId) return;

        console.log(
          `Client ${socket.id} requested hangup for call: ${linkedId}`
        );
        const call = state.ongoingCalls[linkedId];

        if (call && call.channels) {
          // Hang up every channel associated with the call
          call.channels.forEach((channel) => {
            ami.action({ Action: "Hangup", Channel: channel, Cause: "16" });
          });
        } else {
          console.warn(`Hangup request for unknown call ID: ${linkedId}`);
        }
      });

      socket.on("disconnect", () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });
  })
  .catch((err) => {
    console.error(
      "❌ [AMI] Connection failed. The application cannot start.",
      err
    );
    // Exit the process if we can't connect to Asterisk, as the app is non-functional.
    process.exit(1);
  });

// --- Start Server ---
server.listen(PORT, () => {
  const protocol = sslOptions ? 'HTTPS' : 'HTTP';
  console.log(`🚀 ${protocol} Server is live and listening on port ${PORT}`);
  if (sslOptions) {
    console.log(`🔒 SSL Certificate: /etc/ssl/certs/selfsigned.crt`);
    console.log(`🔑 SSL Private Key: /etc/ssl/private/selfsigned.key`);
  } else {
    console.log(`⚠️  Running in HTTP mode (SSL certificates not available)`);
  }
});
