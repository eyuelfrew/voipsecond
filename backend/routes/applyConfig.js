const express = require('express');
const { applyConfig, previewDialplan } = require('../controllers/applyConfig');

const router = express.Router();

// POST /api/apply-config
router.post('/', applyConfig);

// GET /api/apply-config/preview
router.get('/preview', previewDialplan);

module.exports = router;
