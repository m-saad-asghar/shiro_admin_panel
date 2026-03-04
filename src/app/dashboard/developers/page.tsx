'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';

import { DevelopersFilters } from '@/components/dashboard/developers/developers-filters';
import { DevelopersTable } from '@/components/dashboard/developers/developers-table';

type ApiDeveloper = {
  id: number;
  name: string;
  email: string;
  logo: string | null;      // filename only
  thumbnail: string | null; // filename only
  active: number;
  created_at: string | null;
  updated_at: string | null;
};

type ApiResponse = {
  success: boolean;
  data: ApiDeveloper[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type DeveloperRow = {
  id: string;
  name: string;
  email: string;
  logo: string | null;
  thumbnail: string | null;
  active: number;
  created_at: string | null;
  updated_at: string | null;
};

type ApiBasicResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

export default function Page(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [search, setSearch] = React.useState('');
  const [rows, setRows] = React.useState<DeveloperRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('');
  const [toastSeverity, setToastSeverity] = React.useState<'success' | 'error'>('success');

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const showToast = React.useCallback((message: string, severity: 'success' | 'error') => {
    setToastMsg(message);
    setToastSeverity(severity);
    setToastOpen(true);
  }, []);

  const getAccessToken = (): string => {
    const payloadStr = localStorage.getItem('admin_login_payload');
    if (!payloadStr) throw new Error('admin_login_payload not found');
    const payload = JSON.parse(payloadStr);
    if (!payload?.access_token) throw new Error('access_token missing');
    return payload.access_token;
  };

  // ✅ toast from URL (?toast=success|error&msg=...)
  React.useEffect(() => {
    const toast = searchParams.get('toast');
    const msg = searchParams.get('msg');

    if (toast && msg) {
      showToast(decodeURIComponent(msg), toast === 'success' ? 'success' : 'error');
      router.replace('/dashboard/developers');
    }
  }, [router, searchParams, showToast]);

  // Fetch Developers
  const fetchDevelopers = React.useCallback(async () => {
    try {
      setLoading(true);
      if (!apiBase) throw new Error('API base missing');

      const accessToken = getAccessToken();

      const url =
        `${apiBase}/admin/fetch_developers` +
        `?page=${page + 1}` +
        `&per_page=${rowsPerPage}` +
        `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);

      const json = (await res.json()) as ApiResponse;

      const mapped: DeveloperRow[] = (json.data ?? []).map((r) => ({
        id: String(r.id),
        name: r.name,
        email: r.email,
        logo: r.logo ?? null,
        thumbnail: r.thumbnail ?? null,
        active: Number(r.active ?? 0),
        created_at: r.created_at ?? null,
        updated_at: r.updated_at ?? null,
      }));

      setRows(mapped);
      setTotalCount(json.pagination?.total ?? mapped.length);
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Fetch failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiBase, page, rowsPerPage, search, showToast]);

  React.useEffect(() => {
    void fetchDevelopers();
  }, [fetchDevelopers]);

  React.useEffect(() => {
    setPage(0);
  }, [search]);

  // ✅ Edit navigation (THIS is what you were missing)
  const handleEditDeveloper = (developer: DeveloperRow) => {
    router.push(`/dashboard/developers/${developer.id}/edit`);
  };

  // Toggle status
  const handleToggleDeveloper = async (developer: DeveloperRow, active: 0 | 1) => {
    const previous = developer.active;

    try {
      if (!apiBase) throw new Error('API base missing');
      const accessToken = getAccessToken();

      setRows((prev) => prev.map((d) => (d.id === developer.id ? { ...d, active } : d)));

      const endpoint = `${apiBase}/admin/change_status_developer`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          developer_id: Number(developer.id),
          active,
        }),
      });

      let payload: ApiBasicResponse | null = null;
      try {
        payload = (await res.json()) as ApiBasicResponse;
      } catch {
        payload = null;
      }

      if (!res.ok) throw new Error(payload?.message || `Status update failed (${res.status})`);

      showToast(payload?.message || 'Developer status updated successfully', 'success');
    } catch (err) {
      console.error(err);
      setRows((prev) => prev.map((d) => (d.id === developer.id ? { ...d, active: previous } : d)));
      showToast(err instanceof Error ? err.message : 'Status update failed', 'error');
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Developers</Typography>

        <Button startIcon={<PlusIcon />} variant="contained" onClick={() => router.push('/dashboard/developers/new')}>
          Add Developer
        </Button>
      </Stack>

      <DevelopersFilters search={search} onSearchChange={setSearch} />

      {loading ? (
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={20} />
          <Typography>Loading Developers...</Typography>
        </Stack>
      ) : (
        <DevelopersTable
          count={totalCount}
          page={page}
          rows={rows}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          onToggle={handleToggleDeveloper}
          onEdit={handleEditDeveloper}   // ✅ THIS LINE makes pencil open edit page
        />
      )}

      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
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
