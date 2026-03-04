// components/dashboard/user/users-filters.tsx
'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';

interface UsersFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
}

/**
 * This just updates the search string.
 * Backend fetch happens in Page.tsx (server-side search).
 */
export function UsersFilters({ search, onSearchChange }: UsersFiltersProps): React.JSX.Element {
  return (
    <Card sx={{ p: 2 }}>
      <OutlinedInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        fullWidth
        placeholder="Search by First Name or Last Name"
        startAdornment={
          <InputAdornment position="start">
            <MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
          </InputAdornment>
        }
        sx={{ maxWidth: '500px' }}
      />
    </Card>
  );
}
