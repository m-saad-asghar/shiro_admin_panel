import * as React from 'react';
import RouterLink from 'next/link';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import { GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';
import { SignOutIcon } from '@phosphor-icons/react/dist/ssr/SignOut';
import { UserIcon } from '@phosphor-icons/react/dist/ssr/User';

import { paths } from '@/paths';
import { useUser } from '@/hooks/use-user';

export interface UserPopoverProps {
  anchorEl: Element | null;
  onClose: () => void;
  open: boolean;
}

// IMPORTANT:
// The user API you showed doesn't include image.
// Use a real direct image URL as fallback (NOT a webpage URL).
const DEFAULT_AVATAR_URL = 'default_user.avif';

export function UserPopover({ anchorEl, onClose, open }: UserPopoverProps): React.JSX.Element {
  const router = useRouter();
  const { user, signOut } = useUser();

  const fullName = user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : 'Guest';
  const email = user?.email ?? '';
  const profile_image = user?.profile_image ?? '';

  // If later your API returns image, replace this logic to:
  // const avatarUrl = user?.image || DEFAULT_AVATAR_URL;
  const avatarUrl = profile_image;

  const handleSignOut = React.useCallback((): void => {
    // Clear context + localStorage
    signOut();

    // Close popover to avoid UI glitch
    onClose();

    // Redirect to login (adjust path if your sign-in route differs)
    router.push(paths.auth.signIn);
    router.refresh();
  }, [signOut, router, onClose]);

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      onClose={onClose}
      open={open}
      slotProps={{ paper: { sx: { width: '260px' } } }}
    >
      <Box sx={{ p: '16px 20px', display: 'flex', gap: 2, alignItems: 'center' }}>
        {/* <Avatar
          src={avatarUrl}
          alt={fullName}
          sx={{ width: 44, height: 44 }}
          imgProps={{
            referrerPolicy: 'no-referrer',
            onError: (e) => {
              // fallback if image fails
              (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR_URL;
            },
          }}
        /> */}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap>
            {fullName || 'User'}
          </Typography>
          <Typography color="text.secondary" variant="body2" noWrap>
            {email}
          </Typography>
        </Box>
      </Box>

      <Divider />

      <MenuList disablePadding sx={{ p: '8px', '& .MuiMenuItem-root': { borderRadius: 1 } }}>
        {/* <MenuItem component={RouterLink} href={paths.dashboard.settings} onClick={onClose}>
          <ListItemIcon>
            <GearSixIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          Settings
        </MenuItem>

        <MenuItem component={RouterLink} href={paths.dashboard.account} onClick={onClose}>
          <ListItemIcon>
            <UserIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          Profile
        </MenuItem> */}

        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <SignOutIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </MenuList>
    </Popover>
  );
}