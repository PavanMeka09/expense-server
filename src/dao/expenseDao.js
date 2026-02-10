const Expense = require("../model/expense");

const expenseDao = {
    create: async (data) => {
        const expense = new Expense(data);
        return await expense.save();
    },

    getByGroupId: async (groupId) => {
        return await Expense.find({ groupId }).sort({ createdAt: -1 });
    }
};

module.exports = expenseDao;
