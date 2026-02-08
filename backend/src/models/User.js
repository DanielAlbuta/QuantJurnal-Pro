const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Authentication fields
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },

    // Profile fields (matching UserProfile interface)
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    accountType: {
        type: String,
        default: 'Standard Account'
    },
    startBalance: {
        type: Number,
        default: 10000
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'RON']
    },
    maxRiskPerTrade: {
        type: Number,
        default: 2.0,
        min: 0,
        max: 100
    },
    maxDailyLoss: {
        type: Number,
        default: 5.0,
        min: 0,
        max: 100
    },
    monthlyGoal: {
        type: Number,
        default: 10.0,
        min: 0
    },
    avatarUrl: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: '',
        maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    customStrategies: {
        type: [String],
        default: ['Breakout', 'Pullback', 'Reversal', 'Momentum', 'Range']
    },
    customSetups: {
        type: [String],
        default: ['Break & Retest', 'Supply/Demand', 'Trendline Break', 'Double Top/Bottom', 'Engulfing']
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Index for faster queries
userSchema.index({ email: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    // Only hash if password was modified
    if (!this.isModified('password')) {
        return next();
    }

    // Hash password with 10 rounds
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Transform _id to id in JSON responses
userSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
    }
});

module.exports = mongoose.model('User', userSchema);
