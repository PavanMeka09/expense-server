const rbacDao = require("../dao/rbacDao");

const rbacController = {
  create: async (request, response) => {
    try {
      const adminUser = request.user;
      const { name, email, role } = request.body;

      const user = await rbacDao.create(email, name, role, adminUser._id);

      return response.status(200).json({
        message: 'User created!',
        user: user
      });
    } catch (error) {
      console.log(error);
      response.status(500).json({ message: 'Internal server error' });
    }
  },

  update: async (request, response) => {
    try {
      const userId = request.user._id;
      const { name, role } = request.body;
      const user = await rbacDao.update(userId, name, role);
      return response.status(200).json({
        message: 'User updated!',
        user: user
      });
    } catch (error) {
      controllers / rbacController.js + 63
      console.log(error);
      response.status(500).json({ message: 'Internal server error' });
    }
  },

  delete: async (request, response) => {
    try {
      const userId = request.user._id;
      await rbacDao.delete(userId);
      return response.status(200).json({
        message: 'User deleted!'
      });
    } catch (error) {
      console.log(error);
      response.status(500).json({ message: 'Internal server error' });
    }
  },

  getAllUsers: async (request, response) => {
    try {
      const adminId = request.user.adminId;
      const users = await rbacDao.getUsersByAdminId(adminId);
      return response.status(200).json({
        users: users
      });
    } catch (error) {
      console.log(error);
      response.status(500).json({ message: 'Internal server error' });
    }
  }
};

module.exports = rbacController;