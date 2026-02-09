const mongoose = require('mongoose');

const expenseSplitSchema = new mongoose.Schema({
    memberEmail: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 }
}, { _id: false });

const expenseSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
        index: true
    },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paidByEmail: { type: String, required: true },
    splitType: { type: String, enum: ['equal', 'custom'], required: true },
    splits: { type: [expenseSplitSchema], default: [] },
    createdByEmail: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', expenseSchema);
