// app/dashboard/listings/page.tsx
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
  price: number | string | null; // ✅ backend may return string
  community: string | null;
  sub_community: string | null;
  property: string | null;
  property_type: string | null;
  property_category: string | null;
  title: string | null;
  active: number; // 0/1
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

export type ListingRow = {
  id: string;
  reference: string;
  first_image: string; // ✅ always a string in UI
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

export default function Page(): React.JSX.Element {
  // NOTE: MUI TablePagination uses 0-based page; backend uses 1-based page.
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [search, setSearch] = React.useState('');

  const [rows, setRows] = React.useState<ListingRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // Toast
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('');
  const [toastSeverity, setToastSeverity] = React.useState<'success' | 'error' | 'info' | 'warning'>('success');

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const showToast = (message: string, severity: typeof toastSeverity = 'success') => {
    setToastMsg(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const getAccessToken = (): string => {
    const payloadStr = localStorage.getItem('admin_login_payload');
    if (!payloadStr) throw new Error('admin_login_payload not found in localStorage');

    let accessToken: string | null = null;

    try {
      const payload = JSON.parse(payloadStr);
      accessToken = payload?.access_token ? String(payload.access_token) : null;
    } catch {
      throw new Error('admin_login_payload is not valid JSON');
    }

    if (!accessToken) throw new Error('access_token missing inside admin_login_payload');
    return accessToken;
  };

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
    void fetchListings();
  }, [fetchListings]);

  // When search changes, reset to first page
  React.useEffect(() => {
    setPage(0);
  }, [search]);

  // ✅ Toggle active (REAL backend call now)
const handleToggle = async (listing: ListingRow) => {
  const previous = listing.active;
  const newStatus = listing.active === 1 ? 0 : 1;

  // Optimistic UI update
  setRows((prev) =>
    prev.map((r) =>
      r.id === listing.id ? { ...r, active: newStatus } : r
    )
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

    if (!res.ok) {
      throw new Error(`Status update failed. HTTP ${res.status}`);
    }

    const json = await res.json();

    if (!json.success) {
      throw new Error(json.message || 'Status update failed');
    }

    showToast(
      `Listing ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`,
      'success'
    );
  } catch (err) {
    console.error(err);

    // rollback UI
    setRows((prev) =>
      prev.map((r) =>
        r.id === listing.id ? { ...r, active: previous } : r
      )
    );

    showToast(
      err instanceof Error ? err.message : 'Status update failed',
      'error'
    );
  }
};


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
          onToggle={handleToggle}
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
