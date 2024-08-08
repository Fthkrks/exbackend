module.exports = {
  privGroups: [
    {
      id: "USERS",
      name: "User Permissions",
    },
    {
      id: "ROLES",
      name: "Role Permissions",
    },
    {
      id: "CATEGORIES",
      name: "Category Permissions",
    },
    {
      id: "AUDITLOGS",
      name: "AuditLogs Permissions",
    },
  ],

  privileges: [
    {
      key: "user_view",
      name: "User View",
      group: "USERS",
      description: "User view",
    },
    {
      key: "user_add",
      name: "User Add",
      group: "USERS",
      description: "User add",
    },
    {
      key: "user_update",
      name: "User Update",
      group: "USERS",
      description: "User update",
    },
    {
      key: "user_delete",
      name: "User Delete",
      group: "USERS",
      description: "User delete",
    },
    {
      key: "roles_view",
      name: "roles View",
      group: "ROLES",
      description: "Roles view",
    },
    {
      key: "roles_add",
      name: "roles Add",
      group: "ROLES",
      description: "Roles add",
    },
    {
      key: "roles_update",
      name: "Roles Update",
      group: "ROLES",
      description: "Roles update",
    },
    {
      key: "roles_delete",
      name: "Roles Delete",
      group: "ROLES",
      description: "Roles delete",
    },
    {
      key: "category_view",
      name: "Category View",
      group: "CATEGORIES",
      description: "Auditlogs view",
    },
    {
      key: "category_add",
      name: "Category Add",
      group: "CATEGORIES",
      description: "Category add",
    },
    {
      key: "category_update",
      name: "Category Update",
      group: "CATEGORIES",
      description: "Category update",
    },
    {
      key: "category_delete",
      name: "Category Delete",
      group: "CATEGORIES",
      description: "Category delete",
    },
    {
      key: "auditlogs_view",
      name: "Auditlogs View",
      group: "AUDITLOGS",
      description: "Auditlogs view",
    },

  ],
};
