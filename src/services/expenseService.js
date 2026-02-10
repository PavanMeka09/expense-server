const expenseDao = require("../dao/expenseDao");
const groupDao = require("../dao/groupDao");

const roundToTwo = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const buildEqualSplits = (members, amount) => {
    const baseShare = roundToTwo(amount / members.length);
    const splits = members.map((memberEmail) => ({
        memberEmail,
        amount: baseShare
    }));

    const total = roundToTwo(splits.reduce((sum, split) => sum + split.amount, 0));
    const delta = roundToTwo(amount - total);
    if (splits.length > 0 && delta !== 0) {
        splits[0].amount = roundToTwo(splits[0].amount + delta);
    }

    return splits;
};

const createServiceError = (message, status = 400) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

const normalizeMemberList = (members) => [...new Set(members)];

const expenseService = {
    createExpense: async (groupId, userEmail, payload) => {
        const group = await groupDao.getGroupForMember(groupId, userEmail);
        if (!group) {
            throw createServiceError("Group not found", 404);
        }

        const { title, amount, splitType, splitWith, splits } = payload || {};
        const normalizedTitle = typeof title === "string" ? title.trim() : "";
        const normalizedAmount = Number(amount);

        if (!normalizedTitle) {
            throw createServiceError("Title is required");
        }
        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            throw createServiceError("Amount must be greater than 0");
        }

        const members = Array.isArray(group.membersEmail) ? group.membersEmail : [];
        const membersSet = new Set(members);
        let normalizedSplits = [];
        let normalizedSplitType = splitType === "custom" ? "custom" : "equal";

        if (normalizedSplitType === "custom") {
            if (!Array.isArray(splits) || splits.length === 0) {
                throw createServiceError("Custom split values are required");
            }

            const seenMembers = new Set();
            normalizedSplits = [];

            for (const split of splits) {
                const memberEmail = split?.memberEmail;
                const memberAmount = Number(split?.amount);

                if (!membersSet.has(memberEmail)) {
                    throw createServiceError("Invalid member in split");
                }
                if (seenMembers.has(memberEmail)) {
                    throw createServiceError("Duplicate members in split");
                }
                if (!Number.isFinite(memberAmount) || memberAmount < 0) {
                    throw createServiceError("Split amount must be 0 or greater");
                }

                seenMembers.add(memberEmail);
                normalizedSplits.push({
                    memberEmail,
                    amount: roundToTwo(memberAmount)
                });
            }

            const splitTotal = roundToTwo(
                normalizedSplits.reduce((sum, split) => sum + split.amount, 0)
            );
            if (splitTotal !== roundToTwo(normalizedAmount)) {
                throw createServiceError("Split total must match expense amount");
            }
        } else {
            const requestedMembers = Array.isArray(splitWith) && splitWith.length > 0
                ? normalizeMemberList(splitWith)
                : members;

            if (requestedMembers.some((memberEmail) => !membersSet.has(memberEmail))) {
                throw createServiceError("Invalid member in split");
            }
            if (requestedMembers.length === 0) {
                throw createServiceError("At least one member is required in split");
            }

            normalizedSplits = buildEqualSplits(
                requestedMembers,
                roundToTwo(normalizedAmount)
            );
        }

        const expense = await expenseDao.create({
            groupId,
            title: normalizedTitle,
            amount: roundToTwo(normalizedAmount),
            paidByEmail: userEmail,
            splitType: normalizedSplitType,
            splits: normalizedSplits,
            createdByEmail: userEmail
        });

        const paymentStatus = group.paymentStatus || {};
        if (paymentStatus.isPaid) {
            await groupDao.updatePaymentStatus(groupId, {
                amount: paymentStatus.amount ?? 0,
                currency: paymentStatus.currency ?? "INR",
                date: paymentStatus.date ?? Date.now(),
                isPaid: false
            });
        }

        return expense;
    },

    getTransactions: async (groupId, userEmail) => {
        const group = await groupDao.getGroupForMember(groupId, userEmail);
        if (!group) {
            throw createServiceError("Group not found", 404);
        }

        return await expenseDao.getByGroupId(groupId);
    },

    getSummary: async (groupId, userEmail) => {
        const group = await groupDao.getGroupForMember(groupId, userEmail);
        if (!group) {
            throw createServiceError("Group not found", 404);
        }

        const lastSettled = group.paymentStatus?.date || null;
        const expenses = await expenseDao.getByGroupIdSince(groupId, lastSettled);
        const members = Array.isArray(group.membersEmail) ? group.membersEmail : [];
        const summaryMap = new Map();

        members.forEach((memberEmail) => {
            summaryMap.set(memberEmail, {
                memberEmail,
                owes: 0,
                paid: 0,
                netBalance: 0
            });
        });

        expenses.forEach((expense) => {
            const payerEmail = expense.paidByEmail;
            if (!summaryMap.has(payerEmail)) {
                summaryMap.set(payerEmail, {
                    memberEmail: payerEmail,
                    owes: 0,
                    paid: 0,
                    netBalance: 0
                });
            }
            summaryMap.get(payerEmail).paid += Number(expense.amount) || 0;

            if (Array.isArray(expense.splits)) {
                expense.splits.forEach((split) => {
                    const memberEmail = split.memberEmail;
                    if (!summaryMap.has(memberEmail)) {
                        summaryMap.set(memberEmail, {
                            memberEmail,
                            owes: 0,
                            paid: 0,
                            netBalance: 0
                        });
                    }
                    summaryMap.get(memberEmail).owes += Number(split.amount) || 0;
                });
            }
        });

        const membersSummary = members.map((memberEmail) => summaryMap.get(memberEmail));
        summaryMap.forEach((value, key) => {
            if (!members.includes(key)) {
                membersSummary.push(value);
            }
        });

        membersSummary.forEach((entry) => {
            entry.paid = roundToTwo(entry.paid);
            entry.owes = roundToTwo(entry.owes);
            entry.netBalance = roundToTwo(entry.paid - entry.owes);
        });

        const totalExpenses = roundToTwo(
            expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0)
        );

        return {
            groupId,
            currency: group.paymentStatus?.currency || "INR",
            totalExpenses,
            lastSettled,
            members: membersSummary
        };
    },

    settleGroup: async (groupId, userEmail) => {
        const group = await groupDao.getGroupForMember(groupId, userEmail);
        if (!group) {
            throw createServiceError("Group not found", 404);
        }

        const updatedGroup = await groupDao.updatePaymentStatus(groupId, {
            amount: 0,
            currency: group.paymentStatus?.currency || "INR",
            date: Date.now(),
            isPaid: true
        });

        return {
            groupId: updatedGroup._id,
            paymentStatus: updatedGroup.paymentStatus
        };
    },

    getAudit: async (groupId, userEmail) => {
        const group = await groupDao.getGroupForMember(groupId, userEmail);
        if (!group) {
            throw createServiceError("Group not found", 404);
        }

        const lastSettled = await groupDao.getAuditLog(groupId);
        return { lastSettled };
    }
};

module.exports = expenseService;
