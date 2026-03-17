'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';

type ApiBasicResponse = {
  message?: string;
  errors?: Record<string, string[]>;
  data?: unknown;
  positions?: unknown;
  departments?: unknown;
  crm_agents?: unknown;
};

type OptionItem = {
  id: string;
  label: string;
};

type FormErrors = {
  name?: string;
  slug?: string;
  position_id?: string;
  department_id?: string;
  crm_name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  linkedin?: string;
  orn?: string;
  sorting?: string;
  brn?: string;
  experience_since?: string;
  description?: string;
  profile_picture?: string;
};

type CkEditorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  minHeight?: number;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 256);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isHtmlEmpty(value: string | null | undefined): boolean {
  if (!value) return true;
  const stripped = value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return stripped.length === 0;
}

function CkEditorField({
  label,
  value,
  onChange,
  error = false,
  helperText = '',
  minHeight = 180,
}: CkEditorFieldProps): React.JSX.Element {
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{label}</Typography>

      <Box
        sx={{
          '& .ck.ck-editor': {
            width: '100%',
          },
          '& .ck-editor__editable_inline': {
            minHeight: `${minHeight}px`,
          },
          '& .ck.ck-toolbar': {
            borderColor: error ? '#d32f2f' : 'rgba(0,0,0,0.23)',
          },
          '& .ck.ck-editor__main > .ck-editor__editable': {
            borderColor: error ? '#d32f2f' : 'rgba(0,0,0,0.23)',
          },
        }}
      >
        <CKEditor
          editor={ClassicEditor}
          data={value || ''}
          onChange={(_, editor) => {
            onChange(editor.getData());
          }}
        />
      </Box>

      {helperText ? (
        <Typography variant="caption" color={error ? 'error' : 'text.secondary'}>
          {helperText}
        </Typography>
      ) : null}
    </Stack>
  );
}

function normalizeOptions(
  payload: unknown,
  type: 'position' | 'department' | 'crm_agent'
): OptionItem[] {
  let rawList: unknown[] = [];

  if (Array.isArray(payload)) {
    rawList = payload;
  } else if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const dataObj =
      obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : null;

    if (Array.isArray(obj.data)) {
      rawList = obj.data;
    } else if (type === 'position' && Array.isArray(obj.positions)) {
      rawList = obj.positions;
    } else if (type === 'department' && Array.isArray(obj.departments)) {
      rawList = obj.departments;
    } else if (type === 'crm_agent' && Array.isArray(obj.crm_agents)) {
      rawList = obj.crm_agents;
    } else if (type === 'position' && dataObj && Array.isArray(dataObj.positions)) {
      rawList = dataObj.positions;
    } else if (type === 'department' && dataObj && Array.isArray(dataObj.departments)) {
      rawList = dataObj.departments;
    } else if (type === 'crm_agent' && dataObj && Array.isArray(dataObj.crm_agents)) {
      rawList = dataObj.crm_agents;
    } else if (type === 'crm_agent' && dataObj && Array.isArray(dataObj.agents)) {
      rawList = dataObj.agents;
    }
  }

  return rawList
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      const obj = item as Record<string, unknown>;

      const id =
        obj.id ??
        obj.agent_id ??
        obj.user_id ??
        obj.crm_id ??
        obj.name ??
        obj.title;

      const label =
        typeof obj.title === 'string' && obj.title.trim() !== ''
          ? obj.title
          : typeof obj.name === 'string' && obj.name.trim() !== ''
            ? obj.name
            : typeof obj.position === 'string' && obj.position.trim() !== ''
              ? obj.position
              : typeof obj.department === 'string' && obj.department.trim() !== ''
                ? obj.department
                : typeof obj.crm_name === 'string' && obj.crm_name.trim() !== ''
                  ? obj.crm_name
                  : typeof obj.label === 'string' && obj.label.trim() !== ''
                    ? obj.label
                    : '';

      if (
        (typeof id !== 'string' && typeof id !== 'number') ||
        typeof label !== 'string' ||
        !label
      ) {
        return null;
      }

      return {
        id: String(id),
        label,
      };
    })
    .filter((item): item is OptionItem => item !== null);
}

export default function NewEmployeePage(): React.JSX.Element {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const CREATE_ENDPOINT = `${apiBase}/admin/create_employee`;
  const FETCH_POSITIONS_ENDPOINT = `${apiBase}/admin/fetch_position`;
  const FETCH_DEPARTMENTS_ENDPOINT = `${apiBase}/admin/fetch_departments`;
  const FETCH_CRM_AGENTS_ENDPOINT = `${apiBase}/admin/fetch_crm_agents`;

  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);

  const [positionId, setPositionId] = React.useState('');
  const [positionName, setPositionName] = React.useState('');

  const [departmentId, setDepartmentId] = React.useState('');
  const [departmentName, setDepartmentName] = React.useState('');

  const [crmName, setCrmName] = React.useState('');

  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [whatsapp, setWhatsapp] = React.useState('');
  const [linkedin, setLinkedin] = React.useState('');
  const [orn, setOrn] = React.useState('');
  const [sorting, setSorting] = React.useState('');
  const [brn, setBrn] = React.useState('');
  const [experienceSince, setExperienceSince] = React.useState('');
  const [description, setDescription] = React.useState('');

  const [isDirector, setIsDirector] = React.useState<0 | 1>(0);
  const [inContactPage, setInContactPage] = React.useState<0 | 1>(0);
  const [isAgent, setIsAgent] = React.useState<0 | 1>(0);
  const [active, setActive] = React.useState<0 | 1>(1);

  const [profilePictureFile, setProfilePictureFile] = React.useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = React.useState<string | null>(null);
  const profilePictureInputRef = React.useRef<HTMLInputElement | null>(null);

  const [positions, setPositions] = React.useState<OptionItem[]>([]);
  const [departments, setDepartments] = React.useState<OptionItem[]>([]);
  const [crmAgents, setCrmAgents] = React.useState<OptionItem[]>([]);
  const [loadingMeta, setLoadingMeta] = React.useState(true);

  const [saving, setSaving] = React.useState(false);

  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('');
  const [toastSeverity, setToastSeverity] = React.useState<'success' | 'error'>('success');

  const [errors, setErrors] = React.useState<FormErrors>({});

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

  const firstError = (apiErrors?: Record<string, string[]>) => {
    if (!apiErrors) return null;
    const key = Object.keys(apiErrors)[0];
    const msg = key ? apiErrors[key]?.[0] : null;
    return msg || null;
  };

  React.useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(slugify(name));
      setErrors((prev) => ({ ...prev, slug: undefined }));
    }
  }, [name, slugManuallyEdited]);

  React.useEffect(() => {
    if (!profilePictureFile) {
      setProfilePicturePreview(null);
      return;
    }

    const url = URL.createObjectURL(profilePictureFile);
    setProfilePicturePreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [profilePictureFile]);

  React.useEffect(() => {
    const loadMeta = async () => {
      if (!apiBase) {
        showToast('API base missing', 'error');
        return;
      }

      try {
        setLoadingMeta(true);
        const accessToken = getAccessToken();

        const [positionsRes, departmentsRes, crmAgentsRes] = await Promise.all([
          fetch(FETCH_POSITIONS_ENDPOINT, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          }),
          fetch(FETCH_DEPARTMENTS_ENDPOINT, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          }),
          fetch(FETCH_CRM_AGENTS_ENDPOINT, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          }),
        ]);

        if (!positionsRes.ok) {
          throw new Error(`Positions fetch failed (${positionsRes.status})`);
        }

        if (!departmentsRes.ok) {
          throw new Error(`Departments fetch failed (${departmentsRes.status})`);
        }

        if (!crmAgentsRes.ok) {
          throw new Error(`CRM agents fetch failed (${crmAgentsRes.status})`);
        }

        const positionsJson = (await positionsRes.json()) as ApiBasicResponse | unknown;
        const departmentsJson = (await departmentsRes.json()) as ApiBasicResponse | unknown;
        const crmAgentsJson = (await crmAgentsRes.json()) as ApiBasicResponse | unknown;

        setPositions(normalizeOptions(positionsJson, 'position'));
        setDepartments(normalizeOptions(departmentsJson, 'department'));
        setCrmAgents(normalizeOptions(crmAgentsJson, 'crm_agent'));
      } catch (err) {
        console.error(err);
        showToast(
          err instanceof Error ? err.message : 'Failed to load positions/departments/crm agents',
          'error'
        );
      } finally {
        setLoadingMeta(false);
      }
    };

    void loadMeta();
  }, [
    apiBase,
    FETCH_POSITIONS_ENDPOINT,
    FETCH_DEPARTMENTS_ENDPOINT,
    FETCH_CRM_AGENTS_ENDPOINT,
    showToast,
  ]);

  const removeProfilePicture = () => {
    setProfilePictureFile(null);
    if (profilePictureInputRef.current) profilePictureInputRef.current.value = '';
    setErrors((prev) => ({ ...prev, profile_picture: undefined }));
  };

  const validate = (): {
    ok: boolean;
    clean: {
      name: string;
      slug: string;
      position_id: string;
      position: string;
      department_id: string;
      department: string;
      crm_name: string;
      email: string;
      phone: string;
      whatsapp: string;
      linkedin: string;
      orn: string;
      sorting: string;
      brn: string;
      experience_since: string;
      description: string;
    };
  } => {
    const cleanName = name.trim();
    const cleanSlug = slugify(slug);
    const cleanPositionId = positionId.trim();
    const cleanPositionName = positionName.trim();
    const cleanDepartmentId = departmentId.trim();
    const cleanDepartmentName = departmentName.trim();
    const cleanCrmName = crmName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const cleanWhatsapp = whatsapp.trim();
    const cleanLinkedin = linkedin.trim();
    const cleanOrn = orn.trim();
    const cleanSorting = sorting.trim();
    const cleanBrn = brn.trim();
    const cleanExperienceSince = experienceSince.trim();
    const cleanDescription = description;

    const nextErrors: FormErrors = {};

    if (!cleanName) nextErrors.name = 'Name is required';
    if (!cleanSlug) nextErrors.slug = 'Slug is required';
    if (!cleanPositionId) nextErrors.position_id = 'Position is required';
    if (!cleanDepartmentId) nextErrors.department_id = 'Department is required';

    if (cleanEmail && !isValidEmail(cleanEmail)) {
      nextErrors.email = 'Email is not valid';
    }

    if (cleanLinkedin && !isValidUrl(cleanLinkedin)) {
      nextErrors.linkedin = 'LinkedIn URL is not valid';
    }

    if (cleanSorting && Number.isNaN(Number(cleanSorting))) {
      nextErrors.sorting = 'Sorting must be a number';
    }

    if (cleanExperienceSince && Number.isNaN(Number(cleanExperienceSince))) {
      nextErrors.experience_since = 'Experience Since must be a number';
    }

    if (cleanOrn && Number.isNaN(Number(cleanOrn))) {
      nextErrors.orn = 'ORN must be a number';
    }

    if (cleanBrn && Number.isNaN(Number(cleanBrn))) {
      nextErrors.brn = 'BRN must be a number';
    }

    if (isHtmlEmpty(cleanDescription)) {
      nextErrors.description = 'Description is required';
    }

    setErrors(nextErrors);

    return {
      ok: Object.keys(nextErrors).length === 0,
      clean: {
        name: cleanName,
        slug: cleanSlug,
        position_id: cleanPositionId,
        position: cleanPositionName,
        department_id: cleanDepartmentId,
        department: cleanDepartmentName,
        crm_name: cleanCrmName,
        email: cleanEmail,
        phone: cleanPhone,
        whatsapp: cleanWhatsapp,
        linkedin: cleanLinkedin,
        orn: cleanOrn,
        sorting: cleanSorting,
        brn: cleanBrn,
        experience_since: cleanExperienceSince,
        description: cleanDescription,
      },
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiBase) {
      showToast('API base missing', 'error');
      return;
    }

    const { ok, clean } = validate();

    if (!ok) {
      showToast('Please fix the highlighted fields.', 'error');
      return;
    }

    try {
      setSaving(true);

      const accessToken = getAccessToken();
      const formData = new FormData();

      formData.append('name', clean.name);
      formData.append('slug', clean.slug);
      formData.append('position_id', clean.position_id);
      formData.append('position', clean.position);
      formData.append('department_id', clean.department_id);
      formData.append('department', clean.department);
      formData.append('crm_name', clean.crm_name);
      formData.append('email', clean.email);
      formData.append('phone', clean.phone);
      formData.append('whatsapp', clean.whatsapp);
      formData.append('linkedin', clean.linkedin);
      formData.append('orn', clean.orn);
      formData.append('sorting', clean.sorting);
      formData.append('brn', clean.brn);
      formData.append('experience_since', clean.experience_since);
      formData.append('description', clean.description);

      formData.append('is_director', String(isDirector));
      formData.append('in_contact_page', String(inContactPage));
      formData.append('is_agent', String(isAgent));
      formData.append('active', String(active));

      if (profilePictureFile) {
        formData.append('profile_picture', profilePictureFile);
      }

      const res = await fetch(CREATE_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      let payload: ApiBasicResponse | null = null;

      try {
        payload = (await res.json()) as ApiBasicResponse;
      } catch {
        payload = null;
      }

      if (!res.ok) {
        const msg =
          payload?.message ||
          firstError(payload?.errors) ||
          `Create Employee failed (${res.status})`;
        throw new Error(msg);
      }

      const msg = payload?.message || 'Employee created successfully';
      router.push(`/dashboard/employees?toast=success&msg=${encodeURIComponent(msg)}`);
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Create Employee failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Add Employee</Typography>

        <Button variant="outlined" onClick={() => router.push('/dashboard/employees')}>
          Back
        </Button>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
          {loadingMeta ? (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2">
                Loading positions, departments and CRM agents...
              </Typography>
            </Stack>
          ) : null}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Name *"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                fullWidth
                error={Boolean(errors.name)}
                helperText={errors.name || ''}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Slug *"
                value={slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setSlug(e.target.value);
                  setErrors((prev) => ({ ...prev, slug: undefined }));
                }}
                onBlur={() => setSlug((s) => slugify(s))}
                fullWidth
                error={Boolean(errors.slug)}
                helperText={errors.slug || 'Auto-generated from name, but you can edit it.'}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                label="Position *"
                value={positionId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selected = positions.find((item) => item.id === selectedId);

                  setPositionId(selectedId);
                  setPositionName(selected?.label ?? '');
                  setErrors((prev) => ({ ...prev, position_id: undefined }));
                }}
                fullWidth
                error={Boolean(errors.position_id)}
                helperText={errors.position_id || ''}
              >
                <MenuItem value="">Select Position</MenuItem>
                {positions.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                label="Department *"
                value={departmentId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selected = departments.find((item) => item.id === selectedId);

                  setDepartmentId(selectedId);
                  setDepartmentName(selected?.label ?? '');
                  setErrors((prev) => ({ ...prev, department_id: undefined }));
                }}
                fullWidth
                error={Boolean(errors.department_id)}
                helperText={errors.department_id || ''}
              >
                <MenuItem value="">Select Department</MenuItem>
                {departments.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                label="CRM Agent"
                value={crmName}
                onChange={(e) => {
                  setCrmName(e.target.value);
                  setErrors((prev) => ({ ...prev, crm_name: undefined }));
                }}
                fullWidth
                error={Boolean(errors.crm_name)}
                helperText={errors.crm_name || ''}
              >
                <MenuItem value="">Select CRM Agent</MenuItem>
                {crmAgents.map((item) => (
                  <MenuItem key={item.id} value={item.label}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                fullWidth
                error={Boolean(errors.email)}
                helperText={errors.email || ''}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                fullWidth
                error={Boolean(errors.phone)}
                helperText={errors.phone || ''}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="WhatsApp"
                value={whatsapp}
                onChange={(e) => {
                  setWhatsapp(e.target.value);
                  setErrors((prev) => ({ ...prev, whatsapp: undefined }));
                }}
                fullWidth
                error={Boolean(errors.whatsapp)}
                helperText={errors.whatsapp || ''}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="LinkedIn URL"
                value={linkedin}
                onChange={(e) => {
                  setLinkedin(e.target.value);
                  setErrors((prev) => ({ ...prev, linkedin: undefined }));
                }}
                fullWidth
                error={Boolean(errors.linkedin)}
                helperText={errors.linkedin || ''}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="ORN"
                type="number"
                value={orn}
                onChange={(e) => {
                  setOrn(e.target.value);
                  setErrors((prev) => ({ ...prev, orn: undefined }));
                }}
                fullWidth
                error={Boolean(errors.orn)}
                helperText={errors.orn || ''}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="BRN"
                type="number"
                value={brn}
                onChange={(e) => {
                  setBrn(e.target.value);
                  setErrors((prev) => ({ ...prev, brn: undefined }));
                }}
                fullWidth
                error={Boolean(errors.brn)}
                helperText={errors.brn || ''}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Sorting"
                type="number"
                value={sorting}
                onChange={(e) => {
                  setSorting(e.target.value);
                  setErrors((prev) => ({ ...prev, sorting: undefined }));
                }}
                fullWidth
                error={Boolean(errors.sorting)}
                helperText={errors.sorting || ''}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Experience Since"
                type="number"
                value={experienceSince}
                onChange={(e) => {
                  setExperienceSince(e.target.value);
                  setErrors((prev) => ({ ...prev, experience_since: undefined }));
                }}
                fullWidth
                error={Boolean(errors.experience_since)}
                helperText={errors.experience_since || 'Example: 2018'}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <CkEditorField
                label="Description"
                value={description}
                onChange={(value) => {
                  setDescription(value);
                  setErrors((prev) => ({ ...prev, description: undefined }));
                }}
                error={Boolean(errors.description)}
                helperText={errors.description || ''}
                minHeight={220}
              />
            </Grid>
          </Grid>

          <Stack spacing={1}>
            <Typography variant="subtitle2">Profile Picture</Typography>

            {profilePicturePreview ? (
              <Box
                sx={{
                  width: 220,
                  height: 220,
                  borderRadius: 2,
                  border: '1px solid rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fafafa',
                }}
              >
                <img
                  src={profilePicturePreview}
                  alt="Profile preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            ) : null}

            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" component="label" disabled={saving}>
                Upload Profile Picture
                <input
                  ref={profilePictureInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setProfilePictureFile(file);
                    setErrors((prev) => ({ ...prev, profile_picture: undefined }));
                    e.currentTarget.value = '';
                  }}
                />
              </Button>

              {profilePictureFile && (
                <Button variant="text" color="error" onClick={removeProfilePicture} disabled={saving}>
                  Remove
                </Button>
              )}

              {profilePictureFile ? (
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {profilePictureFile.name}
                </Typography>
              ) : null}
            </Stack>

            {errors.profile_picture && (
              <Typography color="error" variant="caption">
                {errors.profile_picture}
              </Typography>
            )}
          </Stack>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isDirector === 1}
                    onChange={(e) => setIsDirector(e.target.checked ? 1 : 0)}
                  />
                }
                label={isDirector === 1 ? 'Director: Yes' : 'Director: No'}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={inContactPage === 1}
                    onChange={(e) => setInContactPage(e.target.checked ? 1 : 0)}
                  />
                }
                label={inContactPage === 1 ? 'Show in Contact Page' : 'Hide from Contact Page'}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isAgent === 1}
                    onChange={(e) => setIsAgent(e.target.checked ? 1 : 0)}
                  />
                }
                label={isAgent === 1 ? 'Agent: Yes' : 'Agent: No'}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={active === 1}
                    onChange={(e) => setActive(e.target.checked ? 1 : 0)}
                  />
                }
                label={active === 1 ? 'Active' : 'Inactive'}
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center">
            <Button
              variant="outlined"
              type="button"
              onClick={() => router.push('/dashboard/employees')}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button variant="contained" type="submit" disabled={saving || loadingMeta}>
              {saving ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={18} />
                  <span>Saving...</span>
                </Stack>
              ) : (
                'Create Employee'
              )}
            </Button>
          </Stack>
        </Stack>
      </Paper>

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