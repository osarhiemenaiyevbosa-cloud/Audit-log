export const ROLE_PERMISSIONS = {
  SYSTEM_ADMIN: [
    'VIEW_DASHBOARD',
    'VIEW_AUDIT',
    'SEARCH_AUDIT',
    'IMPORT_AUDIT',
    'EXPORT_AUDIT',
    'MANAGE_COMPANIES',
    'MANAGE_USERS',
    'MANAGE_ROLES',
    'PUBLISH_NOTICE',
    'VIEW_WHISTLEBLOWER'
  ],

  COMPANY_ADMIN: [
    'VIEW_DASHBOARD',
    'VIEW_AUDIT',
    'SEARCH_AUDIT',
    'IMPORT_AUDIT',
    'EXPORT_AUDIT',
    'MANAGE_USERS',
    'PUBLISH_NOTICE'
  ],

  AUDITOR: [
    'VIEW_DASHBOARD',
    'VIEW_AUDIT',
    'SEARCH_AUDIT',
    'EXPORT_AUDIT'
  ],

  USER: [
    'VIEW_DASHBOARD',
    'VIEW_AUDIT'
  ],

  VIEWER: [
    'VIEW_DASHBOARD',
    'VIEW_AUDIT'
  ]
};

export function hasPermission(user, permission) {
  return !!user && ROLE_PERMISSIONS[user.role]?.includes(permission);
}