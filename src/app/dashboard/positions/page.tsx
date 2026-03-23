'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';

import { PositionsFilters } from '@/components/dashboard/position/positions-filters';
import { PositionsTable } from '@/components/dashboard/position/positions-table';

type ApiPosition = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string | null;
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
  data: ApiPosition[];
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

export type PositionRow = {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string | null;
};

export default function Page(): React.JSX.Element {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const [search, setSearch] = React.useState('');
  const [rows, setRows] = React.useState<PositionRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const [permissionsLoaded, setPermissionsLoaded] = React.useState(false);
  const [userPermissions, setUserPermissions] = React.useState<string[]>([]);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedPosition, setSelectedPosition] = React.useState<PositionRow | null>(null);

  const [addOpen, setAddOpen] = React.useState(false);
  const [newPositionName, setNewPositionName] = React.useState('');
  const [addSubmitting, setAddSubmitting] = React.useState(false);

  const [editOpen, setEditOpen] = React.useState(false);
  const [editPositionId, setEditPositionId] = React.useState<string | null>(null);
  const [editPositionName, setEditPositionName] = React.useState('');
  const [editSubmitting, setEditSubmitting] = React.useState(false);

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

  const canRead = hasPermission('positions_read');
  const canCreate = hasPermission('positions_create');
  const canUpdate = hasPermission('positions_update');
  const canDelete = hasPermission('positions_delete');

  const fetchPositions = React.useCallback(
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

        const res = await fetch(`${apiBase}/admin/positions?${params.toString()}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) throw new Error(`Failed. HTTP ${res.status}`);

        const json = (await res.json()) as ApiResponse;

        const mapped: PositionRow[] = (json.data ?? []).map((r) => ({
          id: String(r.id),
          name: r.name,
          created_at: r.created_at,
          updated_at: r.updated_at,
        }));

        setRows(mapped);
        setTotal(json.pagination?.total ?? mapped.length);
      } catch (err) {
        console.error(err);
        setRows([]);
        setTotal(0);
        showToast(err instanceof Error ? err.message : 'Failed to fetch positions', 'error');
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

    void fetchPositions();
  }, [fetchPositions, permissionsLoaded, canRead]);

  React.useEffect(() => {
    setPage(0);
  }, [search]);

  const handleDeleteClick = (position: PositionRow) => {
    if (!canDelete) {
      showToast('You do not have permission to delete positions.', 'error');
      return;
    }

    setSelectedPosition(position);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPosition) return;

    if (!canDelete) {
      showToast('You do not have permission to delete positions.', 'error');
      return;
    }

    try {
      setLoading(true);

      if (!apiBase) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');

      const accessToken = getAccessToken();

      const res = await fetch(`${apiBase}/admin/positions/${Number(selectedPosition.id)}`, {
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
      setSelectedPosition(null);

      await fetchPositions({ page, perPage: rowsPerPage, search });
      showToast(payload?.message ? String(payload.message) : 'Position deleted successfully.', 'success');
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Delete failed';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    if (!canCreate) {
      showToast('You do not have permission to create positions.', 'error');
      return;
    }

    setAddOpen(true);
    setNewPositionName('');
    setAddSubmitting(false);
  };

  const closeAddDialog = () => {
    if (addSubmitting) return;
    setAddOpen(false);
  };

  const handleAddConfirm = async () => {
    if (!canCreate) {
      showToast('You do not have permission to create positions.', 'error');
      return;
    }

    const cleanName = newPositionName.trim();
    if (!cleanName || addSubmitting) return;

    try {
      setAddSubmitting(true);

      if (!apiBase) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');

      const accessToken = getAccessToken();

      const res = await fetch(`${apiBase}/admin/add-position`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: cleanName }),
      });

      let payload: ApiBasicResponse | null = null;
      try {
        payload = (await res.json()) as ApiBasicResponse;
      } catch {
        payload = null;
      }

      if (!res.ok) {
        const msgFromServer = payload?.message ? String(payload.message) : null;

        const firstField = payload?.errors ? Object.keys(payload.errors)[0] : null;
        const firstError =
          firstField && payload?.errors?.[firstField]?.[0]
            ? String(payload.errors[firstField][0])
            : null;

        const msg =
          firstError ||
          msgFromServer ||
          (res.status === 409 ? 'Position already exists.' : `Add Position failed. HTTP ${res.status}`);

        showToast(msg, 'error');
        return;
      }

      setAddOpen(false);
      setNewPositionName('');

      setPage(0);
      await fetchPositions({ page: 0, perPage: rowsPerPage, search });
      showToast(payload?.message ? String(payload.message) : 'Position created successfully.', 'success');
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Add Position failed';
      showToast(msg, 'error');
    } finally {
      setAddSubmitting(false);
    }
  };

  const openEditDialog = (position: PositionRow) => {
    if (!canUpdate) {
      showToast('You do not have permission to update positions.', 'error');
      return;
    }

    setEditOpen(true);
    setEditPositionId(position.id);
    setEditPositionName(position.name);
    setEditSubmitting(false);
  };

  const closeEditDialog = () => {
    if (editSubmitting) return;
    setEditOpen(false);
    setEditPositionId(null);
    setEditPositionName('');
  };

  const handleEditConfirm = async () => {
    if (!canUpdate) {
      showToast('You do not have permission to update positions.', 'error');
      return;
    }

    const cleanName = editPositionName.trim();
    if (!editPositionId || !cleanName || editSubmitting) return;

    try {
      setEditSubmitting(true);

      if (!apiBase) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');

      const accessToken = getAccessToken();

      const res = await fetch(`${apiBase}/admin/positions/${Number(editPositionId)}`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: cleanName }),
      });

      let payload: ApiBasicResponse | null = null;
      try {
        payload = (await res.json()) as ApiBasicResponse;
      } catch {
        payload = null;
      }

      if (!res.ok) {
        const msgFromServer = payload?.message ? String(payload.message) : null;

        const firstField = payload?.errors ? Object.keys(payload.errors)[0] : null;
        const firstError =
          firstField && payload?.errors?.[firstField]?.[0]
            ? String(payload.errors[firstField][0])
            : null;

        const msg = firstError || msgFromServer || `Update Position failed. HTTP ${res.status}`;
        showToast(msg, 'error');
        return;
      }

      closeEditDialog();
      await fetchPositions({ page, perPage: rowsPerPage, search });
      showToast(payload?.message ? String(payload.message) : 'Position updated successfully.', 'success');
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Update Position failed';
      showToast(msg, 'error');
    } finally {
      setEditSubmitting(false);
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
        <Typography variant="h4">Positions</Typography>
        <Alert severity="error" variant="filled">
          You do not have permission to view positions.
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Positions</Typography>
        </Stack>

        {canCreate ? (
          <div>
            <Button
              startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
              variant="contained"
              onClick={openAddDialog}
            >
              Add Position
            </Button>
          </div>
        ) : null}
      </Stack>

      <PositionsFilters search={search} onSearchChange={setSearch} />

      {loading ? (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 2 }}>
          <CircularProgress size={22} />
          <Typography variant="body2">Loading Positions...</Typography>
        </Stack>
      ) : (
        <PositionsTable
          count={total}
          page={page}
          rows={rows}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          onEdit={canUpdate ? (position) => openEditDialog(position) : undefined}
          onDelete={canDelete ? (position) => handleDeleteClick(position) : undefined}
        />
      )}

      <Dialog open={addOpen} onClose={closeAddDialog} fullWidth maxWidth="sm">
        <DialogTitle>Add Position</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Position Name"
            fullWidth
            value={newPositionName}
            onChange={(e) => setNewPositionName(e.target.value)}
            inputProps={{ maxLength: 256 }}
            disabled={addSubmitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newPositionName.trim().length > 0 && !addSubmitting) {
                e.preventDefault();
                void handleAddConfirm();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="contained"
            onClick={() => void handleAddConfirm()}
            disabled={!newPositionName.trim() || addSubmitting}
            startIcon={addSubmitting ? <CircularProgress size={16} /> : undefined}
          >
            {addSubmitting ? 'Adding...' : 'Add'}
          </Button>
          <Button variant="text" onClick={closeAddDialog} disabled={addSubmitting}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={closeEditDialog} fullWidth maxWidth="sm">
        <DialogTitle>Edit Position</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={editPositionName}
            onChange={(e) => setEditPositionName(e.target.value)}
            inputProps={{ maxLength: 256 }}
            disabled={editSubmitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && editPositionName.trim().length > 0 && !editSubmitting) {
                e.preventDefault();
                void handleEditConfirm();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="text" onClick={closeEditDialog} disabled={editSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleEditConfirm()}
            disabled={!editPositionName.trim() || editSubmitting}
            startIcon={editSubmitting ? <CircularProgress size={16} /> : undefined}
          >
            {editSubmitting ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => {
          if (loading) return;
          setDeleteOpen(false);
        }}
      >
        <DialogTitle>Delete Position</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{selectedPosition?.name}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => void handleDeleteConfirm()} color="error" variant="contained">
            Delete
          </Button>
          <Button
            onClick={() => setDeleteOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
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