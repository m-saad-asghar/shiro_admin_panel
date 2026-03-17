'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import {
  CommunityForm,
  type CommunityFormValues,
} from '@/components/dashboard/community/community-form';

type ApiBasicResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
  errors?: Record<string, string[]>;
};

const initialValues: CommunityFormValues = {
  name: '',
  slug: '',
  description: '',
  selling_point: '',
  about: '',
  main_image: '',
  is_area: true,
  active: true,
};

export default function AddCommunityPage(): React.JSX.Element {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [values, setValues] = React.useState<CommunityFormValues>(initialValues);
  const [selectedImageFile, setSelectedImageFile] = React.useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('');
  const [toastSeverity, setToastSeverity] = React.useState<'success' | 'error'>('success');

  const showToast = (message: string, severity: 'success' | 'error' = 'success') => {
    setToastMsg(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const getAccessToken = (): string => {
    const payloadStr = localStorage.getItem('admin_login_payload');
    if (!payloadStr) throw new Error('admin_login_payload not found in localStorage');

    try {
      const payload = JSON.parse(payloadStr);
      const accessToken = payload?.access_token ? String(payload.access_token) : null;

      if (!accessToken) {
        throw new Error('access_token missing inside admin_login_payload');
      }

      return accessToken;
    } catch {
      throw new Error('admin_login_payload is not valid JSON');
    }
  };

  const handleChange = (field: keyof CommunityFormValues, value: string | boolean) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageSelect = React.useCallback((file: File | null, preview: string) => {
    setSelectedImageFile(file);

    setSelectedImagePreview((prevPreview) => {
      if (prevPreview && prevPreview.startsWith('blob:')) {
        URL.revokeObjectURL(prevPreview);
      }
      return preview;
    });

    setValues((prev) => ({
      ...prev,
      main_image: '',
    }));
  }, []);

  React.useEffect(() => {
    return () => {
      if (selectedImagePreview && selectedImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  const resetForm = React.useCallback(() => {
    setValues(initialValues);
    setSelectedImageFile(null);

    setSelectedImagePreview((prevPreview) => {
      if (prevPreview && prevPreview.startsWith('blob:')) {
        URL.revokeObjectURL(prevPreview);
      }
      return '';
    });
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;

    const name = values.name.trim();
    const slug = values.slug.trim();
    const description = values.description.trim();
    const sellingPoint = values.selling_point.trim();
    const about = values.about.trim();

    if (!name || !slug) {
      showToast('Name and slug are required.', 'error');
      return;
    }

    if (!apiBase) {
      showToast('NEXT_PUBLIC_API_BASE_URL is missing.', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const accessToken = getAccessToken();
      const formData = new FormData();

      formData.append('name', name);
      formData.append('slug', slug);

      if (description) formData.append('description', description);
      if (sellingPoint) formData.append('selling_point', sellingPoint);
      if (about) formData.append('about', about);

      formData.append('is_area', values.is_area ? '1' : '0');
      formData.append('active', values.active ? '1' : '0');

      if (selectedImageFile) {
        formData.append('main_image', selectedImageFile);
      }

      const res = await fetch(`${apiBase}/admin/add-community`, {
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
        const msgFromServer = payload?.message ? String(payload.message) : null;
        const firstField = payload?.errors ? Object.keys(payload.errors)[0] : null;
        const firstError =
          firstField && payload?.errors?.[firstField]?.[0]
            ? String(payload.errors[firstField][0])
            : null;

        throw new Error(firstError || msgFromServer || `Create failed. HTTP ${res.status}`);
      }

      showToast(
        payload?.message ? String(payload.message) : 'Community created successfully.',
        'success'
      );

      resetForm();

      setTimeout(() => {
        router.push('/dashboard/communities');
      }, 700);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Create failed';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">Add Community</Typography>
        <Typography color="text.secondary" variant="body2">
          Only name and slug are required. All other fields are optional.
        </Typography>
      </div>

      <CommunityForm
        mode="add"
        values={values}
        selectedImageFile={selectedImageFile}
        selectedImagePreview={selectedImagePreview}
        onChange={handleChange}
        onImageSelect={handleImageSelect}
        onSubmit={() => void handleSubmit()}
        onCancel={() => router.push('/dashboard/communities')}
        submitting={submitting}
      />

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