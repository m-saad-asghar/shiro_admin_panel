'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';

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

type ApiBasicResponse = {
  message?: string;
  errors?: Record<string, string[]>;
  data?: any;
};

type FormErrors = {
  name?: string;
  slug?: string;
  email?: string; // optional
  description?: string;
  logo?: string;
  thumbnail?: string;
};

type DeveloperApi = {
  id: number | string;
  name: string;
  slug: string;
  email: string | null;
  description: string | null;
  active: number; // 1/0
  logo: string | null; // filename only
  thumbnail: string | null; // filename only
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

// Since you store filename only and saved openly in /storage/
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL?.replace(/\/$/, '') || '';
function storageUrl(fileName?: string | null): string | null {
  if (!fileName) return null;
  if (fileName.startsWith('http')) return fileName; // just in case
  return `${IMAGE_BASE_URL}/${fileName}`;
}

export default function EditDeveloperPage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams();

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const developerId = String((params as any)?.id ?? '');

  // ✅ CHANGE ONLY THESE IF YOUR BACKEND ROUTES DIFFER
  const GET_ENDPOINT = `${apiBase}/admin/get_developer?developer_id=${encodeURIComponent(developerId)}`;
  const UPDATE_ENDPOINT = `${apiBase}/admin/update_developer`;

  const [loading, setLoading] = React.useState(true);

  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);

  const [email, setEmail] = React.useState(''); // optional
  const [description, setDescription] = React.useState(''); // required

  const [active, setActive] = React.useState<0 | 1>(1);

  // Existing images (filenames from DB)
  const [existingLogo, setExistingLogo] = React.useState<string | null>(null);
  const [existingThumb, setExistingThumb] = React.useState<string | null>(null);

  // Flags if user removed existing image
  const [removeExistingLogo, setRemoveExistingLogo] = React.useState(false);
  const [removeExistingThumb, setRemoveExistingThumb] = React.useState(false);

  // New uploads
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [thumbFile, setThumbFile] = React.useState<File | null>(null);

  // New previews
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [thumbPreview, setThumbPreview] = React.useState<string | null>(null);

  const logoInputRef = React.useRef<HTMLInputElement | null>(null);
  const thumbInputRef = React.useRef<HTMLInputElement | null>(null);

  const [saving, setSaving] = React.useState(false);

  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('');
  const [toastSeverity, setToastSeverity] = React.useState<'success' | 'error'>('success');

  const [errors, setErrors] = React.useState<FormErrors>({});

  const showToast = (message: string, severity: 'success' | 'error') => {
    setToastMsg(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

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

  // Auto slug from name (until user edits)
  React.useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(slugify(name));
      setErrors((prev) => ({ ...prev, slug: undefined }));
    }
  }, [name, slugManuallyEdited]);

  // New logo preview
  React.useEffect(() => {
    if (!logoFile) {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoFile]);

  // New thumbnail preview
  React.useEffect(() => {
    if (!thumbFile) {
      if (thumbPreview) URL.revokeObjectURL(thumbPreview);
      setThumbPreview(null);
      return;
    }
    const url = URL.createObjectURL(thumbFile);
    setThumbPreview(url);
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thumbFile]);

  // Fetch existing developer
  const fetchDeveloper = React.useCallback(async () => {
    try {
      setLoading(true);
      if (!apiBase) throw new Error('API base missing');
      if (!developerId) throw new Error('Developer id missing');

      const accessToken = getAccessToken();

      const res = await fetch(GET_ENDPOINT, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = (await res.json()) as ApiBasicResponse;

      if (!res.ok) {
        throw new Error(payload?.message || `Fetch failed (${res.status})`);
      }

      const d = payload?.data as DeveloperApi;
      if (!d) throw new Error('Developer not found');

      setName(d.name ?? '');
      setSlug(d.slug ?? '');
      setSlugManuallyEdited(true); // keep DB slug as-is (don’t auto override)
      setEmail(d.email ?? '');
      setDescription(d.description ?? '');
      setActive(Number(d.active ?? 0) === 1 ? 1 : 0);

      setExistingLogo(d.logo ?? null);
      setExistingThumb(d.thumbnail ?? null);
      setRemoveExistingLogo(false);
      setRemoveExistingThumb(false);

      setLogoFile(null);
      setThumbFile(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
      if (thumbInputRef.current) thumbInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Fetch failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiBase, developerId, GET_ENDPOINT]);

  React.useEffect(() => {
    void fetchDeveloper();
  }, [fetchDeveloper]);

  const removeLogo = () => {
    // remove newly selected
    setLogoFile(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
    // remove existing too (so user can truly clear it)
    setRemoveExistingLogo(true);
    setErrors((prev) => ({ ...prev, logo: undefined }));
  };

  const removeThumb = () => {
    setThumbFile(null);
    if (thumbInputRef.current) thumbInputRef.current.value = '';
    setRemoveExistingThumb(true);
    setErrors((prev) => ({ ...prev, thumbnail: undefined }));
  };

  const validate = (): { ok: boolean; clean: { name: string; slug: string; email: string; description: string } } => {
    const cleanName = name.trim();
    const cleanSlug = slugify(slug);
    const cleanEmail = email.trim();
    const cleanDescription = description.trim();

    const nextErrors: FormErrors = {};

    // Required (except email)
    if (!cleanName) nextErrors.name = 'Name is required';
    if (!cleanSlug) nextErrors.slug = 'Slug is required';
    if (!cleanDescription) nextErrors.description = 'Description is required';

    // For EDIT: logo/thumb required only if nothing exists + nothing newly selected
    const hasLogo = (!!logoFile) || (!!existingLogo && !removeExistingLogo);
    const hasThumb = (!!thumbFile) || (!!existingThumb && !removeExistingThumb);

    if (!hasLogo) nextErrors.logo = 'Logo is required';
    if (!hasThumb) nextErrors.thumbnail = 'Thumbnail is required';

    // Email optional; validate only if filled
    if (cleanEmail && !isValidEmail(cleanEmail)) {
      nextErrors.email = 'Email is not valid';
    }

    setErrors(nextErrors);
    const ok = Object.keys(nextErrors).length === 0;

    return { ok, clean: { name: cleanName, slug: cleanSlug, email: cleanEmail, description: cleanDescription } };
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
      formData.append('developer_id', developerId);

      formData.append('name', clean.name);
      formData.append('slug', clean.slug);
      formData.append('email', clean.email); // optional
      formData.append('description', clean.description);
      formData.append('active', String(active));

      // tell backend if user removed existing
      formData.append('remove_logo', removeExistingLogo ? '1' : '0');
      formData.append('remove_thumbnail', removeExistingThumb ? '1' : '0');

      // if new files selected, send them
      if (logoFile) formData.append('logo', logoFile);
      if (thumbFile) formData.append('thumbnail', thumbFile);

      const res = await fetch(UPDATE_ENDPOINT, {
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
          `Update developer failed (${res.status})`;
        throw new Error(msg);
      }

      const msg = payload?.message || 'Developer updated successfully';
      router.push(`/dashboard/developers?toast=success&msg=${encodeURIComponent(msg)}`);
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Update developer failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Stack spacing={2} direction="row" alignItems="center">
        <CircularProgress size={20} />
        <Typography>Loading Developer...</Typography>
      </Stack>
    );
  }

  const existingLogoUrl = !removeExistingLogo ? storageUrl(existingLogo) : null;
  const existingThumbUrl = !removeExistingThumb ? storageUrl(existingThumb) : null;

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Edit Developer</Typography>

        <Button variant="outlined" onClick={() => router.push('/dashboard/developers')}>
          Back
        </Button>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2} component="form" onSubmit={handleSubmit}>
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

          <TextField
            label="Email (optional)"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            fullWidth
            error={Boolean(errors.email)}
            helperText={errors.email || ''}
          />

          <TextField
            label="Description *"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setErrors((prev) => ({ ...prev, description: undefined }));
            }}
            multiline
            minRows={4}
            fullWidth
            error={Boolean(errors.description)}
            helperText={errors.description || ''}
          />

          {/* Logo */}
          <Stack spacing={1}>
            <Typography variant="subtitle2">Logo *</Typography>

            {/* If a new file selected -> show its preview. Else show existing image. */}
            {logoPreview ? (
              <Box
                sx={{
                  width: 220,
                  height: 140,
                  borderRadius: 2,
                  border: '1px solid rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fafafa',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoPreview} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </Box>
            ) : existingLogoUrl ? (
              <Box
                sx={{
                  width: 220,
                  height: 140,
                  borderRadius: 2,
                  border: '1px solid rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fafafa',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={existingLogoUrl} alt="Existing logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </Box>
            ) : null}

            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" component="label" disabled={saving}>
                Upload Logo
                <input
                  ref={logoInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setLogoFile(file);
                    setRemoveExistingLogo(false); // because new file replaces
                    setErrors((prev) => ({ ...prev, logo: undefined }));
                    e.currentTarget.value = '';
                  }}
                />
              </Button>

              {(logoFile || (existingLogo && !removeExistingLogo)) && (
                <Button variant="text" color="error" onClick={removeLogo} disabled={saving}>
                  Remove
                </Button>
              )}

              {logoFile ? (
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {logoFile.name}
                </Typography>
              ) : null}
            </Stack>

            {errors.logo && (
              <Typography color="error" variant="caption">
                {errors.logo}
              </Typography>
            )}
          </Stack>

          {/* Thumbnail */}
          <Stack spacing={1}>
            <Typography variant="subtitle2">Thumbnail *</Typography>

            {thumbPreview ? (
              <Box
                sx={{
                  width: 220,
                  height: 140,
                  borderRadius: 2,
                  border: '1px solid rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fafafa',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbPreview} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            ) : existingThumbUrl ? (
              <Box
                sx={{
                  width: 220,
                  height: 140,
                  borderRadius: 2,
                  border: '1px solid rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fafafa',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={existingThumbUrl} alt="Existing thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            ) : null}

            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" component="label" disabled={saving}>
                Upload Thumbnail
                <input
                  ref={thumbInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setThumbFile(file);
                    setRemoveExistingThumb(false);
                    setErrors((prev) => ({ ...prev, thumbnail: undefined }));
                    e.currentTarget.value = '';
                  }}
                />
              </Button>

              {(thumbFile || (existingThumb && !removeExistingThumb)) && (
                <Button variant="text" color="error" onClick={removeThumb} disabled={saving}>
                  Remove
                </Button>
              )}

              {thumbFile ? (
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {thumbFile.name}
                </Typography>
              ) : null}
            </Stack>

            {errors.thumbnail && (
              <Typography color="error" variant="caption">
                {errors.thumbnail}
              </Typography>
            )}
          </Stack>

          <FormControlLabel
            control={<Switch checked={active === 1} onChange={(e) => setActive(e.target.checked ? 1 : 0)} />}
            label={active === 1 ? 'Active' : 'Inactive'}
          />

          <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center">
            <Button variant="outlined" type="button" onClick={() => router.push('/dashboard/developers')} disabled={saving}>
              Cancel
            </Button>

            <Button variant="contained" type="submit" disabled={saving}>
              {saving ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={18} />
                  <span>Saving...</span>
                </Stack>
              ) : (
                'Update Developer'
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