const expenseService = require("../services/expenseService");

const handleError = (error, response, fallbackMessage) => {
    if (error?.status) {
        return response.status(error.status).json({ message: error.message });
    }

    console.error(error);
    return response.status(500).json({ message: fallbackMessage });
};

const expenseController = {
    create: async (request, response) => {
        try {
            const expense = await expenseService.createExpense(
                request.params.groupId,
                request.user.email,
                request.body
            );

            return response.status(201).json(expense);
        } catch (error) {
            return handleError(error, response, "Error creating expense");
        }
    },

    getTransactions: async (request, response) => {
        try {
            const transactions = await expenseService.getTransactions(
                request.params.groupId,
                request.user.email
            );

            return response.status(200).json(transactions);
        } catch (error) {
            return handleError(error, response, "Error fetching transactions");
        }
    },

    getSummary: async (request, response) => {
        try {
            const summary = await expenseService.getSummary(
                request.params.groupId,
                request.user.email
            );

            return response.status(200).json(summary);
        } catch (error) {
            return handleError(error, response, "Error fetching summary");
        }
    },

    settleGroup: async (request, response) => {
        try {
            const settlement = await expenseService.settleGroup(
                request.params.groupId,
                request.user.email
            );

            return response.status(200).json({
                message: "Group settled successfully",
                settlement
            });
        } catch (error) {
            return handleError(error, response, "Error settling group");
        }
    },

    getAudit: async (request, response) => {
        try {
            const audit = await expenseService.getAudit(
                request.params.groupId,
                request.user.email
            );

            return response.status(200).json(audit);
        } catch (error) {
            return handleError(error, response, "Error fetching audit log");
        }
    }
};

module.exports = expenseController;
