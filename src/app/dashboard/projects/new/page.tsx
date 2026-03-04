'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

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
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import OutlinedInput from '@mui/material/OutlinedInput';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};

type DropdownItem = { id: number; name: string };

type ProjectCreate = {
  name: string;
  slug: string;
  description: string | null;

  main_image: string | null;
  brochure: string | null;

  community_id: number;
  community_name: string;   // ✅ add this
  developer_id: number;

  starting_price: string | null;
  handover: string | null;
  payment_plan: string | null;
  payment_plan_description: string | null;

  active: 0 | 1;
};

type FaqRow = {
  title: string;
  description: string;
};

type FloorplanRow = {
  title: string;
  image: string; // filename
};

type ImageRow = {
  image: string; // filename
};

type PaymentPlanRow = {
  title: string;
  value: string;
  sub_title: string | null;
};

type LocationRow = {
  title: string;
  description: string;
  map_link: string | null;
};

type UspRow = {
  title: string;
  description: string;
  main_image: string; // filename
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

export default function NewProjectPage(): React.JSX.Element {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const CREATE_ENDPOINT = apiBase ? `${apiBase}/admin/save_project` : '';

  const COMMUNITIES_ENDPOINT = apiBase ? `${apiBase}/admin/fetch_communities` : '';
  const DEVELOPERS_ENDPOINT = apiBase ? `${apiBase}/admin/fetch_developers_dropdown` : '';
  const AMENITIES_ENDPOINT = apiBase ? `${apiBase}/admin/fetch_amenities` : '';

  const [saving, setSaving] = React.useState(false);
  const [loadingDropdowns, setLoadingDropdowns] = React.useState(false);

  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('');
  const [toastSeverity, setToastSeverity] = React.useState<'success' | 'error'>('success');

  const [errors, setErrors] = React.useState<FormErrors>({});

  const [project, setProject] = React.useState<ProjectCreate>({
    name: '',
    slug: '',
    description: '',
    main_image: '',
    brochure: '',
    community_id: 0,
    community_name: '',   // ✅ add this
    developer_id: 0,
    starting_price: '',
    handover: '',
    payment_plan: '',
    payment_plan_description: '',
    active: 1,
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);

  // dropdown data
  const [communities, setCommunities] = React.useState<DropdownItem[]>([]);
  const [developers, setDevelopers] = React.useState<DropdownItem[]>([]);
  const [amenities, setAmenities] = React.useState<DropdownItem[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = React.useState<number[]>([]);

  // sections
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

  // ===============================
  // FILE STATE (uploaders)
  // ===============================

  // Project main image
  const [projectMainImageFile, setProjectMainImageFile] = React.useState<File | null>(null);
  const [projectMainImagePreview, setProjectMainImagePreview] = React.useState<string | null>(null);
  const projectMainImageRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!projectMainImageFile) {
      if (projectMainImagePreview) URL.revokeObjectURL(projectMainImagePreview);
      setProjectMainImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(projectMainImageFile);
    setProjectMainImagePreview(url);
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectMainImageFile]);

  const removeProjectMainImage = () => {
    setProjectMainImageFile(null);
    if (projectMainImageRef.current) projectMainImageRef.current.value = '';
    setProject((p) => ({ ...p, main_image: '' }));
  };

  // Brochure (PDF)
  const [brochureFile, setBrochureFile] = React.useState<File | null>(null);
  const brochureRef = React.useRef<HTMLInputElement | null>(null);

  const removeBrochure = () => {
    setBrochureFile(null);
    if (brochureRef.current) brochureRef.current.value = '';
    setProject((p) => ({ ...p, brochure: '' }));
  };

  // USP main image
  const [uspMainImageFile, setUspMainImageFile] = React.useState<File | null>(null);
  const [uspMainImagePreview, setUspMainImagePreview] = React.useState<string | null>(null);
  const uspMainImageRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!uspMainImageFile) {
      if (uspMainImagePreview) URL.revokeObjectURL(uspMainImagePreview);
      setUspMainImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(uspMainImageFile);
    setUspMainImagePreview(url);
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uspMainImageFile]);

  const removeUspMainImage = () => {
    setUspMainImageFile(null);
    if (uspMainImageRef.current) uspMainImageRef.current.value = '';
    setUsp((u) => ({ ...u, main_image: '' }));
  };

  // Floorplan files by index
  const [floorplanFiles, setFloorplanFiles] = React.useState<Record<number, File | null>>({});
  const [floorplanPreviews, setFloorplanPreviews] = React.useState<Record<number, string | null>>({});
  const floorplanInputRefs = React.useRef<Record<number, HTMLInputElement | null>>({});

  React.useEffect(() => {
    return () => {
      Object.values(floorplanPreviews).forEach((u) => u && URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Gallery image files by index
  const [galleryFiles, setGalleryFiles] = React.useState<Record<number, File | null>>({});
  const [galleryPreviews, setGalleryPreviews] = React.useState<Record<number, string | null>>({});
  const galleryInputRefs = React.useRef<Record<number, HTMLInputElement | null>>({});

  React.useEffect(() => {
    return () => {
      Object.values(galleryPreviews).forEach((u) => u && URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // ===============================

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

  // slug auto
  React.useEffect(() => {
    if (!slugManuallyEdited) {
      setProject((p) => ({ ...p, slug: slugify(p.name) }));
      setErrors((prev) => {
        const { slug, ...rest } = prev;
        return rest;
      });
    }
  }, [project.name, slugManuallyEdited]);

  // load dropdowns
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

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
      if (!loc.description.trim()) next[`locations.${i}.description`] = 'Description required';
      // ✅ removed main_image validation
    });

    if (usp.title.trim() && !usp.description.trim()) next.usp_description = 'USP description required if USP title exists';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiBase) return showToast('API base missing', 'error');
    if (!CREATE_ENDPOINT) return showToast('Create endpoint missing', 'error');

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

      // 1) Main Project Image
      if (projectMainImageFile) {
        formData.append('project_main_image', projectMainImageFile);
      }

      // 2) USP Main Image
      if (uspMainImageFile) {
        formData.append('usp_main_image', uspMainImageFile);
      }

      // 3) Brochure PDF
      if (brochureFile) {
        formData.append('brochure', brochureFile);
      }

      // 4) Floorplan images
      Object.entries(floorplanFiles).forEach(([idx, file]) => {
        if (file) formData.append(`floorplan_images[${idx}]`, file);
      });

      // 5) Gallery images
      Object.entries(galleryFiles).forEach(([idx, file]) => {
        if (file) formData.append(`gallery_images[${idx}]`, file);
      });

      // ✅ removed location_images upload entirely

      const res = await fetch(CREATE_ENDPOINT, {
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
        const msg = apiRes?.message || firstError(apiRes?.errors) || `Create failed (${res.status})`;
        throw new Error(msg);
      }

      showToast(apiRes?.message || 'Project created successfully', 'success');
      router.push('/dashboard/projects');
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Create failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const amenitiesLabel = React.useMemo(() => {
    const map = new Map(amenities.map((a) => [a.id, a.name]));
    return selectedAmenityIds.map((id) => map.get(id) || String(id)).join(', ');
  }, [amenities, selectedAmenityIds]);

  return (
    <Stack spacing={3} component="form" onSubmit={handleCreate}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Add Project</Typography>

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
              'Create Project'
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

          <TextField
            label="Description"
            value={project.description ?? ''}
            onChange={(e) => setProject((p) => ({ ...p, description: e.target.value }))}
            fullWidth
            multiline
            minRows={4}
          />

          {/* Main image uploader */}
          <Stack spacing={1}>
            <Typography variant="subtitle2">Main Image</Typography>

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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={projectMainImagePreview}
                  alt="Main image preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            ) : null}

            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" component="label" disabled={saving}>
                Upload Main Image
                <input
                  ref={projectMainImageRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setProjectMainImageFile(file);
                    setProject((p) => ({ ...p, main_image: file ? file.name : '' }));
                    e.currentTarget.value = '';
                  }}
                />
              </Button>

              {projectMainImageFile && (
                <Button variant="text" onClick={removeProjectMainImage} disabled={saving} sx={{ color: TRASH_COLOR }}>
                  Remove
                </Button>
              )}

              {projectMainImageFile ? (
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {projectMainImageFile.name}
                </Typography>
              ) : null}
            </Stack>
          </Stack>

          {/* Brochure PDF uploader */}
          <Stack spacing={1}>
            <Typography variant="subtitle2">Brochure (PDF)</Typography>

            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" component="label" disabled={saving}>
                Upload Brochure (PDF)
                <input
                  ref={brochureRef}
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setBrochureFile(file);
                    setProject((p) => ({ ...p, brochure: file ? file.name : '' }));
                    e.currentTarget.value = '';
                  }}
                />
              </Button>

              {brochureFile && (
                <Button variant="text" onClick={removeBrochure} disabled={saving} sx={{ color: TRASH_COLOR }}>
                  Remove
                </Button>
              )}

              {brochureFile ? (
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {brochureFile.name}
                </Typography>
              ) : null}
            </Stack>
          </Stack>

          {/* Community + Developer dropdowns */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            {/* COMMUNITY */}
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
                ListboxProps={{
                  style: { maxHeight: 300, overflow: 'auto' },
                }}
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

            {/* DEVELOPER */}
            <FormControl fullWidth error={Boolean(errors.developer_id)} disabled={loadingDropdowns || saving}>
              <Autocomplete
                options={developers}
                value={developers.find((d) => d.id === project.developer_id) ?? null}
                onChange={(_, newValue) => {
                  const id = newValue?.id ?? 0;
                  setProject((p) => ({ ...p, developer_id: id }));
                  setErrors((prev) => {
                    const { developer_id, ...rest } = prev;
                    return rest;
                  });
                }}
                getOptionLabel={(option) => option?.name ?? ''}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disabled={loadingDropdowns || saving}
                ListboxProps={{
                  style: { maxHeight: 300, overflow: 'auto' },
                }}
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
            <TextField
              label="Payment Plan Description"
              value={project.payment_plan_description ?? ''}
              onChange={(e) => setProject((p) => ({ ...p, payment_plan_description: e.target.value }))}
              fullWidth
              multiline
              minRows={3}
            />
          </Stack>
        </Stack>
      </Paper>

      {/* AMENITIES (multi select) */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Amenities</Typography>
        <Divider sx={{ my: 2 }} />

        <FormControl fullWidth disabled={loadingDropdowns || saving}>
          <Autocomplete
            multiple
            options={amenities}
            value={amenities.filter((a) => selectedAmenityIds.includes(a.id))}
            onChange={(_, newValue) => {
              setSelectedAmenityIds(newValue.map((a) => a.id));
            }}
            getOptionLabel={(option) => option?.name ?? ''}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disableCloseOnSelect
            ListboxProps={{
              style: { maxHeight: 300, overflow: 'auto' },
            }}
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
                      '&:hover': {
                        color: '#ddd',
                      },
                    },
                  }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Amenities"
              />
            )}
          />
        </FormControl>
      </Paper>

      {/* USP */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Unique Selling Point (Single)</Typography>
        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          <TextField label="USP Title" value={usp.title} onChange={(e) => setUsp((u) => ({ ...u, title: e.target.value }))} fullWidth />

          <TextField
            label="USP Description"
            value={usp.description}
            onChange={(e) => setUsp((u) => ({ ...u, description: e.target.value }))}
            multiline
            minRows={4}
            fullWidth
            error={Boolean(errors.usp_description)}
            helperText={errors.usp_description || ''}
          />

          <Stack spacing={1}>
            <Typography variant="subtitle2">USP Main Image</Typography>

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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uspMainImagePreview}
                  alt="USP image preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            ) : null}

            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="outlined" component="label" disabled={saving}>
                Upload USP Image
                <input
                  ref={uspMainImageRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setUspMainImageFile(file);
                    setUsp((u) => ({ ...u, main_image: file ? file.name : '' }));
                    e.currentTarget.value = '';
                  }}
                />
              </Button>

              {uspMainImageFile && (
                <Button variant="text" onClick={removeUspMainImage} disabled={saving} sx={{ color: TRASH_COLOR }}>
                  Remove
                </Button>
              )}

              {uspMainImageFile ? (
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {uspMainImageFile.name}
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
            <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
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
            <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={floorplanPreviews[idx] as string}
                        alt={`Floorplan ${idx + 1} preview`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  ) : null}

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Button variant="outlined" component="label" disabled={saving}>
                      Upload Floorplan
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
                          setFloorplans((prev) => prev.map((x, i) => (i === idx ? { ...x, image: file ? file.name : '' } : x)));
                          e.currentTarget.value = '';
                        }}
                      />
                    </Button>

                    {floorplanFiles[idx] ? (
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
                        {floorplanFiles[idx]?.name}
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
            <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={galleryPreviews[idx] as string}
                        alt={`Gallery ${idx + 1} preview`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  ) : null}

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Button variant="outlined" component="label" disabled={saving}>
                      Upload Image
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
                          setImages((prev) => prev.map((x, i) => (i === idx ? { ...x, image: file ? file.name : '' } : x)));
                          e.currentTarget.value = '';
                        }}
                      />
                    </Button>

                    {galleryFiles[idx] ? (
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
                        {galleryFiles[idx]?.name}
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
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            onClick={() => setPaymentPlans((prev) => [...prev, { title: '', value: '', sub_title: '' }])}
          >
            Add Payment Plan
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          {paymentPlans.map((pp, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
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
            <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">Location #{idx + 1}</Typography>
                  <IconButton
                    onClick={() => {
                      setLocations((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    sx={{ color: TRASH_COLOR }}
                  >
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

                <TextField
                  label="Description *"
                  value={loc.description}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLocations((prev) => prev.map((x, i) => (i === idx ? { ...x, description: v } : x)));
                  }}
                  fullWidth
                  multiline
                  minRows={3}
                  error={Boolean(errors[`locations.${idx}.description`])}
                  helperText={errors[`locations.${idx}.description`] || ''}
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

      {/* ✅ ACTIVE ONLY AT THE END */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Status</Typography>
        <Divider sx={{ my: 2 }} />
        <FormControlLabel
          control={
            <Switch
              checked={project.active === 1}
              onChange={(e) => setProject((p) => ({ ...p, active: e.target.checked ? 1 : 0 }))}
            />
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
              'Create Project'
            )}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}