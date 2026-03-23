import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  // { key: 'overview', title: 'Overview', href: paths.dashboard.overview, icon: 'chart-pie' },

  { key: 'developers', title: 'Developers', href: paths.dashboard.developers, icon: 'developers', permission: 'developers_read' },
  { key: 'projects', title: 'Projects', href: paths.dashboard.projects, icon: 'projects', permission: 'projects_read' },
  { key: 'listings', title: 'Listings', href: paths.dashboard.listings, icon: 'listings', permission: 'listings_read' },
  { key: 'communities', title: 'Communities', href: paths.dashboard.communities, icon: 'communities', permission: 'communities_read' },
  { key: 'amenities', title: 'Amenities', href: paths.dashboard.amenities, icon: 'amenities', permission: 'amenities_read' },
  { key: 'employees', title: 'Employees', href: paths.dashboard.employees, icon: 'employees', permission: 'employees_read' },
  { key: 'departments', title: 'Departments', href: paths.dashboard.departments, icon: 'departments', permission: 'departments_read' },
  { key: 'positions', title: 'Positions', href: paths.dashboard.positions, icon: 'positions', permission: 'positions_read' },
  { key: 'users', title: 'Users', href: paths.dashboard.users, icon: 'users', permission: 'users_read' },
  { key: 'roles', title: 'Roles', href: paths.dashboard.roles, icon: 'roles', permission: 'roles_read' },
  { key: 'permissions', title: 'Permissions', href: paths.dashboard.permissions, icon: 'permissions', permission: 'permissions_read' },
] satisfies NavItemConfig[];