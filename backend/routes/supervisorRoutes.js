const express = require('express');
const { registerSupervisor, getAllSupervisors, deleteSupervisor, loginSupervisor, protect, checkAuth, logoutSupervisor } = require('../controllers/supervisorController/supervisorController');
const { loginLimiter, strictLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

// Public routes (no authentication required) with rate limiting
router.post('/login', loginLimiter, loginSupervisor);
router.post('/register', strictLimiter, registerSupervisor);

// Protected routes - ALL routes below require authentication
router.use(protect);

// Check authentication status
router.get('/check-auth', checkAuth);

// Logout
router.post('/logout', logoutSupervisor);

// Supervisor management (protected)
router.get('/', getAllSupervisors);
router.delete('/:id', deleteSupervisor);
module.exports = router;