const express = require('express');
const router = express.Router();
const { updateProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

// All profile routes require authentication
router.use(protect);

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put('/', updateProfile);

module.exports = router;
