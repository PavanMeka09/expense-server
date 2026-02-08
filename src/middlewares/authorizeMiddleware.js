const permission = require('../utility/permissions');

const authorize = (requiredPermission) => {

  return (request, response, next) => {
    // AuthMiddleware must run before this middleware so that
    // we can have access to user object.
    const user = request.user;

    if (!user) {
      return response.status(401).json({ message: 'Unauthorized access ' });
    }

    const userPermissions = permission[user.role] || [];
    if (!userPermissions.includes(requiredPermission)) {
      return response.status(403).json({
        message: 'Forbidden: Insufficient Permissions'
      });
    }

    next();
  }
};

module.exports = authorize;
