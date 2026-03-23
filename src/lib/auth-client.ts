export type AdminUser = {
  id: string | number;
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_image?: string;
  roles?: string[];
  permissions?: string[];
};

export function getAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem('admin_user');
    if (!raw) return null;
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function getAdminPermissions(): string[] {
  const user = getAdminUser();
  if (!user || !Array.isArray(user.permissions)) return [];
  return user.permissions;
}

export function hasPermission(permission: string): boolean {
  const permissions = getAdminPermissions();
  return permissions.includes(permission);
}

export function hasAnyPermission(permissionList: string[]): boolean {
  const permissions = getAdminPermissions();
  return permissionList.some((p) => permissions.includes(p));
}

export function hasAllPermissions(permissionList: string[]): boolean {
  const permissions = getAdminPermissions();
  return permissionList.every((p) => permissions.includes(p));
}