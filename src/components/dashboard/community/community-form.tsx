'use client';

import * as React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export type CommunityFormValues = {
  name: string;
  slug: string;
  description: string;
  selling_point: string;
  about: string;
  main_image: string;
  is_area: boolean;
  active: boolean;
};

interface CommunityFormProps {
  mode: 'add' | 'edit';
  values: CommunityFormValues;
  selectedImageFile?: File | null;
  selectedImagePreview?: string;
  onChange: (field: keyof CommunityFormValues, value: string | boolean) => void;
  onImageSelect?: (file: File | null, preview: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting?: boolean;
}

type CkEditorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

function CkEditorField({
  label,
  value,
  onChange,
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
    </Stack>
  );
}

export function CommunityForm({
  mode,
  values,
  selectedImageFile = null,
  selectedImagePreview = '',
  onChange,
  onImageSelect,
  onSubmit,
  onCancel,
  submitting = false,
}: CommunityFormProps): React.JSX.Element {
  const isEdit = mode === 'edit';
  const [slugTouched, setSlugTouched] = React.useState(false);
  const previousModeRef = React.useRef(mode);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (previousModeRef.current !== mode) {
      setSlugTouched(false);
      previousModeRef.current = mode;
    }
  }, [mode]);

  const handleNameChange = (value: string) => {
    onChange('name', value);

    if (!slugTouched) {
      onChange('slug', slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    onChange('slug', slugify(value));
  };

  const handlePickImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.alert('Please select a valid image file.');
      return;
    }

    const preview = URL.createObjectURL(file);

    if (typeof onImageSelect === 'function') {
      onImageSelect(file, preview);
    } else {
      onChange('main_image', preview);
    }
  };

  const handleRemoveImage = () => {
    if (typeof onImageSelect === 'function') {
      onImageSelect(null, '');
    }

    onChange('main_image', '');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const imageToShow = selectedImagePreview || values.main_image || '';
  const hasSelectedFile = Boolean(selectedImageFile);

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <div>
            <Typography variant="h5">
              {isEdit ? 'Edit Community' : 'Add Community'}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Only name and slug are required. All other fields are optional.
            </Typography>
          </div>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Name"
                value={values.name}
                onChange={(e) => handleNameChange(e.target.value)}
                fullWidth
                required
                inputProps={{ maxLength: 256 }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Slug"
                value={values.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                fullWidth
                required
                inputProps={{ maxLength: 256 }}
                helperText="Auto-generated from name, but you can edit it."
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle2">Main Image</Typography>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />

                {imageToShow ? (
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 2,
                    }}
                  >
                    <Box
                      component="img"
                      src={imageToShow}
                      alt="Selected community"
                      sx={{
                        width: '100%',
                        maxHeight: 320,
                        objectFit: 'cover',
                        borderRadius: 2,
                        display: 'block',
                        mb: 2,
                      }}
                    />

                    <Stack direction="row" spacing={2}>
                      <Button variant="outlined" onClick={handlePickImageClick}>
                        {hasSelectedFile ? 'Change Selected Image' : 'Change Image'}
                      </Button>

                      <Button
                        variant="text"
                        color="error"
                        onClick={handleRemoveImage}
                      >
                        Remove Image
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: '1px dashed',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      No image selected
                    </Typography>

                    <Button variant="outlined" onClick={handlePickImageClick}>
                      Select Image
                    </Button>
                  </Box>
                )}
              </Stack>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Description"
                value={values.description}
                onChange={(e) => onChange('description', e.target.value)}
                fullWidth
                multiline
                minRows={3}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <CkEditorField
                label="Selling Point"
                value={values.selling_point}
                onChange={(value) => onChange('selling_point', value)}
                minHeight={180}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <CkEditorField
                label="About"
                value={values.about}
                onChange={(value) => onChange('about', value)}
                minHeight={220}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={values.is_area}
                    onChange={(e) => onChange('is_area', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#0b4a35',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#0b4a35',
                      },
                    }}
                  />
                }
                label={values.is_area ? 'Marked as Area' : 'Not an Area'}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={values.active}
                    onChange={(e) => onChange('active', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#0b4a35',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#0b4a35',
                      },
                    }}
                  />
                }
                label={values.active ? 'Active' : 'Inactive'}
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="text" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={onSubmit}
              disabled={submitting || !values.name.trim() || !values.slug.trim()}
              startIcon={submitting ? <CircularProgress size={16} /> : undefined}
            >
              {submitting
                ? isEdit
                  ? 'Updating...'
                  : 'Creating...'
                : isEdit
                  ? 'Update Community'
                  : 'Create Community'}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}