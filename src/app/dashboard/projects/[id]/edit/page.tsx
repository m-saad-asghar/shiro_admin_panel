'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import projectsImagesUrl from '@/helpers/projectsImagesURL';

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};

type DropdownItem = { id: number; name: string };

type ProjectEditApi = {
  project: {
    id: number;
    name: string;
    slug: string;
    description: string | null;

    main_image: string | null;
    brochure: string | null;

    community_name: string | null;
    community_id: number | null;
    developer_id: number | null;

    starting_price: string | null;
    handover: string | null;
    payment_plan: string | null;
    payment_plan_description: string | null;

    active: 0 | 1;

    created_at?: string | null;
    updated_at?: string | null;
  };

  amenities: Array<{
    id: number;
    amenity_id: number;
    project_id: number;
  }>;

  faqs: Array<{
    id: number;
    title: string;
    description: string;
    project_id: number;
    active?: number;
  }>;

  floorplans: Array<{
    id: number;
    title: string;
    image: string;
    project_id: number;
    active?: number;
  }>;

  unique_selling_points: Array<{
    id: number;
    title: string;
    description: string;
    main_image: string;
    project_id: number;
  }>;

  images: Array<{
    id: number;
    image: string;
    project_id: number;
    active?: number;
  }>;

  payment_plans: Array<{
    id: number;
    title: string;
    value: string;
    sub_title: string | null;
    project_id: number;
    active?: number;
  }>;

  locations: Array<{
    id: number;
    title: string;
    description: string;
    main_image?: string | null;
    map_link: string | null;
    project_id: number;
  }>;
};

type ProjectEdit = {
  id: number;

  name: string;
  slug: string;
  description: string | null;

  main_image: string | null;
  brochure: string | null;

  community_id: number;
  community_name: string;
  developer_id: number;

  starting_price: string | null;
  handover: string | null;
  payment_plan: string | null;
  payment_plan_description: string | null;

  active: 0 | 1;
};

type FaqRow = {
  id?: number;
  title: string;
  description: string;
};

type FloorplanRow = {
  id?: number;
  title: string;
  image: string;
};

type ImageRow = {
  id?: number;
  image: string;
};

type PaymentPlanRow = {
  id?: number;
  title: string;
  value: string;
  sub_title: string | null;
};

type LocationRow = {
  id?: number;
  title: string;
  description: string;
  map_link: string | null;
};

type UspRow = {
  id?: number;
  title: string;
  description: string;
  main_image: string;
};

type FormErrors = Record<string, string>;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 256);
}

const TRASH_COLOR = '#9f8151';
const assetBase = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || '';

function fileUrl(filename: string | null): string | null {
  if (!filename) return null;
  if (!assetBase) return null;
  return `${assetBase.replace(/\/+$/, '')}/${filename.replace(/^\/+/, '')}`;
}

function isHtmlEmpty(value: string | null | undefined): boolean {
  if (!value) return true;
  const stripped = value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return stripped.length === 0;
}

type CkEditorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  minHeight?: number;
};

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

export default function EditProjectPage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const UPDATE_ENDPOINT = apiBase ? `${apiBase}/admin/projects/${id}/update` : '';
  const EDIT_DATA_ENDPOINT = apiBase ? `${apiBase}/admin/projects/${id}/edit-data` : '';

  const COMMUNITIES_ENDPOINT = apiBase ? `${apiBase}/admin/fetch_communities` : '';
  const DEVELOPERS_ENDPOINT = apiBase ? `${apiBase}/admin/fetch_developers_dropdown` : '';
  const AMENITIES_ENDPOINT = apiBase ? `${apiBase}/admin/fetch_amenities` : '';

  const [initialLoading, setInitialLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [loadingDropdowns, setLoadingDropdowns] = React.useState(false);

  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('');
  const [toastSeverity, setToastSeverity] = React.useState<'success' | 'error'>('success');

  const [errors, setErrors] = React.useState<FormErrors>({});

  const [project, setProject] = React.useState<ProjectEdit>({
    id: id || 0,

    name: '',
    slug: '',
    description: '',

    main_image: null,
    brochure: null,

    community_id: 0,
    community_name: '',
    developer_id: 0,

    starting_price: '',
    handover: '',
    payment_plan: '',
    payment_plan_description: '',

    active: 1,
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);

  const [communities, setCommunities] = React.useState<DropdownItem[]>([]);
  const [developers, setDevelopers] = React.useState<DropdownItem[]>([]);
  const [amenities, setAmenities] = React.useState<DropdownItem[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = React.useState<number[]>([]);

  const [faqs, setFaqs] = React.useState<FaqRow[]>([]);
  const [floorplans, setFloorplans] = React.useState<FloorplanRow[]>([]);
  const [images, setImages] = React.useState<ImageRow[]>([]);
  const [paymentPlans, setPaymentPlans] = React.useState<PaymentPlanRow[]>([]);
  const [locations, setLocations] = React.useState<LocationRow[]>([]);
  const [usp, setUsp] = React.useState<UspRow>({
    title: '',
    description: '',
    main_image: '',
  });

  const [projectMainImageFile, setProjectMainImageFile] = React.useState<File | null>(null);
  const [projectMainImagePreview, setProjectMainImagePreview] = React.useState<string | null>(null);
  const projectMainImageRef = React.useRef<HTMLInputElement | null>(null);

  const [brochureFile, setBrochureFile] = React.useState<File | null>(null);
  const brochureRef = React.useRef<HTMLInputElement | null>(null);

  const [uspMainImageFile, setUspMainImageFile] = React.useState<File | null>(null);
  const [uspMainImagePreview, setUspMainImagePreview] = React.useState<string | null>(null);
  const uspMainImageRef = React.useRef<HTMLInputElement | null>(null);

  const [floorplanFiles, setFloorplanFiles] = React.useState<Record<number, File | null>>({});
  const [floorplanPreviews, setFloorplanPreviews] = React.useState<Record<number, string | null>>({});
  const floorplanInputRefs = React.useRef<Record<number, HTMLInputElement | null>>({});

  const [galleryFiles, setGalleryFiles] = React.useState<Record<number, File | null>>({});
  const [galleryPreviews, setGalleryPreviews] = React.useState<Record<number, string | null>>({});
  const galleryInputRefs = React.useRef<Record<number, HTMLInputElement | null>>({});

  React.useEffect(() => {
    return () => {
      if (projectMainImagePreview) URL.revokeObjectURL(projectMainImagePreview);
      if (uspMainImagePreview) URL.revokeObjectURL(uspMainImagePreview);
      Object.values(floorplanPreviews).forEach((u) => u && URL.revokeObjectURL(u));
      Object.values(galleryPreviews).forEach((u) => u && URL.revokeObjectURL(u));
    };
  }, [projectMainImagePreview, uspMainImagePreview, floorplanPreviews, galleryPreviews]);

  React.useEffect(() => {
    if (!projectMainImageFile) {
      if (projectMainImagePreview) URL.revokeObjectURL(projectMainImagePreview);
      setProjectMainImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(projectMainImageFile);
    setProjectMainImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [projectMainImageFile, projectMainImagePreview]);

  React.useEffect(() => {
    if (!uspMainImageFile) {
      if (uspMainImagePreview) URL.revokeObjectURL(uspMainImagePreview);
      setUspMainImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(uspMainImageFile);
    setUspMainImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [uspMainImageFile, uspMainImagePreview]);

  const setFloorplanFileAt = (idx: number, file: File | null) => {
    const oldUrl = floorplanPreviews[idx];
    if (oldUrl) URL.revokeObjectURL(oldUrl);

    if (!file) {
      setFloorplanFiles((p) => ({ ...p, [idx]: null }));
      setFloorplanPreviews((p) => ({ ...p, [idx]: null }));
      return;
    }

    const url = URL.createObjectURL(file);
    setFloorplanFiles((p) => ({ ...p, [idx]: file }));
    setFloorplanPreviews((p) => ({ ...p, [idx]: url }));
  };

  const setGalleryFileAt = (idx: number, file: File | null) => {
    const oldUrl = galleryPreviews[idx];
    if (oldUrl) URL.revokeObjectURL(oldUrl);

    if (!file) {
      setGalleryFiles((p) => ({ ...p, [idx]: null }));
      setGalleryPreviews((p) => ({ ...p, [idx]: null }));
      return;
    }

    const url = URL.createObjectURL(file);
    setGalleryFiles((p) => ({ ...p, [idx]: file }));
    setGalleryPreviews((p) => ({ ...p, [idx]: url }));
  };

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

  React.useEffect(() => {
    if (!slugManuallyEdited) {
      setProject((p) => ({ ...p, slug: slugify(p.name) }));
      setErrors((prev) => {
        const { slug, ...rest } = prev;
        return rest;
      });
    }
  }, [project.name, slugManuallyEdited]);

  React.useEffect(() => {
    const run = async () => {
      if (!apiBase) return;

      try {
        setLoadingDropdowns(true);
        const token = getAccessToken();

        const fetchOne = async <T,>(url: string) => {
          const res = await fetch(url, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          const payload = (await res.json()) as ApiResponse<T>;
          if (!res.ok || !payload.success || !payload.data) {
            throw new Error(payload.message || `Failed to load (${res.status})`);
          }
          return payload.data;
        };

        const [commData, devData, amenData] = await Promise.all([
          fetchOne<any>(COMMUNITIES_ENDPOINT),
          fetchOne<any>(DEVELOPERS_ENDPOINT),
          fetchOne<any>(AMENITIES_ENDPOINT),
        ]);

        const normalizeList = (d: any): DropdownItem[] => {
          const list =
            d?.communities ||
            d?.developers ||
            d?.amenities ||
            d?.data ||
            d ||
            [];
          if (!Array.isArray(list)) return [];
          return list
            .map((x) => ({
              id: Number(x.id),
              name: String(x.name ?? x.title ?? ''),
            }))
            .filter((x) => Number.isFinite(x.id) && x.id > 0 && x.name);
        };

        setCommunities(normalizeList(commData));
        setDevelopers(normalizeList(devData));
        setAmenities(normalizeList(amenData));
      } catch (e) {
        console.error(e);
        showToast(e instanceof Error ? e.message : 'Failed to load dropdowns', 'error');
      } finally {
        setLoadingDropdowns(false);
      }
    };

    run();
  }, [apiBase, COMMUNITIES_ENDPOINT, DEVELOPERS_ENDPOINT, AMENITIES_ENDPOINT]);

  React.useEffect(() => {
    const run = async () => {
      if (!apiBase) return;
      if (!id || !Number.isFinite(id)) {
        showToast('Invalid project id', 'error');
        setInitialLoading(false);
        return;
      }

      try {
        setInitialLoading(true);

        const token = getAccessToken();

        const res = await fetch(EDIT_DATA_ENDPOINT, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = (await res.json()) as ApiResponse<ProjectEditApi>;
        if (!res.ok || !payload.success || !payload.data) {
          throw new Error(payload.message || `Failed to load project (${res.status})`);
        }

        const d = payload.data;
        const p = d.project;

        setProject({
          id: p.id,
          name: p.name ?? '',
          slug: p.slug ?? '',
          description: p.description ?? '',

          main_image: p.main_image ?? null,
          brochure: p.brochure ?? null,

          community_id: Number(p.community_id ?? 0),
          community_name: String(p.community_name ?? ''),
          developer_id: Number(p.developer_id ?? 0),

          starting_price: p.starting_price ?? '',
          handover: p.handover ?? '',
          payment_plan: p.payment_plan ?? '',
          payment_plan_description: p.payment_plan_description ?? '',

          active: (p.active ?? 0) as 0 | 1,
        });

        setSelectedAmenityIds((d.amenities || []).map((a) => Number(a.amenity_id)).filter((x) => x > 0));

        setFaqs((d.faqs || []).map((x) => ({ id: x.id, title: x.title ?? '', description: x.description ?? '' })));

        setFloorplans((d.floorplans || []).map((x) => ({ id: x.id, title: x.title ?? '', image: x.image ?? '' })));

        setImages((d.images || []).map((x) => ({ id: x.id, image: x.image ?? '' })));

        setPaymentPlans((d.payment_plans || []).map((x) => ({
          id: x.id,
          title: x.title ?? '',
          value: x.value ?? '',
          sub_title: x.sub_title ?? '',
        })));

        setLocations((d.locations || []).map((x) => ({
          id: x.id,
          title: x.title ?? '',
          description: x.description ?? '',
          map_link: x.map_link ?? '',
        })));

        const uspRow = (d.unique_selling_points || [])[0];
        if (uspRow) {
          setUsp({
            id: uspRow.id,
            title: uspRow.title ?? '',
            description: uspRow.description ?? '',
            main_image: uspRow.main_image ?? '',
          });
        } else {
          setUsp({ title: '', description: '', main_image: '' });
        }
      } catch (e) {
        console.error(e);
        showToast(e instanceof Error ? e.message : 'Failed to load project data', 'error');
      } finally {
        setInitialLoading(false);
      }
    };

    run();
  }, [apiBase, id, EDIT_DATA_ENDPOINT]);

  const validate = (): boolean => {
    const next: FormErrors = {};

    const cleanName = project.name.trim();
    const cleanSlug = slugify(project.slug || '');

    if (!cleanName) next.name = 'Project name is required';
    if (!cleanSlug) next.slug = 'Slug is required';

    if (!project.community_id) next.community_id = 'Community is required';
    if (!project.developer_id) next.developer_id = 'Developer is required';

    faqs.forEach((f, i) => {
      if (!f.title.trim()) next[`faqs.${i}.title`] = 'FAQ title required';
      if (!f.description.trim()) next[`faqs.${i}.description`] = 'FAQ description required';
    });

    floorplans.forEach((fp, i) => {
      if (!fp.title.trim()) next[`floorplans.${i}.title`] = 'Floorplan title required';
      if (!fp.image.trim()) next[`floorplans.${i}.image`] = 'Floorplan image required';
    });

    images.forEach((im, i) => {
      if (!im.image.trim()) next[`images.${i}.image`] = 'Image required';
    });

    paymentPlans.forEach((pp, i) => {
      if (!pp.title.trim()) next[`payment_plans.${i}.title`] = 'Title required';
      if (!pp.value.trim()) next[`payment_plans.${i}.value`] = 'Value required';
    });

    locations.forEach((loc, i) => {
      if (!loc.title.trim()) next[`locations.${i}.title`] = 'Title required';
      if (isHtmlEmpty(loc.description)) next[`locations.${i}.description`] = 'Description required';
    });

    if (usp.title.trim() && isHtmlEmpty(usp.description)) {
      next.usp_description = 'USP description required if USP title exists';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const removeProjectMainImage = () => {
    setProjectMainImageFile(null);
    if (projectMainImageRef.current) projectMainImageRef.current.value = '';
    setProject((p) => ({ ...p, main_image: null }));
  };

  const removeBrochure = () => {
    setBrochureFile(null);
    if (brochureRef.current) brochureRef.current.value = '';
    setProject((p) => ({ ...p, brochure: null }));
  };

  const removeUspMainImage = () => {
    setUspMainImageFile(null);
    if (uspMainImageRef.current) uspMainImageRef.current.value = '';
    setUsp((u) => ({ ...u, main_image: '' }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiBase) return showToast('API base missing', 'error');
    if (!UPDATE_ENDPOINT) return showToast('Update endpoint missing', 'error');

    if (!validate()) {
      showToast('Fix highlighted fields.', 'error');
      return;
    }

    try {
      setSaving(true);
      const accessToken = getAccessToken();

      const payloadBody = {
        project: {
          ...project,
          name: project.name.trim(),
          slug: slugify(project.slug || ''),
        },
        amenity_ids: selectedAmenityIds,
        faqs,
        floorplans,
        images,
        payment_plans: paymentPlans,
        locations,
        unique_selling_points: usp.title.trim() ? [{ ...usp }] : [],
      };

      const formData = new FormData();
      formData.append('payload', JSON.stringify(payloadBody));

      if (projectMainImageFile) {
        formData.append('project_main_image', projectMainImageFile);
      }

      if (uspMainImageFile) {
        formData.append('usp_main_image', uspMainImageFile);
      }

      if (brochureFile) {
        formData.append('brochure', brochureFile);
      }

      Object.entries(floorplanFiles).forEach(([idx, file]) => {
        if (file) formData.append(`floorplan_images[${idx}]`, file);
      });

      Object.entries(galleryFiles).forEach(([idx, file]) => {
        if (file) formData.append(`gallery_images[${idx}]`, file);
      });

      const res = await fetch(UPDATE_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      let apiRes: ApiResponse<{ project_id?: number }> | null = null;
      try {
        apiRes = (await res.json()) as ApiResponse<{ project_id?: number }>;
      } catch {
        apiRes = null;
      }

      if (!res.ok || !apiRes?.success) {
        const msg = apiRes?.message || firstError(apiRes?.errors) || `Update failed (${res.status})`;
        throw new Error(msg);
      }

      showToast(apiRes?.message || 'Project updated successfully', 'success');
      router.push('/dashboard/projects?toast=success&msg=' + encodeURIComponent(apiRes?.message || 'Project updated'));
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <Stack spacing={2} direction="row" alignItems="center">
        <CircularProgress size={20} />
        <Typography>Loading Project...</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={3} component="form" onSubmit={handleUpdate}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Edit Project</Typography>

        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => router.push('/dashboard/projects')} disabled={saving}>
            Back
          </Button>
          <Button variant="contained" type="submit" disabled={saving}>
            {saving ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <span>Saving...</span>
              </Stack>
            ) : (
              'Update Project'
            )}
          </Button>
        </Stack>
      </Stack>

      {/* PROJECT */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Project</Typography>
        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          <TextField
            label="Name *"
            value={project.name}
            onChange={(e) => {
              setProject((p) => ({ ...p, name: e.target.value }));
              setErrors((prev) => {
                const { name, ...rest } = prev;
                return rest;
              });
            }}
            fullWidth
            error={Boolean(errors.name)}
            helperText={errors.name || ''}
          />

          <TextField
            label="Slug *"
            value={project.slug}
            onChange={(e) => {
              setSlugManuallyEdited(true);
              setProject((p) => ({ ...p, slug: e.target.value }));
              setErrors((prev) => {
                const { slug, ...rest } = prev;
                return rest;
              });
            }}
            onBlur={() => setProject((p) => ({ ...p, slug: slugify(p.slug || '') }))}
            fullWidth
            error={Boolean(errors.slug)}
            helperText={errors.slug || 'Auto from name unless edited.'}
          />

          <CkEditorField
            label="Description"
            value={project.description ?? ''}
            onChange={(value) => setProject((p) => ({ ...p, description: value }))}
            minHeight={220}
          />

          <Stack spacing={1}>
            <Typography variant="subtitle2">Main Image</Typography>

            {!projectMainImagePreview && project.main_image ? (
              fileUrl(project.main_image) ? (
                <Box
                  sx={{
                    width: 260,
                    height: 160,
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
                    src={fileUrl(project.main_image) as string}
                    alt="Main image"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
              ) : (
                <Typography variant="body2" sx={{ opacity: 0.75 }}>
                  Current file: {project.main_image}
                </Typography>
              )
            ) : null}

            {projectMainImagePreview ? (
              <Box
                sx={{
                  width: 260,
                  height: 160,
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
                  src={projectMainImagePreview}
                  alt="Main image preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            ) : null}

            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" component="label" disabled={saving}>
                {project.main_image ? 'Replace Main Image' : 'Upload Main Image'}
                <input
                  ref={projectMainImageRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setProjectMainImageFile(file);
                    setProject((p) => ({ ...p, main_image: file ? file.name : p.main_image }));
                    e.currentTarget.value = '';
                  }}
                />
              </Button>

              {(projectMainImageFile || project.main_image) && (
                <Button variant="text" onClick={removeProjectMainImage} disabled={saving} sx={{ color: TRASH_COLOR }}>
                  Remove
                </Button>
              )}

              {projectMainImageFile ? (
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  New: {projectMainImageFile.name}
                </Typography>
              ) : project.main_image ? (
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Current: {project.main_image}
                </Typography>
              ) : null}
            </Stack>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">Brochure (PDF)</Typography>

            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" component="label" disabled={saving}>
                {project.brochure ? 'Replace Brochure (PDF)' : 'Upload Brochure (PDF)'}
                <input
                  ref={brochureRef}
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setBrochureFile(file);
                    setProject((p) => ({ ...p, brochure: file ? file.name : p.brochure }));
                    e.currentTarget.value = '';
                  }}
                />
              </Button>

              {(brochureFile || project.brochure) && (
                <Button variant="text" onClick={removeBrochure} disabled={saving} sx={{ color: TRASH_COLOR }}>
                  Remove
                </Button>
              )}

              {brochureFile ? (
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  New: {brochureFile.name}
                </Typography>
              ) : project.brochure ? (
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Current: {project.brochure}
                </Typography>
              ) : null}
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl fullWidth error={Boolean(errors.community_id)} disabled={loadingDropdowns || saving}>
              <Autocomplete
                options={communities}
                value={communities.find((c) => c.id === project.community_id) ?? null}
                onChange={(_, newValue) => {
                  setProject((p) => ({
                    ...p,
                    community_id: newValue?.id ?? 0,
                    community_name: newValue?.name ?? '',
                  }));
                  setErrors((prev) => {
                    const { community_id, ...rest } = prev;
                    return rest;
                  });
                }}
                getOptionLabel={(option) => option?.name ?? ''}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disabled={loadingDropdowns || saving}
                ListboxProps={{ style: { maxHeight: 300, overflow: 'auto' } }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Community *"
                    placeholder="Search community..."
                    error={Boolean(errors.community_id)}
                    helperText={errors.community_id || ''}
                  />
                )}
              />
            </FormControl>

            <FormControl fullWidth error={Boolean(errors.developer_id)} disabled={loadingDropdowns || saving}>
              <Autocomplete
                options={developers}
                value={developers.find((d) => d.id === project.developer_id) ?? null}
                onChange={(_, newValue) => {
                  const did = newValue?.id ?? 0;
                  setProject((p) => ({ ...p, developer_id: did }));
                  setErrors((prev) => {
                    const { developer_id, ...rest } = prev;
                    return rest;
                  });
                }}
                getOptionLabel={(option) => option?.name ?? ''}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disabled={loadingDropdowns || saving}
                ListboxProps={{ style: { maxHeight: 300, overflow: 'auto' } }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Developer *"
                    placeholder="Search developer..."
                    error={Boolean(errors.developer_id)}
                    helperText={errors.developer_id || ''}
                  />
                )}
              />
            </FormControl>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Starting Price"
              value={project.starting_price ?? ''}
              onChange={(e) => setProject((p) => ({ ...p, starting_price: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Handover"
              value={project.handover ?? ''}
              onChange={(e) => setProject((p) => ({ ...p, handover: e.target.value }))}
              fullWidth
            />
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Payment Plan"
              value={project.payment_plan ?? ''}
              onChange={(e) => setProject((p) => ({ ...p, payment_plan: e.target.value }))}
              fullWidth
            />

            <Box sx={{ width: '100%' }}>
              <CkEditorField
                label="Payment Plan Description"
                value={project.payment_plan_description ?? ''}
                onChange={(value) => setProject((p) => ({ ...p, payment_plan_description: value }))}
                minHeight={180}
              />
            </Box>
          </Stack>
        </Stack>
      </Paper>

      {/* AMENITIES */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Amenities</Typography>
        <Divider sx={{ my: 2 }} />

        <FormControl fullWidth disabled={loadingDropdowns || saving}>
          <Autocomplete
            multiple
            options={amenities}
            value={amenities.filter((a) => selectedAmenityIds.includes(a.id))}
            onChange={(_, newValue) => setSelectedAmenityIds(newValue.map((a) => a.id))}
            getOptionLabel={(option) => option?.name ?? ''}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disableCloseOnSelect
            ListboxProps={{ style: { maxHeight: 300, overflow: 'auto' } }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={option.name}
                  sx={{
                    height: 36,
                    fontSize: '0.95rem',
                    backgroundColor: '#094834',
                    color: '#fff',
                    '& .MuiChip-deleteIcon': {
                      color: '#fff',
                      '&:hover': { color: '#ddd' },
                    },
                  }}
                />
              ))
            }
            renderInput={(params) => <TextField {...params} label="Select Amenities" />}
          />
        </FormControl>
      </Paper>

      {/* USP */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Unique Selling Point (Single)</Typography>
        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          <TextField
            label="USP Title"
            value={usp.title}
            onChange={(e) => setUsp((u) => ({ ...u, title: e.target.value }))}
            fullWidth
          />

          <CkEditorField
            label="USP Description"
            value={usp.description}
            onChange={(value) => setUsp((u) => ({ ...u, description: value }))}
            error={Boolean(errors.usp_description)}
            helperText={errors.usp_description || ''}
            minHeight={180}
          />

          <Stack spacing={1}>
            <Typography variant="subtitle2">USP Main Image</Typography>

            {!uspMainImagePreview && usp.main_image ? (
              projectsImagesUrl(usp.main_image) ? (
                <Box
                  sx={{
                    width: 260,
                    height: 160,
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
                    src={projectsImagesUrl(usp.main_image) as string}
                    alt="USP image"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
              ) : (
                <Typography variant="body2" sx={{ opacity: 0.75 }}>
                  Current file: {usp.main_image}
                </Typography>
              )
            ) : null}

            {uspMainImagePreview ? (
              <Box
                sx={{
                  width: 260,
                  height: 160,
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
                  src={uspMainImagePreview}
                  alt="USP image preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            ) : null}

            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" component="label" disabled={saving}>
                {usp.main_image ? 'Replace USP Image' : 'Upload USP Image'}
                <input
                  ref={uspMainImageRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setUspMainImageFile(file);
                    setUsp((u) => ({ ...u, main_image: file ? file.name : u.main_image }));
                    e.currentTarget.value = '';
                  }}
                />
              </Button>

              {(uspMainImageFile || usp.main_image) && (
                <Button variant="text" onClick={removeUspMainImage} disabled={saving} sx={{ color: TRASH_COLOR }}>
                  Remove
                </Button>
              )}

              {uspMainImageFile ? (
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  New: {uspMainImageFile.name}
                </Typography>
              ) : usp.main_image ? (
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Current: {usp.main_image}
                </Typography>
              ) : null}
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      {/* FAQS */}
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">FAQs</Typography>
          <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setFaqs((prev) => [...prev, { title: '', description: '' }])}>
            Add FAQ
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          {faqs.map((f, idx) => (
            <Paper key={f.id ?? idx} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">FAQ #{idx + 1}</Typography>
                  <IconButton onClick={() => setFaqs((prev) => prev.filter((_, i) => i !== idx))} sx={{ color: TRASH_COLOR }}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>

                <TextField
                  label="Title *"
                  value={f.title}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFaqs((prev) => prev.map((x, i) => (i === idx ? { ...x, title: v } : x)));
                  }}
                  fullWidth
                  error={Boolean(errors[`faqs.${idx}.title`])}
                  helperText={errors[`faqs.${idx}.title`] || ''}
                />

                <TextField
                  label="Description *"
                  value={f.description}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFaqs((prev) => prev.map((x, i) => (i === idx ? { ...x, description: v } : x)));
                  }}
                  fullWidth
                  multiline
                  minRows={3}
                  error={Boolean(errors[`faqs.${idx}.description`])}
                  helperText={errors[`faqs.${idx}.description`] || ''}
                />
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>

      {/* FLOORPLANS */}
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Floorplans</Typography>
          <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setFloorplans((prev) => [...prev, { title: '', image: '' }])}>
            Add Floorplan
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          {floorplans.map((fp, idx) => (
            <Paper key={fp.id ?? idx} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">Floorplan #{idx + 1}</Typography>
                  <IconButton
                    onClick={() => {
                      const input = floorplanInputRefs.current[idx];
                      if (input) input.value = '';
                      setFloorplanFileAt(idx, null);
                      setFloorplans((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    sx={{ color: TRASH_COLOR }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>

                <TextField
                  label="Title *"
                  value={fp.title}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFloorplans((prev) => prev.map((x, i) => (i === idx ? { ...x, title: v } : x)));
                  }}
                  fullWidth
                  error={Boolean(errors[`floorplans.${idx}.title`])}
                  helperText={errors[`floorplans.${idx}.title`] || ''}
                />

                <Stack spacing={1}>
                  <Typography variant="subtitle2">Floorplan Image *</Typography>

                  {!floorplanPreviews[idx] && fp.image ? (
                    projectsImagesUrl(fp.image) ? (
                      <Box
                        sx={{
                          width: 260,
                          height: 160,
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
                          src={projectsImagesUrl(fp.image) as string}
                          alt={`Floorplan ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ opacity: 0.75 }}>
                        Current file: {fp.image}
                      </Typography>
                    )
                  ) : null}

                  {floorplanPreviews[idx] ? (
                    <Box
                      sx={{
                        width: 260,
                        height: 160,
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
                        src={floorplanPreviews[idx] as string}
                        alt={`Floorplan ${idx + 1} preview`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  ) : null}

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Button variant="outlined" component="label" disabled={saving}>
                      {fp.image ? 'Replace Floorplan' : 'Upload Floorplan'}
                      <input
                        ref={(el) => {
                          floorplanInputRefs.current[idx] = el;
                        }}
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setFloorplanFileAt(idx, file);
                          setFloorplans((prev) => prev.map((x, i) => (i === idx ? { ...x, image: file ? file.name : x.image } : x)));
                          e.currentTarget.value = '';
                        }}
                      />
                    </Button>

                    {(floorplanFiles[idx] || fp.image) ? (
                      <Button
                        variant="text"
                        disabled={saving}
                        sx={{ color: TRASH_COLOR }}
                        onClick={() => {
                          const input = floorplanInputRefs.current[idx];
                          if (input) input.value = '';
                          setFloorplanFileAt(idx, null);
                          setFloorplans((prev) => prev.map((x, i) => (i === idx ? { ...x, image: '' } : x)));
                        }}
                      >
                        Remove
                      </Button>
                    ) : null}

                    {floorplanFiles[idx] ? (
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        New: {floorplanFiles[idx]?.name}
                      </Typography>
                    ) : fp.image ? (
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Current: {fp.image}
                      </Typography>
                    ) : null}
                  </Stack>

                  {errors[`floorplans.${idx}.image`] ? (
                    <Typography variant="caption" color="error">
                      {errors[`floorplans.${idx}.image`]}
                    </Typography>
                  ) : null}
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>

      {/* GALLERY */}
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Gallery Images</Typography>
          <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setImages((prev) => [...prev, { image: '' }])}>
            Add Image
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          {images.map((im, idx) => (
            <Paper key={im.id ?? idx} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">Image #{idx + 1}</Typography>
                  <IconButton
                    onClick={() => {
                      const input = galleryInputRefs.current[idx];
                      if (input) input.value = '';
                      setGalleryFileAt(idx, null);
                      setImages((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    sx={{ color: TRASH_COLOR }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>

                <Stack spacing={1}>
                  <Typography variant="subtitle2">Image *</Typography>

                  {!galleryPreviews[idx] && im.image ? (
                    projectsImagesUrl(im.image) ? (
                      <Box
                        sx={{
                          width: 260,
                          height: 160,
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
                          src={projectsImagesUrl(im.image) as string}
                          alt={`Gallery ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ opacity: 0.75 }}>
                        Current file: {im.image}
                      </Typography>
                    )
                  ) : null}

                  {galleryPreviews[idx] ? (
                    <Box
                      sx={{
                        width: 260,
                        height: 160,
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
                        src={galleryPreviews[idx] as string}
                        alt={`Gallery ${idx + 1} preview`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  ) : null}

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Button variant="outlined" component="label" disabled={saving}>
                      {im.image ? 'Replace Image' : 'Upload Image'}
                      <input
                        ref={(el) => {
                          galleryInputRefs.current[idx] = el;
                        }}
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setGalleryFileAt(idx, file);
                          setImages((prev) => prev.map((x, i) => (i === idx ? { ...x, image: file ? file.name : x.image } : x)));
                          e.currentTarget.value = '';
                        }}
                      />
                    </Button>

                    {(galleryFiles[idx] || im.image) ? (
                      <Button
                        variant="text"
                        disabled={saving}
                        sx={{ color: TRASH_COLOR }}
                        onClick={() => {
                          const input = galleryInputRefs.current[idx];
                          if (input) input.value = '';
                          setGalleryFileAt(idx, null);
                          setImages((prev) => prev.map((x, i) => (i === idx ? { ...x, image: '' } : x)));
                        }}
                      >
                        Remove
                      </Button>
                    ) : null}

                    {galleryFiles[idx] ? (
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        New: {galleryFiles[idx]?.name}
                      </Typography>
                    ) : im.image ? (
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Current: {im.image}
                      </Typography>
                    ) : null}
                  </Stack>

                  {errors[`images.${idx}.image`] ? (
                    <Typography variant="caption" color="error">
                      {errors[`images.${idx}.image`]}
                    </Typography>
                  ) : null}
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>

      {/* PAYMENT PLANS */}
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Payment Plans</Typography>
          <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setPaymentPlans((prev) => [...prev, { title: '', value: '', sub_title: '' }])}>
            Add Payment Plan
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          {paymentPlans.map((pp, idx) => (
            <Paper key={pp.id ?? idx} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">Plan #{idx + 1}</Typography>
                  <IconButton onClick={() => setPaymentPlans((prev) => prev.filter((_, i) => i !== idx))} sx={{ color: TRASH_COLOR }}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    label="Title * (e.g. 10%)"
                    value={pp.title}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPaymentPlans((prev) => prev.map((x, i) => (i === idx ? { ...x, title: v } : x)));
                    }}
                    fullWidth
                    error={Boolean(errors[`payment_plans.${idx}.title`])}
                    helperText={errors[`payment_plans.${idx}.title`] || ''}
                  />

                  <TextField
                    label="Value * (e.g. Upon Booking)"
                    value={pp.value}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPaymentPlans((prev) => prev.map((x, i) => (i === idx ? { ...x, value: v } : x)));
                    }}
                    fullWidth
                    error={Boolean(errors[`payment_plans.${idx}.value`])}
                    helperText={errors[`payment_plans.${idx}.value`] || ''}
                  />
                </Stack>

                <TextField
                  label="Sub Title (optional)"
                  value={pp.sub_title ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPaymentPlans((prev) => prev.map((x, i) => (i === idx ? { ...x, sub_title: v } : x)));
                  }}
                  fullWidth
                />
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>

      {/* LOCATIONS */}
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Locations</Typography>
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            disabled={locations.length > 0}
            onClick={() => setLocations((prev) => [...prev, { title: '', description: '', map_link: '' }])}
          >
            Add Location
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          {locations.map((loc, idx) => (
            <Paper key={loc.id ?? idx} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">Location #{idx + 1}</Typography>
                  <IconButton onClick={() => setLocations((prev) => prev.filter((_, i) => i !== idx))} sx={{ color: TRASH_COLOR }}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>

                <TextField
                  label="Title *"
                  value={loc.title}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLocations((prev) => prev.map((x, i) => (i === idx ? { ...x, title: v } : x)));
                  }}
                  fullWidth
                  error={Boolean(errors[`locations.${idx}.title`])}
                  helperText={errors[`locations.${idx}.title`] || ''}
                />

                <CkEditorField
                  label="Description *"
                  value={loc.description}
                  onChange={(value) => {
                    setLocations((prev) => prev.map((x, i) => (i === idx ? { ...x, description: value } : x)));
                  }}
                  error={Boolean(errors[`locations.${idx}.description`])}
                  helperText={errors[`locations.${idx}.description`] || ''}
                  minHeight={180}
                />

                <TextField
                  label="Map Link (optional)"
                  value={loc.map_link ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLocations((prev) => prev.map((x, i) => (i === idx ? { ...x, map_link: v } : x)));
                  }}
                  fullWidth
                />
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>

      {/* ACTIVE */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Status</Typography>
        <Divider sx={{ my: 2 }} />
        <FormControlLabel
          control={
            <Switch checked={project.active === 1} onChange={(e) => setProject((p) => ({ ...p, active: e.target.checked ? 1 : 0 }))} />
          }
          label={project.active === 1 ? 'Active' : 'Inactive'}
        />
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

      {/* Bottom actions */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => router.push('/dashboard/projects')} disabled={saving}>
            Back
          </Button>
          <Button variant="contained" type="submit" disabled={saving}>
            {saving ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <span>Saving...</span>
              </Stack>
            ) : (
              'Update Project'
            )}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}