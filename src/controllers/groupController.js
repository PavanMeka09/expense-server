const groupDao = require("../dao/groupDao");
const expenseDao = require("../dao/expenseDao");

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

const groupController = {

    create: async (request, response) => {
        try {
            const user = request.user;
            const { name, description, membersEmail, thumbnail } = request.body;

            let allMembers = [user.email];
            if (membersEmail && Array.isArray(membersEmail)) {
                allMembers = [...new Set([...allMembers, ...membersEmail])];
            }

            const newGroup = await groupDao.createGroup({
                name,
                description,
                adminEmail: user.email,
                membersEmail: allMembers,
                thumbnail,
                paymentStatus: {
                    amount: 0,
                    currency: 'INR',
                    date: Date.now(),
                    isPaid: false
                }
            });

            response.status(201).json({
                message: 'Group created successfully',
                groupId: newGroup._id
            });
        } catch (error) {
            console.error(error);
            response.status(500).json({ message: "Internal server error" });
        }
    },

    update: async (request, response) => {
        try {
            const updatedGroup = await groupDao.updateGroup(request.body);
            if (!updatedGroup) {
                return response.status(404).json({ message: "Group not found" });
            }
            response.status(200).json(updatedGroup);
        } catch (error) {
            response.status(500).json({ message: "Error updating group" });
        }
    },

    addMembers: async (request, response) => {
        try {
            const { groupId, emails } = request.body;
            const updatedGroup = await groupDao.addMembers(groupId, ...emails);
            response.status(200).json(updatedGroup);
        } catch (error) {
            response.status(500).json({ message: "Error adding members" });
        }
    },

    removeMembers: async (request, response) => {
        try {
            const { groupId, emails } = request.body;
            const updatedGroup = await groupDao.removeMembers(groupId, ...emails);
            response.status(200).json(updatedGroup);
        } catch (error) {
            response.status(500).json({ message: "Error removing members" });
        }
    },

    getGroupsByUser: async (request, response) => {
        try {
            const email = request.user.email;
            const groups = await groupDao.getGroupByEmail(email);
            response.status(200).json(groups);
        } catch (error) {
            response.status(500).json({ message: "Error fetching groups" });
        }
    },

    getGroupsByPaymentStatus: async (request, response) => {
        try {
            const { isPaid } = request.query;
            const status = isPaid === 'true';
            const groups = await groupDao.getGroupByStatus(status);
            response.status(200).json(groups);
        } catch (error) {
            response.status(500).json({ message: "Error filtering groups" });
        }
    },

    getGroupDetails: async (request, response) => {
        try {
            const { groupId } = request.params;
            const email = request.user.email;

            const group = await groupDao.getGroupForMember(groupId, email);
            if (!group) {
                return response.status(404).json({ message: "Group not found" });
            }

            response.status(200).json({
                _id: group._id,
                name: group.name,
                membersEmail: group.membersEmail
            });
        } catch (error) {
            response.status(500).json({ message: "Error fetching group details" });
        }
    },

    getGroupTransactions: async (request, response) => {
        try {
            const { groupId } = request.params;
            const email = request.user.email;

            const group = await groupDao.getGroupForMember(groupId, email);
            if (!group) {
                return response.status(404).json({ message: "Group not found" });
            }

            const transactions = await expenseDao.getByGroupId(groupId);
            response.status(200).json(transactions);
        } catch (error) {
            response.status(500).json({ message: "Error fetching transactions" });
        }
    },

    createExpense: async (request, response) => {
        try {
            const { groupId } = request.params;
            const email = request.user.email;
            const { title, amount, splitType, splitWith, splits } = request.body;

            const group = await groupDao.getGroupForMember(groupId, email);
            if (!group) {
                return response.status(404).json({ message: "Group not found" });
            }

            const normalizedTitle = typeof title === "string" ? title.trim() : "";
            const normalizedAmount = Number(amount);
            if (!normalizedTitle) {
                return response.status(400).json({ message: "Title is required" });
            }
            if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
                return response.status(400).json({ message: "Amount must be greater than 0" });
            }

            const membersSet = new Set(group.membersEmail);
            let normalizedSplits = [];
            let normalizedSplitType = splitType === "custom" ? "custom" : "equal";

            if (normalizedSplitType === "custom") {
                if (!Array.isArray(splits) || splits.length === 0) {
                    return response.status(400).json({ message: "Custom split values are required" });
                }

                const seenMembers = new Set();
                normalizedSplits = [];

                for (const split of splits) {
                    const memberEmail = split?.memberEmail;
                    const memberAmount = Number(split?.amount);

                    if (!membersSet.has(memberEmail)) {
                        return response.status(400).json({ message: "Invalid member in split" });
                    }
                    if (seenMembers.has(memberEmail)) {
                        return response.status(400).json({ message: "Duplicate members in split" });
                    }
                    if (!Number.isFinite(memberAmount) || memberAmount < 0) {
                        return response.status(400).json({ message: "Split amount must be 0 or greater" });
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
                    return response.status(400).json({ message: "Split total must match expense amount" });
                }
            } else {
                const requestedMembers = Array.isArray(splitWith) && splitWith.length > 0
                    ? [...new Set(splitWith)]
                    : group.membersEmail;

                if (requestedMembers.some((memberEmail) => !membersSet.has(memberEmail))) {
                    return response.status(400).json({ message: "Invalid member in split" });
                }
                if (requestedMembers.length === 0) {
                    return response.status(400).json({ message: "At least one member is required in split" });
                }

                normalizedSplits = buildEqualSplits(requestedMembers, roundToTwo(normalizedAmount));
            }

            const expense = await expenseDao.create({
                groupId,
                title: normalizedTitle,
                amount: roundToTwo(normalizedAmount),
                paidByEmail: email,
                splitType: normalizedSplitType,
                splits: normalizedSplits,
                createdByEmail: email
            });

            response.status(201).json(expense);
        } catch (error) {
            response.status(500).json({ message: "Error creating expense" });
        }
    },

    getAudit: async (request, response) => {
        try {
            const { groupId } = request.params;
            const lastSettled = await groupDao.getAuditLog(groupId);
            response.status(200).json({ lastSettled });
        } catch (error) {
            response.status(500).json({ message: "Error fetching audit log" });
        }
    }
};

module.exports = groupController;
