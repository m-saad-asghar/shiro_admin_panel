'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';

import { PermissionsFilters } from '@/components/dashboard/permission/permissions-filters';
import { PermissionsTable } from '@/components/dashboard/permission/permissions-table';

// --------------------
// API TYPES
// --------------------
type ApiPermissionItem = {
  id: number;
  title: string;
  name: string;
  guard_name: string;
};

type ApiPermissionGroup = {
  id: number;
  title: string;
  name: string;
  guard_name: string;
  permissions: ApiPermissionItem[];
};

type ApiResponse = {
  message: string;
  data: ApiPermissionGroup[];
};

type ApiRole = {
  id: number;
  title: string;
  name: string;
  guard_name: string;
  created_at?: string;
  updated_at?: string;
};

type ApiRolesResponse = {
  message?: string;
  data: ApiRole[];
};

type ApiAllPermissionsResponse = {
  message?: string;
  data: ApiPermissionItem[];
};

type ApiBasicResponse = {
  message?: string;
  data?: unknown;
  errors?: Record<string, string[]>;
};

export type PermissionGroupRow = {
  id: string;
  title: string;
  permissions: { id: string; title: string }[];
};

export default function Page(): React.JSX.Element {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [search, setSearch] = React.useState('');
  const [rows, setRows] = React.useState<PermissionGroupRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  // ✅ Add modal state
  const [addOpen, setAddOpen] = React.useState(false);
  const [addSubmitting, setAddSubmitting] = React.useState(false);
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>('');
  const [selectedPermissionIds, setSelectedPermissionIds] = React.useState<Set<string>>(new Set());

  // ✅ Edit modal state
  const [editOpen, setEditOpen] = React.useState(false);
  const [editSubmitting, setEditSubmitting] = React.useState(false);
  const [editRoleId, setEditRoleId] = React.useState<string>('');
  const [editPermissionIds, setEditPermissionIds] = React.useState<Set<string>>(new Set());

  // Options for role dropdown + permission checkboxes
  const [roleOptions, setRoleOptions] = React.useState<ApiRole[]>([]);
  const [permissionOptions, setPermissionOptions] = React.useState<ApiPermissionItem[]>([]);

  // Toast
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('');
  const [toastSeverity, setToastSeverity] = React.useState<'success' | 'error' | 'info' | 'warning'>('success');

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const SAVE_ROLE_PERMISSIONS_ENDPOINT = `${apiBase}/admin/role-permissions`;
  const UPDATE_ROLE_PERMISSIONS_ENDPOINT = `${apiBase}/admin/role-permissions/update`;

  const ROLES_ENDPOINT = `${apiBase}/admin/roles`;
  const ALL_PERMISSIONS_ENDPOINT = `${apiBase}/admin/all-permissions`;

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

  const fetchPermissions = React.useCallback(async () => {
    try {
      setLoading(true);

      const accessToken = getAccessToken();

      const res = await fetch(`${apiBase}/admin/permissions`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) throw new Error(`Unauthorized / failed. HTTP ${res.status}`);

      const json = (await res.json()) as ApiResponse;

      const mapped: PermissionGroupRow[] = (json.data ?? []).map((item) => ({
        id: String(item.id),
        title: item.title,
        permissions: (item.permissions ?? []).map((p) => ({
          id: String(p.id),
          title: p.title,
        })),
      }));

      setRows(mapped);
      setPage(0);
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  React.useEffect(() => {
    void fetchPermissions();
  }, [fetchPermissions]);

  // Search role title OR permission title
  const filteredRows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const groupMatch = r.title.toLowerCase().includes(q);
      const permissionMatch = r.permissions.some((p) => p.title.toLowerCase().includes(q));
      return groupMatch || permissionMatch;
    });
  }, [rows, search]);

  React.useEffect(() => {
    setPage(0);
  }, [search]);

  const paginatedRows = React.useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const loadAddModalData = async () => {
    const accessToken = getAccessToken();

    const [rolesRes, permsRes] = await Promise.all([
      fetch(ROLES_ENDPOINT, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
      }),
      fetch(ALL_PERMISSIONS_ENDPOINT, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
      }),
    ]);

    if (!rolesRes.ok) throw new Error(`Failed to load roles. HTTP ${rolesRes.status}`);
    if (!permsRes.ok) throw new Error(`Failed to load permissions. HTTP ${permsRes.status}`);

    const rolesJson = (await rolesRes.json()) as ApiRolesResponse;
    const permsJson = (await permsRes.json()) as ApiAllPermissionsResponse;

    setRoleOptions(Array.isArray(rolesJson.data) ? rolesJson.data : []);
    setPermissionOptions(Array.isArray(permsJson.data) ? permsJson.data : []);
  };

  // ---------------------------
  // ✅ ADD
  // ---------------------------
  const openAddDialog = async () => {
    try {
      setAddSubmitting(true);
      setAddOpen(true);

      setSelectedRoleId('');
      setSelectedPermissionIds(new Set());

      await loadAddModalData();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to load data';
      showToast(msg, 'error');
      setAddOpen(false);
    } finally {
      setAddSubmitting(false);
    }
  };

  const closeAddDialog = () => {
    if (addSubmitting) return;
    setAddOpen(false);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) next.delete(permissionId);
      else next.add(permissionId);
      return next;
    });
  };

  const handleAddConfirm = async () => {
    const roleId = selectedRoleId.trim();

    if (!roleId) {
      showToast('Please select a role.', 'error');
      return;
    }

    if (selectedPermissionIds.size === 0) {
      showToast('Please select at least one permission.', 'error');
      return;
    }

    if (addSubmitting) return;

    try {
      setAddSubmitting(true);

      const accessToken = getAccessToken();

      const payloadBody = {
        role_id: Number(roleId),
        permission_ids: Array.from(selectedPermissionIds).map((id) => Number(id)),
      };

      const res = await fetch(SAVE_ROLE_PERMISSIONS_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payloadBody),
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
          (res.status === 409
            ? 'This role already has permissions. Cannot override.'
            : `Failed to save. HTTP ${res.status}`);

        showToast(msg, 'error');
        return;
      }

      showToast(payload?.message ? String(payload.message) : 'Saved', 'success');
      setAddOpen(false);
      await fetchPermissions();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      showToast(msg, 'error');
    } finally {
      setAddSubmitting(false);
    }
  };

  // ---------------------------
  // ✅ EDIT
  // ---------------------------
  const toggleEditPermission = (permissionId: string) => {
    setEditPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) next.delete(permissionId);
      else next.add(permissionId);
      return next;
    });
  };

  const openEditDialog = async (row: PermissionGroupRow) => {
    try {
      setEditSubmitting(true);
      setEditOpen(true);

      setEditRoleId(row.id);
      setEditPermissionIds(new Set(row.permissions.map((p) => String(p.id))));

      await loadAddModalData();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to load edit data';
      showToast(msg, 'error');
      setEditOpen(false);
    } finally {
      setEditSubmitting(false);
    }
  };

  const closeEditDialog = () => {
    if (editSubmitting) return;
    setEditOpen(false);
    setEditRoleId('');
    setEditPermissionIds(new Set());
  };

  const handleEditConfirm = async () => {
    const roleId = editRoleId.trim();

    if (!roleId) {
      showToast('Role is missing.', 'error');
      return;
    }

    if (editPermissionIds.size === 0) {
      showToast('Please select at least one permission.', 'error');
      return;
    }

    if (editSubmitting) return;

    try {
      setEditSubmitting(true);

      // Compare old vs new (if same => allow and just show Saved)
      const existingRow = rows.find((r) => r.id === roleId);
      const oldIds = new Set((existingRow?.permissions ?? []).map((p) => String(p.id)));
      const newIds = new Set(Array.from(editPermissionIds).map(String));

      const sameSize = oldIds.size === newIds.size;
      const sameAll = sameSize && Array.from(oldIds).every((x) => newIds.has(x));

      if (sameAll) {
        showToast('Saved', 'success');
        closeEditDialog();
        return;
      }

      const accessToken = getAccessToken();

      const payloadBody = {
        role_id: Number(roleId),
        permission_ids: Array.from(editPermissionIds).map((id) => Number(id)),
      };

      const res = await fetch(UPDATE_ROLE_PERMISSIONS_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payloadBody),
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
          (res.status === 409 ? 'Role mismatch. Cannot override another role.' : `Update failed. HTTP ${res.status}`);

        showToast(msg, 'error');
        return;
      }

      showToast(payload?.message ? String(payload.message) : 'Saved', 'success');
      closeEditDialog();
      await fetchPermissions();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      showToast(msg, 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleEdit = (row: PermissionGroupRow) => {
    void openEditDialog(row);
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Permissions</Typography>
        </Stack>

        <div>
          <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} variant="contained" onClick={openAddDialog}>
            Add
          </Button>
        </div>
      </Stack>

      <PermissionsFilters search={search} onSearchChange={setSearch} />

      {loading ? (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 2 }}>
          <CircularProgress size={22} />
          <Typography variant="body2">Loading permissions...</Typography>
        </Stack>
      ) : (
        <PermissionsTable
          count={filteredRows.length}
          page={page}
          rows={paginatedRows}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          onEdit={(row) => handleEdit(row)}
        />
      )}

      {/* ✅ ADD MODAL */}
      <Dialog open={addOpen} onClose={closeAddDialog} fullWidth maxWidth="md">
        <DialogTitle>Add Permissions</DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <FormControl fullWidth variant="outlined" disabled={addSubmitting}>
              <InputLabel
                id="role-select-label"
                sx={{
                  transform: 'translate(14px, 18px) scale(1)',
                  '&.MuiInputLabel-shrink': {
                    transform: 'translate(14px, -9px) scale(0.75)',
                    backgroundColor: '#fff',
                    px: 0.5,
                  },
                }}
              >
                Select Role
              </InputLabel>

              <Select
                labelId="role-select-label"
                label="Select Role"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(String(e.target.value))}
                sx={{
                  height: 56,
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    py: 0,
                  },
                }}
              >
                {roleOptions.map((r) => (
                  <MenuItem key={r.id} value={String(r.id)}>
                    {r.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Select Permissions
              </Typography>

              <FormGroup
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  columnGap: 2,
                }}
              >
                {permissionOptions.map((p) => {
                  const idStr = String(p.id);
                  const checked = selectedPermissionIds.has(idStr);

                  return (
                    <FormControlLabel
                      key={p.id}
                      sx={{ m: 0, py: 0.5 }}
                      control={<Checkbox checked={checked} onChange={() => togglePermission(idStr)} disabled={addSubmitting} />}
                      label={p.title}
                    />
                  );
                })}
              </FormGroup>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="text" onClick={closeAddDialog} disabled={addSubmitting}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={() => void handleAddConfirm()}
            disabled={addSubmitting}
            startIcon={addSubmitting ? <CircularProgress size={16} /> : undefined}
          >
            {addSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ EDIT MODAL */}
      <Dialog open={editOpen} onClose={closeEditDialog} fullWidth maxWidth="md">
        <DialogTitle>Edit Permissions</DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {/* Role locked in edit */}
            <FormControl fullWidth variant="outlined" disabled>
              <InputLabel id="edit-role-label">Role</InputLabel>
              <Select labelId="edit-role-label" label="Role" value={editRoleId}>
                <MenuItem value={editRoleId}>{rows.find((r) => r.id === editRoleId)?.title ?? 'Selected Role'}</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Update Permissions
              </Typography>

              <FormGroup
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  columnGap: 2,
                }}
              >
                {permissionOptions.map((p) => {
                  const idStr = String(p.id);
                  const checked = editPermissionIds.has(idStr);

                  return (
                    <FormControlLabel
                      key={p.id}
                      sx={{ m: 0, py: 0.5 }}
                      control={<Checkbox checked={checked} onChange={() => toggleEditPermission(idStr)} disabled={editSubmitting} />}
                      label={p.title}
                    />
                  );
                })}
              </FormGroup>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="text" onClick={closeEditDialog} disabled={editSubmitting}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={() => void handleEditConfirm()}
            disabled={editSubmitting}
            startIcon={editSubmitting ? <CircularProgress size={16} /> : undefined}
          >
            {editSubmitting ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Toast */}
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
            backgroundColor: toastSeverity === 'success' ? '#9f8151' : undefined,
            '& .MuiAlert-icon': { color: '#fff' },
          }}
        >
          {toastMsg}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
