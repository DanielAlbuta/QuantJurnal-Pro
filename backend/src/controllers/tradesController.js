const Trade = require('../models/Trade');

/**
 * @desc    Get all trades for authenticated user
 * @route   GET /api/trades
 * @access  Private
 */
exports.getTrades = async (req, res) => {
    try {
        const trades = await Trade.find({ userId: req.user.id })
            .sort({ entryDate: -1 }); // Most recent first

        res.status(200).json({
            success: true,
            count: trades.length,
            trades: trades.map(t => t.toJSON())
        });

    } catch (error) {
        console.error('Get trades error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching trades'
        });
    }
};

/**
 * @desc    Create new trade
 * @route   POST /api/trades
 * @access  Private
 */
exports.createTrade = async (req, res) => {
    try {
        // Add userId from authenticated user
        const tradeData = {
            ...req.body,
            userId: req.user.id
        };

        // Remove id if sent from frontend (MongoDB will generate _id)
        delete tradeData.id;
        delete tradeData._id;

        const trade = await Trade.create(tradeData);

        res.status(201).json({
            success: true,
            trade: trade.toJSON()
        });

    } catch (error) {
        console.error('Create trade error:', error);

        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server error while creating trade'
        });
    }
};

/**
 * @desc    Update trade
 * @route   PUT /api/trades/:id
 * @access  Private
 */
exports.updateTrade = async (req, res) => {
    try {
        // Find trade
        let trade = await Trade.findById(req.params.id);

        if (!trade) {
            return res.status(404).json({
                success: false,
                error: 'Trade not found'
            });
        }

        // Verify ownership
        if (trade.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to update this trade'
            });
        }

        // Don't allow updating userId
        const updateData = { ...req.body };
        delete updateData.userId;
        delete updateData.id;
        delete updateData._id;

        // Update trade
        trade = await Trade.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            trade: trade.toJSON()
        });

    } catch (error) {
        console.error('Update trade error:', error);

        // Handle invalid ObjectId
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid trade ID format'
            });
        }

        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server error while updating trade'
        });
    }
};

/**
 * @desc    Delete trade
 * @route   DELETE /api/trades/:id
 * @access  Private
 */
exports.deleteTrade = async (req, res) => {
    try {
        const trade = await Trade.findById(req.params.id);

        if (!trade) {
            return res.status(404).json({
                success: false,
                error: 'Trade not found'
            });
        }

        // Verify ownership
        if (trade.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to delete this trade'
            });
        }

        await Trade.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Trade deleted successfully'
        });

    } catch (error) {
        console.error('Delete trade error:', error);

        // Handle invalid ObjectId
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid trade ID format'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Server error while deleting trade'
        });
    }
};

/**
 * @desc    Delete all trades for authenticated user
 * @route   DELETE /api/trades
 * @access  Private
 */
exports.deleteAllTrades = async (req, res) => {
    try {
        const result = await Trade.deleteMany({ userId: req.user.id });

        res.status(200).json({
            success: true,
            message: 'All trades deleted successfully',
            count: result.deletedCount
        });

    } catch (error) {
        console.error('Delete all trades error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while deleting trades'
        });
    }
};
