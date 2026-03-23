'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import usersImagesUrl from '@/helpers/usersImagesURL';
import { XCircle } from '@phosphor-icons/react/dist/ssr/XCircle';
import IconButton from '@mui/material/IconButton';

// Add/Edit User Modal imports
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import DialogContentText from '@mui/material/DialogContentText';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';

import { UsersFilters } from '@/components/dashboard/user/users-filters';
import { UsersTable } from '@/components/dashboard/user/users-table';

type ApiUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  profile_image: string;
  active: number;
  created_at: string;
  updated_at: string;
  role?: string | null;
  role_name?: string | null;
};

type ApiResponse = {
  success: boolean;
  data: ApiUser[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type UserRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  profile_image: string;
  active: number;
  created_at: string;
  updated_at: string;
  role: string;
  role_name: string;
};

type TableUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  profile_image: string;
  active: number;
  created_at: string;
  updated_at: string;
  role?: string;
  role_name?: string;
};

type ApiBasicResponse = {
  message?: string;
  data?: unknown;
  errors?: Record<string, string[]>;
};

type RoleOption = {
  id: string;
  title: string;
  name: string;
};

type RolesApiItem = {
  id: number | string;
  title?: string;
  name?: string;
};

type RolesApiResponse =
  | {
      success?: boolean;
      data?: RolesApiItem[];
    }
  | RolesApiItem[];

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

// Normalize backend error keys (supports both confirm_password and password_confirmation)
function normalizeErrorKeys(errors?: Record<string, string[]>): Record<string, string> {
  const mapped: Record<string, string> = {};
  if (!errors) return mapped;

  Object.keys(errors).forEach((k) => {
    const first = errors[k]?.[0] ? String(errors[k][0]) : 'Invalid';

    if (k === 'confirm_password') {
      mapped.password_confirmation = first;
      return;
    }

    mapped[k] = first;
  });

  return mapped;
}

export default function Page(): React.JSX.Element {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [search, setSearch] = React.useState('');
  const [rows, setRows] = React.useState<UserRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // permissions
  const [permissionsLoaded, setPermissionsLoaded] = React.useState(false);
  const [userPermissions, setUserPermissions] = React.useState<string[]>([]);

  // Roles
  const [roles, setRoles] = React.useState<RoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = React.useState(false);
  const [selectedRoleId, setSelectedRoleId] = React.useState('');
  const [selectedRoleName, setSelectedRoleName] = React.useState('');

  // Toast
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('');
  const [toastSeverity, setToastSeverity] = React.useState<'success' | 'error' | 'info' | 'warning'>('success');

  // Add dialog state
  const [addOpen, setAddOpen] = React.useState(false);
  const [addSubmitting, setAddSubmitting] = React.useState(false);

  // Edit dialog state
  const [editOpen, setEditOpen] = React.useState(false);
  const [editSubmitting, setEditSubmitting] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserRow | null>(null);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserRow | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false);

  // Shared form state
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordConfirmation, setPasswordConfirmation] = React.useState('');
  const [profileFile, setProfileFile] = React.useState<File | null>(null);

  const [profilePreviewUrl, setProfilePreviewUrl] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

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
    (permission: string) => {
      return userPermissions.includes(permission);
    },
    [userPermissions]
  );

  const canRead = hasPermission('users_read');
  const canCreate = hasPermission('users_create');
  const canUpdate = hasPermission('users_update');
  const canDelete = hasPermission('users_delete');

  React.useEffect(() => {
    if (!profileFile) {
      setProfilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(profileFile);
    setProfilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [profileFile]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setPasswordConfirmation('');
    setProfileFile(null);
    setSelectedRoleId('');
    setSelectedRoleName('');
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const normalizeTableUserToUserRow = React.useCallback(
    (user: TableUser): UserRow => {
      const matchedRole = roles.find(
        (r) => r.name === (user.role_name ?? '') || r.title === (user.role ?? '')
      );

      return {
        id: String(user.id),
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        email: user.email ?? '',
        phone_number: user.phone_number ?? '',
        profile_image: user.profile_image ?? '',
        active: Number(user.active ?? 0),
        created_at: user.created_at ?? '',
        updated_at: user.updated_at ?? '',
        role: user.role ?? matchedRole?.title ?? '',
        role_name: user.role_name ?? matchedRole?.name ?? '',
      };
    },
    [roles]
  );

  const openAddDialog = () => {
    if (!canCreate) {
      showToast('You do not have permission to create users.', 'error');
      return;
    }

    resetForm();
    setAddSubmitting(false);
    setAddOpen(true);
  };

  const closeAddDialog = () => {
    if (addSubmitting) return;
    setAddOpen(false);
  };

  const openEditDialog = (user: TableUser) => {
    if (!canUpdate) {
      showToast('You do not have permission to update users.', 'error');
      return;
    }

    const normalizedUser = normalizeTableUserToUserRow(user);

    setEditingUser(normalizedUser);
    setEditSubmitting(false);
    setEditOpen(true);

    setFirstName(normalizedUser.first_name ?? '');
    setLastName(normalizedUser.last_name ?? '');
    setEmail(normalizedUser.email ?? '');
    setPhone(normalizedUser.phone_number ?? '');
    setPassword('');
    setPasswordConfirmation('');
    setProfileFile(null);
    setFieldErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';

    const matchedRole = roles.find(
      (r) => r.name === (normalizedUser.role_name ?? '') || r.title === (normalizedUser.role ?? '')
    );
    setSelectedRoleId(matchedRole?.id ?? '');
    setSelectedRoleName(matchedRole?.name ?? normalizedUser.role_name ?? '');
  };

  const closeEditDialog = () => {
    if (editSubmitting) return;
    setEditOpen(false);
    setEditingUser(null);
    setFieldErrors({});
  };

  const validateAddForm = () => {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.first_name = 'First name is required';
    if (!lastName.trim()) errors.last_name = 'Second name is required';
    if (!email.trim()) errors.email = 'Email is required';
    if (!selectedRoleId) errors.role_id = 'Role is required';
    if (!password) errors.password = 'Password is required';
    if (!passwordConfirmation) errors.password_confirmation = 'Confirm password is required';

    if (password && passwordConfirmation && password !== passwordConfirmation) {
      errors.password_confirmation = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = () => {
    const errors: Record<string, string> = {};

    if (!editingUser) errors._ = 'No user selected';
    if (!firstName.trim()) errors.first_name = 'First name is required';
    if (!lastName.trim()) errors.last_name = 'Second name is required';
    if (!email.trim()) errors.email = 'Email is required';
    if (!selectedRoleId) errors.role_id = 'Role is required';

    if (password || passwordConfirmation) {
      if (!password) errors.password = 'Password is required';
      if (!passwordConfirmation) errors.password_confirmation = 'Confirm password is required';
      if (password && passwordConfirmation && password !== passwordConfirmation) {
        errors.password_confirmation = 'Passwords do not match';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchRoles = React.useCallback(async () => {
    try {
      setRolesLoading(true);
      if (!apiBase) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');
      const accessToken = getAccessToken();

      const res = await fetch(`${apiBase}/admin/roles`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) throw new Error(`Fetch roles failed. HTTP ${res.status}`);

      const json = (await res.json()) as RolesApiResponse;
      const rawRoles = Array.isArray(json) ? json : (json.data ?? []);

      const mappedRoles: RoleOption[] = rawRoles.map((item) => ({
        id: String(item.id),
        title: String(item.title ?? ''),
        name: String(item.name ?? ''),
      }));

      setRoles(mappedRoles);
    } catch (err) {
      console.error(err);
      setRoles([]);
      showToast(err instanceof Error ? err.message : 'Failed to load roles', 'error');
    } finally {
      setRolesLoading(false);
    }
  }, [apiBase]);

  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      if (!apiBase) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');
      const accessToken = getAccessToken();

      const url =
        `${apiBase}/admin/fetch_users` +
        `?page=${page + 1}` +
        `&per_page=${rowsPerPage}` +
        `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) throw new Error(`Fetch users failed. HTTP ${res.status}`);
      const json = (await res.json()) as ApiResponse;

      const mapped: UserRow[] = (json.data ?? []).map((r) => ({
        id: String(r.id),
        first_name: r.first_name,
        last_name: r.last_name,
        email: r.email,
        phone_number: r.phone_number,
        profile_image: r.profile_image,
        active: r.active,
        created_at: r.created_at,
        updated_at: r.updated_at,
        role: r.role ?? '',
        role_name: r.role_name ?? '',
      }));

      setRows(mapped);
      setTotalCount(json.pagination?.total ?? mapped.length);
    } catch (err) {
      console.error(err);
      setRows([]);
      setTotalCount(0);
      showToast(err instanceof Error ? err.message : 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiBase, page, rowsPerPage, search]);

  React.useEffect(() => {
    if (!permissionsLoaded) return;
    void fetchRoles();
  }, [fetchRoles, permissionsLoaded]);

  React.useEffect(() => {
    if (!permissionsLoaded) return;

    if (!canRead) {
      setLoading(false);
      setRows([]);
      setTotalCount(0);
      return;
    }

    void fetchUsers();
  }, [fetchUsers, permissionsLoaded, canRead]);

  React.useEffect(() => {
    setPage(0);
  }, [search]);

  const handleToggle = async (user: TableUser) => {
    if (!canUpdate) {
      showToast('You do not have permission to update users.', 'error');
      return;
    }

    const normalizedUser = normalizeTableUserToUserRow(user);
    const previous = normalizedUser.active;
    const newStatus = normalizedUser.active === 1 ? 0 : 1;

    try {
      if (!apiBase) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');
      const accessToken = getAccessToken();

      setRows((prev) =>
        prev.map((u) => (u.id === normalizedUser.id ? { ...u, active: newStatus } : u))
      );

      const res = await fetch(`${apiBase}/admin/change_status_user`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          user_id: Number(normalizedUser.id),
          active: newStatus,
        }),
      });

      let payload: ApiBasicResponse | null = null;
      try {
        payload = (await res.json()) as ApiBasicResponse;
      } catch {
        payload = null;
      }

      if (!res.ok) throw new Error(payload?.message ? String(payload.message) : `Status update failed (${res.status})`);

      showToast(payload?.message ? String(payload.message) : 'Status updated successfully', 'success');
    } catch (err) {
      console.error(err);
      setRows((prev) =>
        prev.map((u) => (u.id === normalizedUser.id ? { ...u, active: previous } : u))
      );
      showToast(err instanceof Error ? err.message : 'Status update failed', 'error');
    }
  };

  const handleDeleteClick = (user: TableUser) => {
    if (!canDelete) {
      showToast('You do not have permission to delete users.', 'error');
      return;
    }

    setSelectedUser(normalizeTableUserToUserRow(user));
    setDeleteOpen(true);
    setDeleteSubmitting(false);
  };

  const handleDeleteClose = () => {
    if (deleteSubmitting) return;
    setDeleteOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser || deleteSubmitting) return;

    if (!canDelete) {
      showToast('You do not have permission to delete users.', 'error');
      return;
    }

    try {
      setDeleteSubmitting(true);
      if (!apiBase) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');
      const accessToken = getAccessToken();

      const res = await fetch(`${apiBase}/admin/delete_user`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ user_id: Number(selectedUser.id) }),
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
      setSelectedUser(null);

      await fetchUsers();
      showToast(payload?.message ? String(payload.message) : 'User deleted successfully.', 'success');
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleAddUserConfirm = async () => {
    if (!canCreate) {
      showToast('You do not have permission to create users.', 'error');
      return;
    }

    if (addSubmitting) return;

    const ok = validateAddForm();
    if (!ok) {
      showToast('Please fix the highlighted fields.', 'error');
      return;
    }

    try {
      setAddSubmitting(true);
      if (!apiBase) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');
      const accessToken = getAccessToken();

      const fd = new FormData();
      fd.append('first_name', firstName.trim());
      fd.append('last_name', lastName.trim());
      fd.append('email', email.trim());
      if (phone.trim()) fd.append('phone_number', phone.trim());

      fd.append('password', password);
      fd.append('password_confirmation', passwordConfirmation);

      fd.append('role_id', selectedRoleId);
      fd.append('role_name', selectedRoleName);

      if (profileFile) fd.append('profile_image', profileFile);

      const res = await fetch(`${apiBase}/admin/add_user`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: fd,
      });

      let payload: ApiBasicResponse | null = null;
      try {
        payload = (await res.json()) as ApiBasicResponse;
      } catch {
        payload = null;
      }

      if (!res.ok) {
        if (payload?.errors) setFieldErrors(normalizeErrorKeys(payload.errors));
        const msg =
          payload?.message ||
          (res.status === 409 ? 'User already exists.' : `Add user failed. HTTP ${res.status}`);
        showToast(String(msg), 'error');
        return;
      }

      setAddOpen(false);
      resetForm();
      await fetchUsers();

      showToast(payload?.message ? String(payload.message) : 'User added successfully.', 'success');
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Add user failed', 'error');
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleEditUserConfirm = async () => {
    if (!canUpdate) {
      showToast('You do not have permission to update users.', 'error');
      return;
    }

    if (editSubmitting) return;

    const ok = validateEditForm();
    if (!ok) {
      showToast('Please fix the highlighted fields.', 'error');
      return;
    }

    if (!editingUser) {
      showToast('No user selected.', 'error');
      return;
    }

    try {
      setEditSubmitting(true);
      if (!apiBase) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');
      const accessToken = getAccessToken();

      const fd = new FormData();
      fd.append('user_id', String(editingUser.id));
      fd.append('first_name', firstName.trim());
      fd.append('last_name', lastName.trim());
      fd.append('email', email.trim());
      fd.append('phone_number', phone.trim());

      fd.append('role_id', selectedRoleId);
      fd.append('role_name', selectedRoleName);

      if (password) {
        fd.append('password', password);
        fd.append('password_confirmation', passwordConfirmation);
      }

      if (profileFile) fd.append('profile_image', profileFile);

      const res = await fetch(`${apiBase}/admin/update_user`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: fd,
      });

      let payload: ApiBasicResponse | null = null;
      try {
        payload = (await res.json()) as ApiBasicResponse;
      } catch {
        payload = null;
      }

      if (!res.ok) {
        if (payload?.errors) setFieldErrors(normalizeErrorKeys(payload.errors));

        const msg =
          payload?.message ||
          (res.status === 409 ? 'This user already exists.' : `Update failed. HTTP ${res.status}`);

        showToast(String(msg), 'error');
        return;
      }

      setEditOpen(false);
      setEditingUser(null);
      resetForm();

      await fetchUsers();
      showToast(payload?.message ? String(payload.message) : 'User updated successfully.', 'success');
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  const removeSelectedImage = () => {
    setProfileFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId);
    const foundRole = roles.find((r) => r.id === roleId);
    setSelectedRoleName(foundRole?.name ?? '');
    setFieldErrors((prev) => ({ ...prev, role_id: '' }));
  };

  const currentPreviewSrc = React.useMemo(() => {
    if (profilePreviewUrl) return profilePreviewUrl;
    if (editOpen && editingUser?.profile_image) return usersImagesUrl(editingUser.profile_image);
    return usersImagesUrl('default_user.avif');
  }, [profilePreviewUrl, editOpen, editingUser]);

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
        <Typography variant="h4">Users</Typography>
        <Alert severity="error" variant="filled">
          You do not have permission to view users.
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Users</Typography>
        </Stack>

        {canCreate ? (
          <div>
            <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} variant="contained" onClick={openAddDialog}>
              Add User
            </Button>
          </div>
        ) : null}
      </Stack>

      <UsersFilters search={search} onSearchChange={setSearch} />

      {loading ? (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 2 }}>
          <CircularProgress size={22} />
          <Typography variant="body2">Loading Users...</Typography>
        </Stack>
      ) : (
        <UsersTable
          count={totalCount}
          page={page}
          rows={rows}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          onEdit={canUpdate ? (user) => openEditDialog(user) : undefined}
          onDelete={canDelete ? (user) => handleDeleteClick(user) : undefined}
          onToggle={canUpdate ? handleToggle : undefined}
        />
      )}

      <Dialog open={addOpen} onClose={closeAddDialog} fullWidth maxWidth="sm">
        <DialogTitle>Add User</DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              fullWidth
              disabled={addSubmitting}
              error={Boolean(fieldErrors.first_name)}
              helperText={fieldErrors.first_name || ''}
            />

            <TextField
              label="Second Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              fullWidth
              disabled={addSubmitting}
              error={Boolean(fieldErrors.last_name)}
              helperText={fieldErrors.last_name || ''}
            />

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              disabled={addSubmitting}
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email || ''}
            />

            <TextField
              label="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
              disabled={addSubmitting}
              error={Boolean(fieldErrors.phone_number)}
              helperText={fieldErrors.phone_number || ''}
            />

            <FormControl fullWidth error={Boolean(fieldErrors.role_id)} disabled={addSubmitting || rolesLoading}>
              <InputLabel id="add-role-label">Role</InputLabel>
              <Select
                labelId="add-role-label"
                value={selectedRoleId}
                label="Role"
                onChange={(e) => handleRoleChange(String(e.target.value))}
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.title}
                  </MenuItem>
                ))}
              </Select>
              {fieldErrors.role_id ? (
                <Typography variant="caption" color="error" sx={{ mt: 0.75, ml: 1.75 }}>
                  {fieldErrors.role_id}
                </Typography>
              ) : null}
            </FormControl>

            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontSize: 16, color: '#667085' }}>
                Profile Picture
              </Typography>

              <Stack
                direction="row"
                spacing={3}
                sx={{
                  alignItems: 'center',
                  border: '1px solid rgba(0,0,0,0.22)',
                  borderRadius: '10px',
                  p: 2,
                }}
              >
                <Stack sx={{ width: '50%', alignItems: 'center', justifyContent: 'center' }}>
                  <Box
                    component="img"
                    src={currentPreviewSrc}
                    alt="Profile Preview"
                    sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 2 }}
                  />
                </Stack>

                <Stack spacing={1} sx={{ width: '50%', justifyContent: 'center' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Button variant="outlined" component="label" disabled={addSubmitting} fullWidth>
                      {profileFile ? 'Change Image' : 'Upload Image'}
                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setProfileFile(file);
                          setFieldErrors((prev) => ({ ...prev, profile_image: '' }));
                        }}
                      />
                    </Button>

                    {profileFile ? (
                      <IconButton
                        color="error"
                        disabled={addSubmitting}
                        onClick={removeSelectedImage}
                        sx={{ border: '1px solid rgba(244, 67, 54, 0.4)', borderRadius: 2 }}
                      >
                        <XCircle size={22} weight="fill" />
                      </IconButton>
                    ) : null}
                  </Stack>

                  {fieldErrors.profile_image ? (
                    <Typography variant="caption" color="error">
                      {fieldErrors.profile_image}
                    </Typography>
                  ) : null}
                </Stack>
              </Stack>
            </Stack>

            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              disabled={addSubmitting}
              error={Boolean(fieldErrors.password)}
              helperText={fieldErrors.password || ''}
            />

            <TextField
              label="Confirm Password"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              fullWidth
              disabled={addSubmitting}
              error={Boolean(fieldErrors.password_confirmation)}
              helperText={fieldErrors.password_confirmation || ''}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !addSubmitting) {
                  e.preventDefault();
                  void handleAddUserConfirm();
                }
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="contained"
            onClick={() => void handleAddUserConfirm()}
            disabled={addSubmitting}
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
        <DialogTitle>Edit User</DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              fullWidth
              disabled={editSubmitting}
              error={Boolean(fieldErrors.first_name)}
              helperText={fieldErrors.first_name || ''}
            />

            <TextField
              label="Second Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              fullWidth
              disabled={editSubmitting}
              error={Boolean(fieldErrors.last_name)}
              helperText={fieldErrors.last_name || ''}
            />

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              disabled={editSubmitting}
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email || ''}
            />

            <TextField
              label="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
              disabled={editSubmitting}
              error={Boolean(fieldErrors.phone_number)}
              helperText={fieldErrors.phone_number || ''}
            />

            <FormControl fullWidth error={Boolean(fieldErrors.role_id)} disabled={editSubmitting || rolesLoading}>
              <InputLabel id="edit-role-label">Role</InputLabel>
              <Select
                labelId="edit-role-label"
                value={selectedRoleId}
                label="Role"
                onChange={(e) => handleRoleChange(String(e.target.value))}
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.title}
                  </MenuItem>
                ))}
              </Select>
              {fieldErrors.role_id ? (
                <Typography variant="caption" color="error" sx={{ mt: 0.75, ml: 1.75 }}>
                  {fieldErrors.role_id}
                </Typography>
              ) : null}
            </FormControl>

            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontSize: 16, color: '#667085' }}>
                Profile Picture
              </Typography>

              <Stack
                direction="row"
                spacing={3}
                sx={{
                  alignItems: 'center',
                  border: '1px solid rgba(0,0,0,0.22)',
                  borderRadius: '10px',
                  p: 2,
                }}
              >
                <Stack sx={{ width: '50%', alignItems: 'center', justifyContent: 'center' }}>
                  <Box
                    component="img"
                    src={currentPreviewSrc}
                    alt="Profile Preview"
                    sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 2 }}
                  />
                </Stack>

                <Stack spacing={1} sx={{ width: '50%', justifyContent: 'center' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Button variant="outlined" component="label" disabled={editSubmitting} fullWidth>
                      {profileFile ? 'Change Image' : 'Upload Image'}
                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setProfileFile(file);
                          setFieldErrors((prev) => ({ ...prev, profile_image: '' }));
                        }}
                      />
                    </Button>

                    {profileFile ? (
                      <IconButton
                        color="error"
                        disabled={editSubmitting}
                        onClick={removeSelectedImage}
                        sx={{ border: '1px solid rgba(244, 67, 54, 0.4)', borderRadius: 2 }}
                      >
                        <XCircle size={22} weight="fill" />
                      </IconButton>
                    ) : null}
                  </Stack>

                  {fieldErrors.profile_image ? (
                    <Typography variant="caption" color="error">
                      {fieldErrors.profile_image}
                    </Typography>
                  ) : null}
                </Stack>
              </Stack>
            </Stack>

            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              disabled={editSubmitting}
              error={Boolean(fieldErrors.password)}
              helperText={fieldErrors.password || ''}
            />

            <TextField
              label="Confirm Password"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              fullWidth
              disabled={editSubmitting}
              error={Boolean(fieldErrors.password_confirmation)}
              helperText={fieldErrors.password_confirmation || ''}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !editSubmitting) {
                  e.preventDefault();
                  void handleEditUserConfirm();
                }
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="contained"
            onClick={() => void handleEditUserConfirm()}
            disabled={editSubmitting}
            startIcon={editSubmitting ? <CircularProgress size={16} /> : undefined}
          >
            {editSubmitting ? 'Saving...' : 'Save'}
          </Button>

          <Button variant="text" onClick={closeEditDialog} disabled={editSubmitting}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={handleDeleteClose}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{selectedUser?.first_name} {selectedUser?.last_name}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => void handleDeleteConfirm()}
            color="error"
            variant="contained"
            disabled={deleteSubmitting}
            startIcon={deleteSubmitting ? <CircularProgress size={16} /> : undefined}
          >
            {deleteSubmitting ? 'Deleting...' : 'Delete'}
          </Button>
          <Button onClick={handleDeleteClose} disabled={deleteSubmitting}>
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