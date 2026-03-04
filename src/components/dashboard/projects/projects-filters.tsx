// components/dashboard/user/users-filters.tsx
'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';

interface ProjectsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
}

/**
 * Updates search string only.
 * Backend filtering handled in Page.tsx.
 */
export function ProjectsFilters({
  search,
  onSearchChange,
}: ProjectsFiltersProps): React.JSX.Element {
  return (
    <Card sx={{ p: 2 }}>
      <OutlinedInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        fullWidth
        placeholder="Search by Project Name"
        startAdornment={
          <InputAdornment position="start">
            <MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
          </InputAdornment>
        }
        sx={{ maxWidth: 500 }}
      />
    </Card>
  );
}
