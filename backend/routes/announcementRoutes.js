const express = require('express');
const router = express.Router();
const {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  toggleAnnouncementStatus,
  deleteAnnouncement
} = require('../controllers/announcementController');

// GET /api/announcements - Get all announcements
router.get('/', getAllAnnouncements);

// GET /api/announcements/:id - Get announcement by ID
router.get('/:id', getAnnouncementById);

// POST /api/announcements - Create new announcement
router.post('/', createAnnouncement);

// PUT /api/announcements/:id - Update announcement
router.put('/:id', updateAnnouncement);

// PATCH /api/announcements/:id/toggle - Toggle announcement active status
router.patch('/:id/toggle', toggleAnnouncementStatus);

// DELETE /api/announcements/:id - Delete announcement
router.delete('/:id', deleteAnnouncement);

module.exports = router;