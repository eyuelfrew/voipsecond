// =========================
// Imports
// =========================
const express = require("express");
require("dotenv").config();
const connectDB = require("./config/db");
const cors = require("cors");
const fs = require("fs");
const agentRoutes = require("./routes/agent");
const queueRoutes = require("./routes/queue");
const reportRoutes = require("./routes/report");
const ivrRoutes = require('./routes/ivrRoutes');
const recordingRoutes = require('./routes/recordingRoutes');
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const miscApplicationRoute = require("./routes/miscApplication");
const applyConfigRoute = require("./routes/applyConfig");
const shiftRoutes = require('./routes/shiftRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const customerRoutes = require('./routes/customerRoutes');
const kbRoutes = require('./routes/kbRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const callRoutes = require('./routes/callRoutes');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contactRoutes');
const cannedResponseRoutes = require('./routes/cannedResponseRoutes');
const announcementRoutes = require('./routes/announcementRoutes');

const supervisorRoutes = require('./routes/supervisorRoutes');
// =========================
// App Initialization
// =========================
const app = express();

// =========================
// Database Connection
// =========================
connectDB();

// =========================
// Middleware
// =========================
app.use(express.json());
app.use(cookieParser());

// CORS configuration based on environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const corsOrigins = NODE_ENV === 'production' 
  ? ['https://172.20.47.53', 'https://172.20.47.53:443', 'https://172.20.47.53:5173', 'https://172.20.47.53:3000', 'https://172.20.47.53:4000', 'http://172.20.47.53', 'http://172.20.47.53:5173', 'http://172.20.47.53:3000', 'http://172.20.47.53:4000']
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4000', 'https://localhost:5173', 'https://localhost:3000'];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(morgan('dev'));
app.use('/recordings', express.static('/var/lib/asterisk/sounds/en/custom'))

app.get('/recordings', (req, res) => {
  const recordingsDir = '/var/lib/asterisk/sounds/en/custom'
  const files = fs.readdirSync(recordingsDir)
    .filter(f => f.endsWith('.wav') || f.endsWith('.gsm'))
    .map(f => f.replace(/\.(wav|gsm)$/, '')) // remove extension

  res.json(files) // [ 'welcome-message', 'main-ivr', ... ]
})
// =========================
// API Routes
// =========================
app.use("/api/agent", agentRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/report", reportRoutes);

// Apply config route
app.use("/api/apply-config", applyConfigRoute);

// IVR Routes
app.use('/api/ivr', ivrRoutes);
app.use('/api/audio', recordingRoutes);

// Misc Application Route
app.use("/api/misc", miscApplicationRoute);

// Shift Routes
app.use('/api/shifts', shiftRoutes);

// Queue Statistics Routes
const queueStatisticsRoutes = require('./routes/queueStatisticsRoutes');
app.use('/api/queue-statistics', queueStatisticsRoutes);

// Ticket Routes
app.use('/api/tickets', ticketRoutes);

// Customer Routes
app.use('/api/customers', customerRoutes);

// Knowledge Base Routes
app.use('/api/kb', kbRoutes);

// Metrics Routes
app.use('/api/metrics', metricsRoutes);
const metricsTodayRoutes = require('./routes/metricsToday');
app.use('/api/metrics', metricsTodayRoutes);

// Supervisor Routes
app.use('/api/supervisors', supervisorRoutes);

// Call Routes
app.use('/api/call', callRoutes);
app.use("/api/auth", authRoutes); // Register the new auth route
app.use('/api/contacts', contactRoutes);
app.use('/api/canned-responses', cannedResponseRoutes);
app.use('/api/announcements', announcementRoutes);
// =========================
// Export App
// =========================
module.exports = app;
