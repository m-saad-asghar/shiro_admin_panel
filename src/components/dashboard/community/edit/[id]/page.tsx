'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';

import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
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

type ApiSingleCommunityResponse = {
  success?: boolean;
  message?: string;
  data?: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    selling_point: string | null;
    about: string | null;
    main_image: string | null;
    is_area: number;
    active: number;
    created_at?: string;
    updated_at?: string;
  };
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

export default function EditCommunityPage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const id =
    typeof params?.id === 'string'
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : '';

  const [values, setValues] = React.useState<CommunityFormValues>(initialValues);
  const [selectedImageFile, setSelectedImageFile] = React.useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('');
  const [toastSeverity, setToastSeverity] = React.useState<'success' | 'error'>('success');

  const showToast = React.useCallback(
    (message: string, severity: 'success' | 'error' = 'success') => {
      setToastMsg(message);
      setToastSeverity(severity);
      setToastOpen(true);
    },
    []
  );

  const getAccessToken = (): string => {
    const payloadStr = localStorage.getItem('admin_login_payload');

    if (!payloadStr) {
      throw new Error('admin_login_payload not found in localStorage');
    }

    try {
      const payload = JSON.parse(payloadStr);
      const accessToken = payload?.access_token ? String(payload.access_token) : '';

      if (!accessToken) {
        throw new Error('access_token missing inside admin_login_payload');
      }

      return accessToken;
    } catch {
      throw new Error('admin_login_payload is not valid JSON');
    }
  };

  const handleChange = (
    field: keyof CommunityFormValues,
    value: string | boolean
  ) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageSelect = React.useCallback((file: File | null, preview: string) => {
    setSelectedImageFile(file);

    setValues((prev) => ({
      ...prev,
      main_image: '',
    }));

    setSelectedImagePreview((prevPreview) => {
      if (prevPreview && prevPreview.startsWith('blob:')) {
        URL.revokeObjectURL(prevPreview);
      }
      return preview;
    });
  }, []);

  React.useEffect(() => {
    return () => {
      if (selectedImagePreview && selectedImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  const fetchCommunity = React.useCallback(async () => {
    if (!apiBase) {
      showToast('NEXT_PUBLIC_API_BASE_URL is missing.', 'error');
      setLoading(false);
      return;
    }

    if (!id) {
      showToast('Community ID is missing.', 'error');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const accessToken = getAccessToken();

      const res = await fetch(`${apiBase}/admin/communities/${id}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      let payload: ApiSingleCommunityResponse | null = null;

      try {
        payload = (await res.json()) as ApiSingleCommunityResponse;
      } catch {
        payload = null;
      }

      if (!res.ok) {
        throw new Error(
          payload?.message
            ? String(payload.message)
            : `Failed to fetch community. HTTP ${res.status}`
        );
      }

      if (!payload?.data) {
        throw new Error('Community data not found.');
      }

      setValues({
        name: payload.data.name ?? '',
        slug: payload.data.slug ?? '',
        description: payload.data.description ?? '',
        selling_point: payload.data.selling_point ?? '',
        about: payload.data.about ?? '',
        main_image: payload.data.main_image ?? '',
        is_area: Number(payload.data.is_area) === 1,
        active: Number(payload.data.active) === 1,
      });

      setSelectedImageFile(null);

      setSelectedImagePreview((prevPreview) => {
        if (prevPreview && prevPreview.startsWith('blob:')) {
          URL.revokeObjectURL(prevPreview);
        }
        return '';
      });
    } catch (error) {
      console.error('Fetch community error:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to fetch community.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [apiBase, id, showToast]);

  React.useEffect(() => {
    void fetchCommunity();
  }, [fetchCommunity]);

  const handleSubmit = async () => {
    if (submitting) return;

    const name = values.name.trim();
    const slug = values.slug.trim();
    const description = values.description.trim();
    const sellingPoint = values.selling_point.trim();
    const about = values.about.trim();
    const mainImage = values.main_image.trim();

    if (!name || !slug) {
      showToast('Name and slug are required.', 'error');
      return;
    }

    if (!apiBase) {
      showToast('NEXT_PUBLIC_API_BASE_URL is missing.', 'error');
      return;
    }

    if (!id) {
      showToast('Community ID is missing.', 'error');
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
      } else if (mainImage) {
        formData.append('main_image', mainImage);
      }

      formData.append('_method', 'PUT');

      const res = await fetch(`${apiBase}/admin/communities/${id}`, {
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
        const msgFromServer = payload?.message ? String(payload.message) : '';
        const firstField = payload?.errors ? Object.keys(payload.errors)[0] : '';
        const firstError =
          firstField && payload?.errors?.[firstField]?.[0]
            ? String(payload.errors[firstField][0])
            : '';

        throw new Error(
          firstError || msgFromServer || `Update failed. HTTP ${res.status}`
        );
      }

      showToast(
        payload?.message
          ? String(payload.message)
          : 'Community updated successfully.',
        'success'
      );

      setTimeout(() => {
        router.push('/dashboard/community');
      }, 700);
    } catch (error) {
      console.error('Update community error:', error);
      showToast(
        error instanceof Error ? error.message : 'Update failed. Please try again.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">Edit Community</Typography>
        <Typography color="text.secondary" variant="body2">
          Only name and slug are required. All other fields are optional.
        </Typography>
      </div>

      {loading ? (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 2 }}>
          <CircularProgress size={22} />
          <Typography variant="body2">Loading community...</Typography>
        </Stack>
      ) : (
        <CommunityForm
          mode="edit"
          values={values}
          selectedImageFile={selectedImageFile}
          selectedImagePreview={selectedImagePreview}
          onChange={handleChange}
          onImageSelect={handleImageSelect}
          onSubmit={() => void handleSubmit()}
          onCancel={() => router.push('/dashboard/community')}
          submitting={submitting}
        />
      )}

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