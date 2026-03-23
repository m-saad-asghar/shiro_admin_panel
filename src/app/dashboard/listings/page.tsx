'use client';

import * as React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import { ListingsFilters } from '@/components/dashboard/listing/listings-filters';
import { ListingsTable } from '@/components/dashboard/listing/listings-table';

type ApiListing = {
  id: number;
  reference: string;
  first_image?: string | null;
  property_t: string | null;
  price: number | string | null;
  community: string | null;
  sub_community: string | null;
  property: string | null;
  property_type: string | null;
  property_category: string | null;
  title: string | null;
  active: number;
  furnishing: string | null;
  created_at: string | null;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data: ApiListing[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

type AdminPayload = {
  access_token?: string;
  permissions?: Array<string | { name?: string; title?: string }>;
  user?: {
    permissions?: Array<string | { name?: string; title?: string }>;
    role?: {
      permissions?: Array<string | { name?: string; title?: string }>;
    };
    roles?: Array<{
      permissions?: Array<string | { name?: string; title?: string }>;
    }>;
  };
};

export type ListingRow = {
  id: string;
  reference: string;
  first_image: string;
  property_t: string | null;
  price: number | null;
  community: string | null;
  sub_community: string | null;
  property: string | null;
  property_type: string | null;
  property_category: string | null;
  title: string | null;
  active: number;
  furnishing: string | null;
  created_at: string | null;
};

type ApiBasicResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
  errors?: Record<string, string[]>;
};

export default function Page(): React.JSX.Element {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [search, setSearch] = React.useState('');

  const [rows, setRows] = React.useState<ListingRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const [permissionsLoaded, setPermissionsLoaded] = React.useState(false);
  const [userPermissions, setUserPermissions] = React.useState<string[]>([]);

  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('');
  const [toastSeverity, setToastSeverity] = React.useState<'success' | 'error' | 'info' | 'warning'>('success');

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const showToast = (message: string, severity: typeof toastSeverity = 'success') => {
    setToastMsg(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const getAdminPayload = (): AdminPayload => {
    const payloadStr = localStorage.getItem('admin_login_payload');
    if (!payloadStr) throw new Error('admin_login_payload not found in localStorage');

    try {
      return JSON.parse(payloadStr) as AdminPayload;
    } catch {
      throw new Error('admin_login_payload is not valid JSON');
    }
  };

  const getAccessToken = (): string => {
    const payload = getAdminPayload();
    const accessToken = payload?.access_token ? String(payload.access_token) : null;

    if (!accessToken) throw new Error('access_token missing inside admin_login_payload');
    return accessToken;
  };

  const extractPermissionNames = React.useCallback((payload: AdminPayload): string[] => {
    const result = new Set<string>();

    const pushPermissions = (items?: Array<string | { name?: string; title?: string }>) => {
      if (!Array.isArray(items)) return;

      items.forEach((item) => {
        if (typeof item === 'string') {
          if (item.trim()) result.add(item.trim());
          return;
        }

        if (item?.name && String(item.name).trim()) {
          result.add(String(item.name).trim());
          return;
        }

        if (item?.title && String(item.title).trim()) {
          result.add(String(item.title).trim());
        }
      });
    };

    pushPermissions(payload.permissions);
    pushPermissions(payload.user?.permissions);
    pushPermissions(payload.user?.role?.permissions);

    if (Array.isArray(payload.user?.roles)) {
      payload.user.roles.forEach((role) => pushPermissions(role.permissions));
    }

    return Array.from(result);
  }, []);

  React.useEffect(() => {
    try {
      const payload = getAdminPayload();
      const permissions = extractPermissionNames(payload);
      setUserPermissions(permissions);
    } catch (err) {
      console.error(err);
      setUserPermissions([]);
    } finally {
      setPermissionsLoaded(true);
    }
  }, [extractPermissionNames]);

  const hasPermission = React.useCallback(
    (permission: string) => userPermissions.includes(permission),
    [userPermissions]
  );

  const canRead = hasPermission('listings_read');
  const canUpdate = hasPermission('listings_update');

  const fetchListings = React.useCallback(async () => {
    try {
      setLoading(true);

      if (!apiBase) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');
      const accessToken = getAccessToken();

      const url =
        `${apiBase}/admin/fetch_all_listings` +
        `?page=${page + 1}` +
        `&per_page=${rowsPerPage}` +
        (search.trim() ? `&search=${encodeURIComponent(search)}` : '');

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) throw new Error(`Fetch listings failed. HTTP ${res.status}`);

      const json = (await res.json()) as ApiResponse;

      const mapped: ListingRow[] = (json.data ?? []).map((r) => ({
        id: String(r.id),
        reference: r.reference ?? '',
        first_image: r.first_image ? String(r.first_image) : '',
        property_t: r.property_t ?? null,
        price: typeof r.price === 'number' ? r.price : r.price ? Number(r.price) : null,
        community: r.community ?? null,
        sub_community: r.sub_community ?? null,
        property: r.property ?? null,
        property_type: r.property_type ?? null,
        property_category: r.property_category ?? null,
        title: r.title ?? null,
        active: r.active ?? 0,
        furnishing: r.furnishing ?? null,
        created_at: r.created_at ?? null,
      }));

      setRows(mapped);
      setTotalCount(json.pagination?.total ?? mapped.length);
    } catch (err) {
      console.error(err);
      setRows([]);
      setTotalCount(0);
      showToast(err instanceof Error ? err.message : 'Failed to load listings', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiBase, page, rowsPerPage, search]);

  React.useEffect(() => {
    if (!permissionsLoaded) return;

    if (!canRead) {
      setLoading(false);
      setRows([]);
      setTotalCount(0);
      return;
    }

    void fetchListings();
  }, [fetchListings, permissionsLoaded, canRead]);

  React.useEffect(() => {
    setPage(0);
  }, [search]);

  const handleToggle = async (listing: ListingRow) => {
    if (!canUpdate) {
      showToast('You do not have permission to update listings.', 'error');
      return;
    }

    const previous = listing.active;
    const newStatus = listing.active === 1 ? 0 : 1;

    setRows((prev) =>
      prev.map((r) => (r.id === listing.id ? { ...r, active: newStatus } : r))
    );

    try {
      if (!apiBase) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');
      const accessToken = getAccessToken();

      const res = await fetch(`${apiBase}/admin/change_status_listing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          reference: listing.reference,
          active: newStatus,
        }),
      });

      let json: ApiBasicResponse | null = null;
      try {
        json = (await res.json()) as ApiBasicResponse;
      } catch {
        json = null;
      }

      if (!res.ok) {
        throw new Error(json?.message || `Status update failed. HTTP ${res.status}`);
      }

      if (json && json.success === false) {
        throw new Error(json.message || 'Status update failed');
      }

      showToast(
        `Listing ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`,
        'success'
      );
    } catch (err) {
      console.error(err);

      setRows((prev) =>
        prev.map((r) => (r.id === listing.id ? { ...r, active: previous } : r))
      );

      showToast(
        err instanceof Error ? err.message : 'Status update failed',
        'error'
      );
    }
  };

  if (!permissionsLoaded) {
    return (
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 2 }}>
          <CircularProgress size={22} />
          <Typography variant="body2">Checking permissions...</Typography>
        </Stack>
      </Stack>
    );
  }

  if (!canRead) {
    return (
      <Stack spacing={3}>
        <Typography variant="h4">Listings</Typography>
        <Alert severity="error" variant="filled">
          You do not have permission to view listings.
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Listings</Typography>
        </Stack>
      </Stack>

      <ListingsFilters search={search} onSearchChange={setSearch} />

      {loading ? (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 2 }}>
          <CircularProgress size={22} />
          <Typography variant="body2">Loading Listings...</Typography>
        </Stack>
      ) : (
        <ListingsTable
          count={totalCount}
          page={page}
          rows={rows}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          onToggle={canUpdate ? handleToggle : undefined}
        />
      )}

      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ mb: 2, mr: 2 }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity={toastSeverity}
          variant="filled"
          sx={{
            width: '100%',
            color: '#fff',
            backgroundColor: toastSeverity === 'success' ? '#094834' : '#d32f2f',
            '& .MuiAlert-icon': { color: '#fff' },
          }}
        >
          {toastMsg}
        </Alert>
      </Snackbar>
    </Stack>
  );
}