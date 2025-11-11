const express = require("express");
const { createQueue, getAllQueues, getQueueById, deleteQueue } = require("../controllers/queueControllers/queueController");
const { updateQueue } = require("../controllers/queueControllers/updateQueue");
// Import additional controllers from the old queue.js controller
const {
    getQueue,
    getQueueMember,
    addMemberToQueue,
    removeMemberFromQueue,
    getQueueCount,
    getQueueWaitingReport
} = require("../controllers/queue");
const router = express.Router();

// =========================
// Queue Management Routes
// =========================

// Create a new queue
router.post("/", createQueue);

// Get all queues
router.get("/", getAllQueues);

// Get queue count (must be before /:queueId to avoid conflicts)
router.get("/count", getQueueCount);

// Get queue waiting report (must be before /:queueId to avoid conflicts)
router.get("/waiting-report", getQueueWaitingReport);

// Get a specific queue by id (using the newer controller)
router.get("/:queueId", getQueueById);

// Alternative route for getting queue by ID (from old controller) - keeping as /details for compatibility
router.get("/:queueId/details", getQueue);

// Update a queue by id (new, processes nested fields like createQueue)
router.put("/:queueId", updateQueue);

// Delete a queue by id
router.delete("/:queueId", deleteQueue);

// Get all members of a queue
router.get("/:queueId/members", getQueueMember);

// Add a member to a queue
router.post("/:queueId/members", addMemberToQueue);

// Remove a member from a queue
router.delete("/:queueId/members/:memberId", removeMemberFromQueue);

module.exports = router;
