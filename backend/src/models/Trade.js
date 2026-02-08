const mongoose = require('mongoose');

// Enums matching frontend types.ts
const DIRECTION_ENUM = ['LONG', 'SHORT'];
const TRADE_STATUS_ENUM = ['OPEN', 'CLOSED', 'PENDING'];
const ASSET_CLASS_ENUM = ['FOREX', 'CRYPTO', 'INDICES', 'COMMODITIES', 'STOCKS'];
const SESSION_ENUM = ['ASIA', 'LONDON', 'NY', 'OVERLAP'];

const tradeSchema = new mongoose.Schema({
    // Reference to User
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Account reference (stored as string, matches frontend)
    accountId: {
        type: String,
        default: 'default'
    },

    // Instrument details
    symbol: {
        type: String,
        required: [true, 'Symbol is required'],
        uppercase: true,
        trim: true
    },
    assetClass: {
        type: String,
        enum: ASSET_CLASS_ENUM,
        default: 'FOREX'
    },
    direction: {
        type: String,
        enum: DIRECTION_ENUM,
        required: [true, 'Direction is required']
    },

    // Timing
    entryDate: {
        type: Number, // Unix timestamp (ms)
        required: [true, 'Entry date is required']
    },
    exitDate: {
        type: Number // Unix timestamp (ms)
    },

    // Prices
    entryPrice: {
        type: Number,
        required: [true, 'Entry price is required']
    },
    exitPrice: {
        type: Number
    },
    size: {
        type: Number,
        required: [true, 'Position size is required'],
        min: [0, 'Size must be positive']
    },

    // Financials
    grossPnL: {
        type: Number,
        default: 0
    },
    commission: {
        type: Number,
        default: 0
    },
    swap: {
        type: Number,
        default: 0
    },
    netPnL: {
        type: Number,
        default: 0
    },

    // Risk Management
    initialStopLoss: {
        type: Number,
        default: 0
    },
    takeProfit: {
        type: Number
    },
    riskAmount: {
        type: Number,
        default: 0
    },
    riskMultiple: {
        type: Number,
        default: 0
    },

    // Strategy & Classification
    strategy: {
        type: String,
        default: ''
    },
    setup: {
        type: String,
        default: ''
    },
    timeframe: {
        type: String,
        default: ''
    },
    session: {
        type: String,
        enum: SESSION_ENUM,
        default: 'NY'
    },

    // Psychology
    confidence: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    mistake: {
        type: [String],
        default: []
    },
    notes: {
        type: String,
        default: '',
        maxlength: [5000, 'Notes cannot exceed 5000 characters']
    },

    // Media
    images: {
        type: [String],
        default: []
    },

    // Status
    status: {
        type: String,
        enum: TRADE_STATUS_ENUM,
        default: 'CLOSED'
    }
}, {
    timestamps: true
});

// Compound index for user's trades by date
tradeSchema.index({ userId: 1, entryDate: -1 });

// Transform _id to id in JSON responses (matching frontend expectation)
tradeSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Trade', tradeSchema);
