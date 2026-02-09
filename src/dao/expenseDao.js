const Expense = require("../model/expense");

const expenseDao = {
    getByGroupId: async (groupId) => {
        return await Expense.find({ groupId }).sort({ createdAt: -1 });
    }
};

module.exports = expenseDao;
