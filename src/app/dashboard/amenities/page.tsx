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

import { AmenitiesFilters } from '@/components/dashboard/amenity/amenities-filters';
import { AmenitiesTable } from '@/components/dashboard/amenity/amenities-table';

type ApiAmenity = {
  id: number;
  name: string;
  active: number; // 0/1
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
  data: ApiAmenity[];
  pagination: ApiPagination;
};

type ApiBasicResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
  errors?: Record<string, string[]>;
};

export type AmenityRow = {
  id: string;
  name: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

export default function Page(): React.JSX.Element {
  // NOTE: MUI TablePagination is 0-based. API is 1-based.
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const [search, setSearch] = React.useState('');
  const [rows, setRows] = React.useState<AmenityRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // 🔴 Delete dialog state
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedAmenity, setSelectedAmenity] = React.useState<AmenityRow | null>(null);

  // ✅ Add Amenity dialog state
  const [addOpen, setAddOpen] = React.useState(false);
  const [newAmenityName, setNewAmenityName] = React.useState('');
  const [addSubmitting, setAddSubmitting] = React.useState(false);

  // ✅ Edit Amenity dialog state
  const [editOpen, setEditOpen] = React.useState(false);
  const [editAmenityId, setEditAmenityId] = React.useState<string | null>(null);
  const [editAmenityName, setEditAmenityName] = React.useState('');
  const [editSubmitting, setEditSubmitting] = React.useState(false);

  // ✅ Toast
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('');
  const [toastSeverity, setToastSeverity] = React.useState<'success' | 'error' | 'info' | 'warning'>('success');

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const showToast = (message: string, severity: typeof toastSeverity = 'success') => {
    setToastMsg(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

   const handleToggleStatus = async (amenity: AmenityRow, nextActive: boolean) => {
  // 1) optimistic UI update
  setRows((prev) =>
    prev.map((r) => (r.id === amenity.id ? { ...r, active: nextActive } : r))
  );

  try {
    const accessToken = getAccessToken();

    const res = await fetch(`${apiBase}/admin/change_status_amenity`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        amenity_id: Number(amenity.id),
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

    showToast(payload?.message ? String(payload.message) : 'Amenity status updated.', 'success');
  } catch (err) {
    console.error(err);

    // 2) rollback on failure
    setRows((prev) =>
      prev.map((r) => (r.id === amenity.id ? { ...r, active: !nextActive } : r))
    );

    const msg = err instanceof Error ? err.message : 'Status update failed';
    showToast(msg, 'error');
  }
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

  const fetchAmenities = React.useCallback(
    async (opts?: { page?: number; perPage?: number; search?: string }) => {
      try {
        setLoading(true);

        const accessToken = getAccessToken();

        const apiPage = (opts?.page ?? page) + 1; // convert 0-based -> 1-based
        const perPage = opts?.perPage ?? rowsPerPage;
        const q = (opts?.search ?? search).trim();

        const params = new URLSearchParams();
        params.set('page', String(apiPage));
        params.set('per_page', String(perPage));
        if (q) params.set('search', q);

        const res = await fetch(`${apiBase}/admin/amenities?${params.toString()}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) throw new Error(`Failed. HTTP ${res.status}`);

        const json = (await res.json()) as ApiResponse;

        const mapped: AmenityRow[] = (json.data ?? []).map((r) => ({
          id: String(r.id),
          name: r.name,
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
      } finally {
        setLoading(false);
      }
    },
    [apiBase, page, rowsPerPage, search]
  );

  // Initial + whenever page/perPage/search changes
  React.useEffect(() => {
    void fetchAmenities();
  }, [fetchAmenities]);

  // Reset page when search changes
  React.useEffect(() => {
    setPage(0);
  }, [search]);

  // ---------------------------
  // Delete handlers
  // ---------------------------
  const handleDeleteClick = (amenity: AmenityRow) => {
    setSelectedAmenity(amenity);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAmenity) return;

    try {
      setLoading(true);

      const accessToken = getAccessToken();

      // ✅ change this endpoint if your backend differs
      const res = await fetch(`${apiBase}/admin/amenities/${Number(selectedAmenity.id)}`, {
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
      setSelectedAmenity(null);

      // keep current page
      await fetchAmenities({ page, perPage: rowsPerPage, search });
      showToast(payload?.message ? String(payload.message) : 'Amenity deleted successfully.', 'success');
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Delete failed';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Add Amenity handlers
  // ---------------------------
  const openAddDialog = () => {
    setAddOpen(true);
    setNewAmenityName('');
    setAddSubmitting(false);
  };

  const closeAddDialog = () => {
    if (addSubmitting) return;
    setAddOpen(false);
  };

  const handleAddConfirm = async () => {
    const cleanName = newAmenityName.trim();
    if (!cleanName || addSubmitting) return;

    try {
      setAddSubmitting(true);

      const accessToken = getAccessToken();

      // ✅ change this endpoint if your backend differs
      const res = await fetch(`${apiBase}/admin/add-amenity`, {
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
          firstField && payload?.errors?.[firstField]?.[0] ? String(payload.errors[firstField][0]) : null;

        const msg =
          firstError ||
          msgFromServer ||
          (res.status === 409 ? 'Amenity already exists.' : `Add Amenity failed. HTTP ${res.status}`);

        showToast(msg, 'error');
        return;
      }

      setAddOpen(false);
      setNewAmenityName('');

      // reload first page so new item appears
      setPage(0);
      await fetchAmenities({ page: 0, perPage: rowsPerPage, search });
      showToast(payload?.message ? String(payload.message) : 'Amenity created successfully.', 'success');
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Add Amenity failed';
      showToast(msg, 'error');
    } finally {
      setAddSubmitting(false);
    }
  };

  // ---------------------------
  // Edit Amenity handlers
  // ---------------------------
  const openEditDialog = (amenity: AmenityRow) => {
    setEditOpen(true);
    setEditAmenityId(amenity.id);
    setEditAmenityName(amenity.name);
    setEditSubmitting(false);
  };

  const closeEditDialog = () => {
    if (editSubmitting) return;
    setEditOpen(false);
    setEditAmenityId(null);
    setEditAmenityName('');
  };

  const handleEditConfirm = async () => {
    const cleanName = editAmenityName.trim();
    if (!editAmenityId || !cleanName || editSubmitting) return;

    try {
      setEditSubmitting(true);

      const accessToken = getAccessToken();

      // ✅ change this endpoint if your backend differs
      const res = await fetch(`${apiBase}/admin/amenities/${Number(editAmenityId)}`, {
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
          firstField && payload?.errors?.[firstField]?.[0] ? String(payload.errors[firstField][0]) : null;

        const msg = firstError || msgFromServer || `Update Amenity failed. HTTP ${res.status}`;
        showToast(msg, 'error');
        return;
      }

      closeEditDialog();

      // keep current page
      await fetchAmenities({ page, perPage: rowsPerPage, search });
      showToast(payload?.message ? String(payload.message) : 'Amenity updated successfully.', 'success');
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Update Amenity failed';
      showToast(msg, 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Amenities</Typography>
        </Stack>

        <div>
          <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} variant="contained" onClick={openAddDialog}>
            Add Amenity
          </Button>
        </div>
      </Stack>

      <AmenitiesFilters search={search} onSearchChange={setSearch} />

      {loading ? (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 2 }}>
          <CircularProgress size={22} />
          <Typography variant="body2">Loading Amenities...</Typography>
        </Stack>
      ) : (
               <AmenitiesTable
  count={total}
  page={page}
  rows={rows}
  rowsPerPage={rowsPerPage}
  onPageChange={(_, newPage) => setPage(newPage)}
  onRowsPerPageChange={(e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  }}
  onEdit={(amenity) => openEditDialog(amenity)}
  onDelete={(amenity) => handleDeleteClick(amenity)}
  onToggleStatus={(amenity, nextActive) => void handleToggleStatus(amenity, nextActive)}
/>
      )}

      {/* ✅ Add Amenity Dialog */}
      <Dialog open={addOpen} onClose={closeAddDialog} fullWidth maxWidth="sm">
        <DialogTitle>Add Amenity</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amenity Name"
            fullWidth
            value={newAmenityName}
            onChange={(e) => setNewAmenityName(e.target.value)}
            inputProps={{ maxLength: 256 }}
            disabled={addSubmitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newAmenityName.trim().length > 0 && !addSubmitting) {
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
            disabled={!newAmenityName.trim() || addSubmitting}
            startIcon={addSubmitting ? <CircularProgress size={16} /> : undefined}
          >
            {addSubmitting ? 'Adding...' : 'Add'}
          </Button>
          <Button variant="text" onClick={closeAddDialog} disabled={addSubmitting}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Edit Amenity Dialog */}
      <Dialog open={editOpen} onClose={closeEditDialog} fullWidth maxWidth="sm">
        <DialogTitle>Edit Amenity</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={editAmenityName}
            onChange={(e) => setEditAmenityName(e.target.value)}
            inputProps={{ maxLength: 256 }}
            disabled={editSubmitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && editAmenityName.trim().length > 0 && !editSubmitting) {
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
            disabled={!editAmenityName.trim() || editSubmitting}
            startIcon={editSubmitting ? <CircularProgress size={16} /> : undefined}
          >
            {editSubmitting ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🔴 Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Amenity</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete "{selectedAmenity?.name}"?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => void handleDeleteConfirm()} color="error" variant="contained">
            Delete
          </Button>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
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