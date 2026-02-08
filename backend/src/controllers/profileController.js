const User = require('../models/User');

/**
 * @desc    Update user profile
 * @route   PUT /api/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
    try {
        // Fields that can be updated
        const allowedFields = [
            'name',
            'accountType',
            'startBalance',
            'currency',
            'maxRiskPerTrade',
            'maxDailyLoss',
            'monthlyGoal',
            'avatarUrl',
            'bio',
            'customStrategies',
            'customSetups'
        ];

        // Build update object with only allowed fields
        const updateData = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid fields to update'
            });
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            {
                new: true, // Return updated document
                runValidators: true // Run schema validators
            }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Update profile error:', error);

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
            error: 'Server error while updating profile'
        });
    }
};
