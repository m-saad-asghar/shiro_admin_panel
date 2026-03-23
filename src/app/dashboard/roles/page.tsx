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
import Box from '@mui/material/Box';

import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';

import { RolesFilters } from '@/components/dashboard/role/roles-filters';
import { RolesTable } from '@/components/dashboard/role/roles-table';

type ApiRole = {
  id: number;
  title: string;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
};

type ApiResponse = {
  message: string;
  data: ApiRole[];
};

type ApiBasicResponse = {
  message?: string;
  data?: unknown;
  errors?: Record<string, string[]>;
};

export type RoleRow = {
  id: string;
  title: string;
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

export default function Page(): React.JSX.Element {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [search, setSearch] = React.useState('');
  const [rows, setRows] = React.useState<RoleRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  // permissions
  const [permissionsLoaded, setPermissionsLoaded] = React.useState(false);
  const [userPermissions, setUserPermissions] = React.useState<string[]>([]);

  // delete dialog state
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<RoleRow | null>(null);

  // add role dialog state
  const [addOpen, setAddOpen] = React.useState(false);
  const [newRoleTitle, setNewRoleTitle] = React.useState('');
  const [addSubmitting, setAddSubmitting] = React.useState(false);

  // edit role dialog state
  const [editOpen, setEditOpen] = React.useState(false);
  const [editRoleId, setEditRoleId] = React.useState<string | null>(null);
  const [editRoleTitle, setEditRoleTitle] = React.useState('');
  const [editSubmitting, setEditSubmitting] = React.useState(false);

  // toast
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
      payload.user?.roles.forEach((role) => pushPermissions(role.permissions));
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
    (permission: string) => {
      return userPermissions.includes(permission);
    },
    [userPermissions]
  );

  const canRead = hasPermission('roles_read');
  const canCreate = hasPermission('roles_create');
  const canUpdate = hasPermission('roles_update');
  const canDelete = hasPermission('roles_delete');

  const fetchRoles = React.useCallback(async () => {
    try {
      setLoading(true);

      if (!apiBase) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');

      const accessToken = getAccessToken();

      const res = await fetch(`${apiBase}/admin/roles`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) throw new Error(`Unauthorized / failed. HTTP ${res.status}`);

      const json = (await res.json()) as ApiResponse;

      const mapped: RoleRow[] = (json.data ?? []).map((r) => ({
        id: String(r.id),
        title: r.title,
      }));

      setRows(mapped);
      setPage(0);
    } catch (err) {
      console.error(err);
      setRows([]);
      showToast(err instanceof Error ? err.message : 'Failed to fetch roles', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  React.useEffect(() => {
    if (!permissionsLoaded) return;
    if (!canRead) {
      setLoading(false);
      setRows([]);
      return;
    }
    void fetchRoles();
  }, [fetchRoles, permissionsLoaded, canRead]);

  const filteredRows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.title.toLowerCase().includes(q));
  }, [rows, search]);

  React.useEffect(() => {
    setPage(0);
  }, [search]);

  const paginatedRows = applyPagination(filteredRows, page, rowsPerPage);

  // delete handlers
  const handleDeleteClick = (role: RoleRow) => {
    if (!canDelete) {
      showToast('You do not have permission to delete roles.', 'error');
      return;
    }

    setSelectedRole(role);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRole) return;
    if (!canDelete) {
      showToast('You do not have permission to delete roles.', 'error');
      return;
    }

    try {
      setLoading(true);

      if (!apiBase) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');

      const accessToken = getAccessToken();

      const res = await fetch(`${apiBase}/admin/delete_role`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ role_id: Number(selectedRole.id) }),
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
      setSelectedRole(null);

      await fetchRoles();
      showToast(payload?.message ? String(payload.message) : 'Role deleted successfully.', 'success');
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Delete failed';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // add role handlers
  const openAddDialog = () => {
    if (!canCreate) {
      showToast('You do not have permission to create roles.', 'error');
      return;
    }

    setAddOpen(true);
    setNewRoleTitle('');
    setAddSubmitting(false);
  };

  const closeAddDialog = () => {
    if (addSubmitting) return;
    setAddOpen(false);
  };

  const handleAddConfirm = async () => {
    const cleanTitle = newRoleTitle.trim();
    if (!cleanTitle || addSubmitting) return;

    if (!canCreate) {
      showToast('You do not have permission to create roles.', 'error');
      return;
    }

    try {
      setAddSubmitting(true);

      if (!apiBase) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');

      const accessToken = getAccessToken();

      const res = await fetch(`${apiBase}/admin/add-role`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title: cleanTitle }),
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
          firstField && payload?.errors?.[firstField]?.[0] ? String(payload.errors[firstField][0]) : null;

        const msg =
          firstError ||
          msgFromServer ||
          (res.status === 409 ? 'Role already exists.' : `Add role failed. HTTP ${res.status}`);

        showToast(msg, 'error');
        return;
      }

      setAddOpen(false);
      setNewRoleTitle('');

      await fetchRoles();

      showToast(payload?.message ? String(payload.message) : 'Role created successfully.', 'success');
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Add role failed';
      showToast(msg, 'error');
    } finally {
      setAddSubmitting(false);
    }
  };

  // edit role handlers
  const openEditDialog = (role: RoleRow) => {
    if (!canUpdate) {
      showToast('You do not have permission to update roles.', 'error');
      return;
    }

    setEditOpen(true);
    setEditRoleId(role.id);
    setEditRoleTitle(role.title);
    setEditSubmitting(false);
  };

  const closeEditDialog = () => {
    if (editSubmitting) return;
    setEditOpen(false);
    setEditRoleId(null);
    setEditRoleTitle('');
  };

  const handleEditConfirm = async () => {
    const cleanTitle = editRoleTitle.trim();
    if (!editRoleId || !cleanTitle || editSubmitting) return;

    if (!canUpdate) {
      showToast('You do not have permission to update roles.', 'error');
      return;
    }

    try {
      setEditSubmitting(true);

      if (!apiBase) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');

      const accessToken = getAccessToken();

      const res = await fetch(`${apiBase}/admin/update-role`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          role_id: Number(editRoleId),
          title: cleanTitle,
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

        const firstField = payload?.errors ? Object.keys(payload.errors)[0] : null;
        const firstError =
          firstField && payload?.errors?.[firstField]?.[0] ? String(payload.errors[firstField][0]) : null;

        const msg = firstError || msgFromServer || `Update role failed. HTTP ${res.status}`;
        showToast(msg, 'error');
        return;
      }

      closeEditDialog();
      await fetchRoles();

      showToast(payload?.message ? String(payload.message) : 'Role updated successfully.', 'success');
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Update role failed';
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
        <Typography variant="h4">Roles</Typography>
        <Alert severity="error" variant="filled">
          You do not have permission to view roles.
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Roles</Typography>
        </Stack>

        {canCreate ? (
          <div>
            <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} variant="contained" onClick={openAddDialog}>
              Add Role
            </Button>
          </div>
        ) : null}
      </Stack>

      <RolesFilters search={search} onSearchChange={setSearch} />

      {loading ? (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 2 }}>
          <CircularProgress size={22} />
          <Typography variant="body2">Loading roles...</Typography>
        </Stack>
      ) : (
        <RolesTable
          count={filteredRows.length}
          page={page}
          rows={paginatedRows}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          onEdit={canUpdate ? (role) => openEditDialog(role) : undefined}
          onDelete={canDelete ? (role) => handleDeleteClick(role) : undefined}
        />
      )}

      <Dialog open={addOpen} onClose={closeAddDialog} fullWidth maxWidth="sm">
        <DialogTitle>Add Role</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Role Title"
            fullWidth
            value={newRoleTitle}
            onChange={(e) => setNewRoleTitle(e.target.value)}
            inputProps={{ maxLength: 100 }}
            disabled={addSubmitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newRoleTitle.trim().length > 0 && !addSubmitting) {
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
            disabled={!newRoleTitle.trim() || addSubmitting}
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
        <DialogTitle>Edit Role</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={editRoleTitle}
            onChange={(e) => setEditRoleTitle(e.target.value)}
            inputProps={{ maxLength: 100 }}
            disabled={editSubmitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && editRoleTitle.trim().length > 0 && !editSubmitting) {
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
            disabled={!editRoleTitle.trim() || editSubmitting}
            startIcon={editSubmitting ? <CircularProgress size={16} /> : undefined}
          >
            {editSubmitting ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Role</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete "{selectedRole?.title}"?</DialogContentText>
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

function applyPagination(rows: RoleRow[], page: number, rowsPerPage: number): RoleRow[] {
  return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
}