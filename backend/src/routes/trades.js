const express = require('express');
const router = express.Router();
const {
    getTrades,
    createTrade,
    updateTrade,
    deleteTrade,
    deleteAllTrades
} = require('../controllers/tradesController');
const { protect } = require('../middleware/auth');

// All trade routes require authentication
router.use(protect);

// @route   GET /api/trades
// @desc    Get all trades for authenticated user
// @access  Private
router.get('/', getTrades);

// @route   POST /api/trades
// @desc    Create new trade
// @access  Private
router.post('/', createTrade);

// @route   DELETE /api/trades
// @desc    Delete all trades for authenticated user
// @access  Private
// NOTE: This must come BEFORE /:id route to avoid matching "all" as an id
router.delete('/', deleteAllTrades);

// @route   PUT /api/trades/:id
// @desc    Update trade
// @access  Private
router.put('/:id', updateTrade);

// @route   DELETE /api/trades/:id
// @desc    Delete trade
// @access  Private
router.delete('/:id', deleteTrade);

module.exports = router;
