import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'overview', title: 'Overview', href: paths.dashboard.overview, icon: 'chart-pie' },
  // { key: 'customers', title: 'Customers', href: paths.dashboard.customers, icon: 'users' },
  { key: 'developers', title: 'Developers', href: paths.dashboard.developers, icon: 'developers' },
  { key: 'projects', title: 'Projects', href: paths.dashboard.projects, icon: 'projects' },
  { key: 'listings', title: 'Listings', href: paths.dashboard.listings, icon: 'listings' },
  { key: 'communities', title: 'Communities', href: paths.dashboard.communities, icon: 'communities' },
  { key: 'amenities', title: 'Amenities', href: paths.dashboard.amenities, icon: 'amenities' },
  { key: 'employees', title: 'Employees', href: paths.dashboard.employees, icon: 'employees' },
  { key: 'departments', title: 'Departments', href: paths.dashboard.departments, icon: 'departments' },
  { key: 'positions', title: 'Positions', href: paths.dashboard.positions, icon: 'positions' },
  { key: 'users', title: 'Users', href: paths.dashboard.users, icon: 'users' },
  { key: 'roles', title: 'Roles', href: paths.dashboard.roles, icon: 'roles' },
  { key: 'permissions', title: 'Permissions', href: paths.dashboard.permissions, icon: 'permissions' },
  // { key: 'integrations', title: 'Integrations', href: paths.dashboard.integrations, icon: 'plugs-connected' },
  // { key: 'settings', title: 'Settings', href: paths.dashboard.settings, icon: 'gear-six' },
  // { key: 'account', title: 'Account', href: paths.dashboard.account, icon: 'user' },
  // { key: 'error', title: 'Error', href: paths.errors.notFound, icon: 'x-square' },
] satisfies NavItemConfig[];
