// export interface NavItemConfig {
//   key: string;
//   title?: string;
//   disabled?: boolean;
//   external?: boolean;
//   label?: string;
//   icon?: string;
//   href?: string;
//   items?: NavItemConfig[];
//   matcher?: { type: 'startsWith' | 'equals'; href: string };
// }
export type NavItemConfig = {
  key: string;
  title: string;
  href?: string;
  icon?: string;
  matcher?: { type: 'startsWith' | 'equals'; href: string };
  permission?: string;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  items?: NavItemConfig[];
};
