import { ADMIN_ROLE, MANAGER_ROLE, VIEWER_ROLE } from "./userRoles";

const permissions = {
    [ADMIN_ROLE]: [
        "user:create",
        "user:update",
        "user:delete",
        "user:view",
        "group:create",
        "group:update",
        "group:delete",
        "group:view",
    ],
    [VIEWER_ROLE]: [
        "user:view",
        "group:view",
    ],
    [MANAGER_ROLE]: [
        "user:view",
        "group:create",
        "group:update",
        "group:view",
    ],
};

module.exports = permissions;
