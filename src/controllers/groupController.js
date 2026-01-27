const groupDao = require("../dao/groupDao");

const groupController = {
    
    create: async (request, response) => {
        try {
            const user = request.user;
            const { 
                name, description, membersEmail, thumbnail,
            } = request.body;

            let allMembers = [user.email];
            if (membersEmail && Array.isArray(membersEmail)) {
                allMembers = [...new Set([...allMembers, ...membersEmail])];
            }

            const newGroup = await groupDao.createGroup({
                name, description, adminEmail: user.email, 
                allMembers, thumbnail,
                paymentStatus: {
                    amount: 0,
                    currency: 'INR',
                    date: Date.now(),
                    isPaid: false
                }
            });

            response.status(200).json({
                message: 'Group created',
                groupId: newGroup._id
            });
        } catch (error) {
            console.log(error);
            response.status(500).json({
                message: "Internal server error"
            });
        }
    },
};

module.exports = groupController;