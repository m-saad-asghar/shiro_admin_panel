import * as React from 'react';
import Card from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';

interface CommunitiesFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function CommunitiesFilters({
  search,
  onSearchChange,
}: CommunitiesFiltersProps): React.JSX.Element {

  const [localSearch, setLocalSearch] = React.useState(search);

  // debounce search to avoid API spam
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = localSearch.trim();

      if (trimmed !== search) {
        onSearchChange(trimmed);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  React.useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  return (
    <Card sx={{ p: 2 }}>
      <OutlinedInput
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        fullWidth
        placeholder="Search communities..."
        startAdornment={
          <InputAdornment position="start">
            <MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
          </InputAdornment>
        }
        sx={{ maxWidth: 500 }}
        inputProps={{
          'aria-label': 'Search communities',
        }}
      />
    </Card>
  );
}