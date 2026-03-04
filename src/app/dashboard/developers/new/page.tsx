'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

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
};

type FormErrors = {
  name?: string;
  slug?: string;
  email?: string; // ✅ optional
  description?: string;
  logo?: string;
  thumbnail?: string;
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

export default function NewDeveloperPage(): React.JSX.Element {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const CREATE_ENDPOINT = `${apiBase}/admin/create_developer`;

  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);

  const [email, setEmail] = React.useState(''); // ✅ NOT required
  const [description, setDescription] = React.useState(''); // ✅ required

  const [active, setActive] = React.useState<0 | 1>(1);

  const [logoFile, setLogoFile] = React.useState<File | null>(null); // ✅ required
  const [thumbFile, setThumbFile] = React.useState<File | null>(null); // ✅ required

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

  // ✅ Auto-generate slug from name until user edits it
  React.useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(slugify(name));
      setErrors((prev) => ({ ...prev, slug: undefined }));
    }
  }, [name, slugManuallyEdited]);

  // ✅ logo preview
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

  // ✅ thumbnail preview
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

  const removeLogo = () => {
    setLogoFile(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
    setErrors((prev) => ({ ...prev, logo: undefined }));
  };

  const removeThumb = () => {
    setThumbFile(null);
    if (thumbInputRef.current) thumbInputRef.current.value = '';
    setErrors((prev) => ({ ...prev, thumbnail: undefined }));
  };

  const validate = (): {
    ok: boolean;
    clean: { name: string; slug: string; email: string; description: string };
  } => {
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSlug = slugify(slug);
    const cleanDescription = description.trim();

    const nextErrors: FormErrors = {};

    // ✅ Required fields (all except email)
    if (!cleanName) nextErrors.name = 'Name is required';
    if (!cleanSlug) nextErrors.slug = 'Slug is required';
    if (!cleanDescription) nextErrors.description = 'Description is required';
    if (!logoFile) nextErrors.logo = 'Logo is required';
    if (!thumbFile) nextErrors.thumbnail = 'Thumbnail is required';

    // ❌ Email NOT required, but if provided must be valid
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
      formData.append('name', clean.name);
      formData.append('slug', clean.slug);
      formData.append('email', clean.email); // optional
      formData.append('description', clean.description);
      formData.append('active', String(active));

      // required
      if (logoFile) formData.append('logo', logoFile);
      if (thumbFile) formData.append('thumbnail', thumbFile);

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
          `Create developer failed (${res.status})`;
        throw new Error(msg);
      }

      const msg = payload?.message || 'Developer created successfully';
      router.push(`/dashboard/developers?toast=success&msg=${encodeURIComponent(msg)}`);
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Create developer failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Add Developer</Typography>

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
            placeholder="e.g. info@developer.com"
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

          {/* ✅ Logo upload */}
          <Stack spacing={1}>
            <Typography variant="subtitle2">Logo *</Typography>

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
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
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
                    setErrors((prev) => ({ ...prev, logo: undefined }));
                    e.currentTarget.value = '';
                  }}
                />
              </Button>

              {logoFile && (
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

          {/* ✅ Thumbnail upload */}
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
                <img
                  src={thumbPreview}
                  alt="Thumbnail preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
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
                    setErrors((prev) => ({ ...prev, thumbnail: undefined }));
                    e.currentTarget.value = '';
                  }}
                />
              </Button>

              {thumbFile && (
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
            control={
              <Switch checked={active === 1} onChange={(e) => setActive(e.target.checked ? 1 : 0)} />
            }
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
                'Create Developer'
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
