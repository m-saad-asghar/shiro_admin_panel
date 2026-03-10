import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { ChartPieIcon } from '@phosphor-icons/react/dist/ssr/ChartPie';
import { GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';
import { PlugsConnectedIcon } from '@phosphor-icons/react/dist/ssr/PlugsConnected';
import { UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';
import { XSquare } from '@phosphor-icons/react/dist/ssr/XSquare';
import { ShieldCheckIcon } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { LockKeyIcon } from '@phosphor-icons/react/dist/ssr/LockKey';
import { BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings';
import { BuildingOffice } from '@phosphor-icons/react/dist/ssr/BuildingOffice';
import { House } from '@phosphor-icons/react/dist/ssr/House';
import { SparkleIcon } from '@phosphor-icons/react/dist/ssr/Sparkle';
import { MapPinAreaIcon } from '@phosphor-icons/react/dist/ssr/MapPinArea';
import { IdentificationCardIcon } from '@phosphor-icons/react/dist/ssr/IdentificationCard';



export const navIcons = {
  'chart-pie': ChartPieIcon,
  'gear-six': GearSixIcon,
  'plugs-connected': PlugsConnectedIcon,
  'x-square': XSquare,
  user: UserIcon,
  users: UsersIcon,
  roles: ShieldCheckIcon,
  permissions: LockKeyIcon,
  listings: BuildingsIcon,
  developers: BuildingOffice,
  projects: House,
  amenities: SparkleIcon,
  communities: MapPinAreaIcon,
  employees: IdentificationCardIcon
} as Record<string, Icon>;
