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

import { EmployeesFilters } from '@/components/dashboard/employees/employees-filters';
import { EmployeesTable } from '@/components/dashboard/employees/employees-table';

type ApiEmployee = {
  id: number;
  name: string;
  email: string;
  department: string | null;
  position: string | null;
  phone: string | null;
  whatsapp: string | null;
  profile_picture: string | null;
  active: number;
  created_at: string | null;
};

type ApiResponse = {
  success: boolean;
  data: ApiEmployee[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type EmployeeRow = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  position: string | null;
  phone: string | null;
  whatsapp: string | null;
  profile_picture: string | null;
  active: number;
  created_at: string | null;
};

type ApiBasicResponse = {
  message?: string;
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

export default function Page(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [search, setSearch] = React.useState('');
  const [rows, setRows] = React.useState<EmployeeRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const [permissionsLoaded, setPermissionsLoaded] = React.useState(false);
  const [userPermissions, setUserPermissions] = React.useState<string[]>([]);

  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('');
  const [toastSeverity, setToastSeverity] = React.useState<'success' | 'error'>('success');

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const showToast = React.useCallback((message: string, severity: 'success' | 'error') => {
    setToastMsg(message);
    setToastSeverity(severity);
    setToastOpen(true);
  }, []);

  const getAdminPayload = (): AdminPayload => {
    const payloadStr = localStorage.getItem('admin_login_payload');
    if (!payloadStr) throw new Error('admin_login_payload not found');

    try {
      return JSON.parse(payloadStr) as AdminPayload;
    } catch {
      throw new Error('admin_login_payload is not valid JSON');
    }
  };

  const getAccessToken = (): string => {
    const payload = getAdminPayload();
    if (!payload?.access_token) throw new Error('access_token missing');
    return String(payload.access_token);
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

  const canRead = hasPermission('employees_read');
  const canCreate = hasPermission('employees_create');
  const canUpdate = hasPermission('employees_update');

  React.useEffect(() => {
    const toast = searchParams.get('toast');
    const msg = searchParams.get('msg');

    if (toast && msg) {
      showToast(decodeURIComponent(msg), toast === 'success' ? 'success' : 'error');
      router.replace('/dashboard/employees');
    }
  }, [router, searchParams, showToast]);

  const fetchEmployees = React.useCallback(async () => {
    try {
      setLoading(true);

      if (!apiBase) throw new Error('API base missing');

      const accessToken = getAccessToken();

      const url =
        `${apiBase}/admin/fetch_employees` +
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

      const mapped: EmployeeRow[] = (json.data ?? []).map((r) => ({
        id: String(r.id),
        name: r.name,
        email: r.email,
        department: r.department ?? null,
        position: r.position ?? null,
        phone: r.phone ?? null,
        whatsapp: r.whatsapp ?? null,
        profile_picture: r.profile_picture ?? null,
        active: Number(r.active ?? 0),
        created_at: r.created_at ?? null,
      }));

      setRows(mapped);
      setTotalCount(json.pagination?.total ?? mapped.length);
    } catch (err) {
      console.error(err);
      setRows([]);
      setTotalCount(0);
      showToast(err instanceof Error ? err.message : 'Fetch failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiBase, page, rowsPerPage, search, showToast]);

  React.useEffect(() => {
    if (!permissionsLoaded) return;

    if (!canRead) {
      setLoading(false);
      setRows([]);
      setTotalCount(0);
      return;
    }

    void fetchEmployees();
  }, [fetchEmployees, permissionsLoaded, canRead]);

  React.useEffect(() => {
    setPage(0);
  }, [search]);

  const handleEditEmployee = (employee: EmployeeRow) => {
    if (!canUpdate) {
      showToast('You do not have permission to update employees.', 'error');
      return;
    }

    router.push(`/dashboard/employees/${employee.id}/edit`);
  };

  const handleToggleEmployee = async (employee: EmployeeRow, active: 0 | 1) => {
    if (!canUpdate) {
      showToast('You do not have permission to update employees.', 'error');
      return;
    }

    const previous = employee.active;

    try {
      if (!apiBase) throw new Error('API base missing');
      const accessToken = getAccessToken();

      setRows((prev) => prev.map((d) => (d.id === employee.id ? { ...d, active } : d)));

      const endpoint = `${apiBase}/admin/change_status_employee`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          employee_id: Number(employee.id),
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

      showToast(payload?.message || 'Employee status updated successfully', 'success');
    } catch (err) {
      console.error(err);

      setRows((prev) =>
        prev.map((d) => (d.id === employee.id ? { ...d, active: previous } : d))
      );

      showToast(err instanceof Error ? err.message : 'Status update failed', 'error');
    }
  };

  if (!permissionsLoaded) {
    return (
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={20} />
          <Typography>Checking permissions...</Typography>
        </Stack>
      </Stack>
    );
  }

  if (!canRead) {
    return (
      <Stack spacing={3}>
        <Typography variant="h4">Employees</Typography>
        <Alert severity="error" variant="filled">
          You do not have permission to view employees.
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Employees</Typography>

        {canCreate ? (
          <Button
            startIcon={<PlusIcon />}
            variant="contained"
            onClick={() => router.push('/dashboard/employees/new')}
          >
            Add Employee
          </Button>
        ) : null}
      </Stack>

      <EmployeesFilters search={search} onSearchChange={setSearch} />

      {loading ? (
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={20} />
          <Typography>Loading Employees...</Typography>
        </Stack>
      ) : (
        <EmployeesTable
          count={totalCount}
          page={page}
          rows={rows}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          onToggle={canUpdate ? handleToggleEmployee : undefined}
          onEdit={canUpdate ? handleEditEmployee : undefined}
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