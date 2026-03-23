'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';

import { CommunitiesFilters } from '@/components/dashboard/community/communities-filters';
import { CommunitiesTable } from '@/components/dashboard/community/communities-table';

type ApiCommunity = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  selling_point: string | null;
  about: string | null;
  main_image: string | null;
  is_area: number;
  active: number;
  created_at: string;
  updated_at: string;
};

type ApiPagination = {
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data: ApiCommunity[];
  pagination: ApiPagination;
};

type ApiBasicResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
  errors?: Record<string, string[]>;
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

export type CommunityRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  selling_point?: string | null;
  about?: string | null;
  main_image?: string | null;
  is_area: boolean;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

export default function Page(): React.JSX.Element {
  const router = useRouter();

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const [search, setSearch] = React.useState('');
  const [rows, setRows] = React.useState<CommunityRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const [permissionsLoaded, setPermissionsLoaded] = React.useState(false);
  const [userPermissions, setUserPermissions] = React.useState<string[]>([]);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedCommunity, setSelectedCommunity] = React.useState<CommunityRow | null>(null);

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

  const canRead = hasPermission('communities_read');
  const canCreate = hasPermission('communities_create');
  const canUpdate = hasPermission('communities_update');
  const canDelete = hasPermission('communities_delete');

  const handleToggleStatus = async (community: CommunityRow, nextActive: boolean) => {
    if (!canUpdate) {
      showToast('You do not have permission to update communities.', 'error');
      return;
    }

    setRows((prev) =>
      prev.map((r) => (r.id === community.id ? { ...r, active: nextActive } : r))
    );

    try {
      if (!apiBase) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');

      const accessToken = getAccessToken();

      const res = await fetch(`${apiBase}/admin/change_status_communities`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          community_id: Number(community.id),
          active: nextActive ? 1 : 0,
        }),
      });

      let payload: ApiBasicResponse | null = null;
      try {
        payload = (await res.json()) as ApiBasicResponse;
      } catch {
        payload = null;
      }

      if (!res.ok) {
        const msgFromServer = payload?.message ? String(payload.message) : null;
        throw new Error(msgFromServer || `Status update failed. HTTP ${res.status}`);
      }

      showToast(payload?.message ? String(payload.message) : 'Community status updated.', 'success');
    } catch (err) {
      console.error(err);

      setRows((prev) =>
        prev.map((r) => (r.id === community.id ? { ...r, active: !nextActive } : r))
      );

      const msg = err instanceof Error ? err.message : 'Status update failed';
      showToast(msg, 'error');
    }
  };

  const fetchCommunities = React.useCallback(
    async (opts?: { page?: number; perPage?: number; search?: string }) => {
      try {
        setLoading(true);

        if (!apiBase) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');

        const accessToken = getAccessToken();

        const apiPage = (opts?.page ?? page) + 1;
        const perPage = opts?.perPage ?? rowsPerPage;
        const q = (opts?.search ?? search).trim();

        const params = new URLSearchParams();
        params.set('page', String(apiPage));
        params.set('per_page', String(perPage));
        if (q) params.set('search', q);

        const res = await fetch(`${apiBase}/admin/communities?${params.toString()}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) throw new Error(`Failed. HTTP ${res.status}`);

        const json = (await res.json()) as ApiResponse;

        const mapped: CommunityRow[] = (json.data ?? []).map((r) => ({
          id: String(r.id),
          name: r.name,
          slug: r.slug,
          description: r.description,
          selling_point: r.selling_point,
          about: r.about,
          main_image: r.main_image,
          is_area: Number(r.is_area) === 1,
          active: Number(r.active) === 1,
          created_at: r.created_at,
          updated_at: r.updated_at,
        }));

        setRows(mapped);
        setTotal(json.pagination?.total ?? mapped.length);
      } catch (err) {
        console.error(err);
        setRows([]);
        setTotal(0);
        showToast(err instanceof Error ? err.message : 'Failed to fetch communities', 'error');
      } finally {
        setLoading(false);
      }
    },
    [apiBase, page, rowsPerPage, search]
  );

  React.useEffect(() => {
    if (!permissionsLoaded) return;

    if (!canRead) {
      setLoading(false);
      setRows([]);
      setTotal(0);
      return;
    }

    void fetchCommunities();
  }, [fetchCommunities, permissionsLoaded, canRead]);

  React.useEffect(() => {
    setPage(0);
  }, [search]);

  const handleDeleteClick = (community: CommunityRow) => {
    if (!canDelete) {
      showToast('You do not have permission to delete communities.', 'error');
      return;
    }

    setSelectedCommunity(community);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCommunity) return;

    if (!canDelete) {
      showToast('You do not have permission to delete communities.', 'error');
      return;
    }

    try {
      setLoading(true);

      if (!apiBase) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');

      const accessToken = getAccessToken();

      const res = await fetch(`${apiBase}/admin/communities/${Number(selectedCommunity.id)}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      let payload: ApiBasicResponse | null = null;
      try {
        payload = (await res.json()) as ApiBasicResponse;
      } catch {
        payload = null;
      }

      if (!res.ok) {
        const msgFromServer = payload?.message ? String(payload.message) : null;
        throw new Error(msgFromServer || `Delete failed. HTTP ${res.status}`);
      }

      setDeleteOpen(false);
      setSelectedCommunity(null);

      await fetchCommunities({ page, perPage: rowsPerPage, search });
      showToast(payload?.message ? String(payload.message) : 'Community deleted successfully.', 'success');
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Delete failed';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToAddPage = () => {
    if (!canCreate) {
      showToast('You do not have permission to create communities.', 'error');
      return;
    }

    router.push('/dashboard/communities/add');
  };

  const handleGoToEditPage = (community: CommunityRow) => {
    if (!canUpdate) {
      showToast('You do not have permission to update communities.', 'error');
      return;
    }

    router.push(`/dashboard/communities/edit/${community.id}`);
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
        <Typography variant="h4">Communities</Typography>
        <Alert severity="error" variant="filled">
          You do not have permission to view communities.
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Communities</Typography>
        </Stack>

        {canCreate ? (
          <div>
            <Button
              startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
              variant="contained"
              onClick={handleGoToAddPage}
            >
              Add Community
            </Button>
          </div>
        ) : null}
      </Stack>

      <CommunitiesFilters search={search} onSearchChange={setSearch} />

      {loading ? (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 2 }}>
          <CircularProgress size={22} />
          <Typography variant="body2">Loading Communities...</Typography>
        </Stack>
      ) : (
        <CommunitiesTable
          count={total}
          page={page}
          rows={rows}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          onEdit={canUpdate ? (community) => handleGoToEditPage(community) : undefined}
          onDelete={canDelete ? (community) => handleDeleteClick(community) : undefined}
          onToggleStatus={canUpdate ? (community, nextActive) => void handleToggleStatus(community, nextActive) : undefined}
        />
      )}

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Community</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{selectedCommunity?.name}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => void handleDeleteConfirm()} color="error" variant="contained">
            Delete
          </Button>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

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
            backgroundColor: toastSeverity === 'success' ? '#094834' : undefined,
            '& .MuiAlert-icon': { color: '#fff' },
          }}
        >
          {toastMsg}
        </Alert>
      </Snackbar>
    </Stack>
  );
}