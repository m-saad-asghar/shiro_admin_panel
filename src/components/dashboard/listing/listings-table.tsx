'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';

import usersImagesUrl from '@/helpers/usersImagesURL';
import Image from 'next/image';

export interface Listing {
  id: string;
  reference: string;
  first_image: string;
  property_t: string | null;
  price: number | null;
  community: string | null;
  sub_community: string | null;
  property: string | null;
  property_type: string | null;
  property_category: string | null;
  title: string | null;
  active: number;
  furnishing: string | null;
  created_at: string | null;
}

interface ListingsTableProps {
  count?: number;
  page?: number;
  rows?: Listing[];
  rowsPerPage?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit?: (listing: Listing) => void;
  onDelete?: (listing: Listing) => void;
  onToggle?: (listing: Listing) => void; // listings_update permission
}

function formatPrice(price: number | null): string {
  if (price === null || Number.isNaN(price)) return '-';
  try {
    return new Intl.NumberFormat('en-AE').format(price);
  } catch {
    return String(price);
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function ListingsTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
  onToggle,
}: ListingsTableProps): React.JSX.Element {
  const canToggle = Boolean(onToggle); // listings_update
  const canEdit = Boolean(onEdit);
  const canDelete = Boolean(onDelete);
  const showActions = canEdit || canDelete;

  const totalColumns = 11 + (canToggle ? 1 : 0) + (showActions ? 1 : 0);

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 1100 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Image</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Community</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Sub Community</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Property</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Furnishing</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>

              {canToggle ? (
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              ) : null}

              {showActions ? (
                <TableCell align="right" sx={{ width: 140, fontWeight: 700 }}>
                  Actions
                </TableCell>
              ) : null}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={totalColumns}>
                  <Typography variant="body2" color="text.secondary">
                    No listing found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow hover key={row.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{row.reference || '-'}</Typography>
                  </TableCell>

                  <TableCell>
                    <Image
                      src={
                        row.first_image && row.first_image.trim() !== ''
                          ? usersImagesUrl(row.first_image)
                          : usersImagesUrl('default_user.avif')
                      }
                      alt={row.first_image || 'Listing image'}
                      width={100}
                      height={100}
                      style={{
                        borderRadius: '10%',
                        objectFit: 'cover',
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="subtitle2" noWrap title={row.title ?? ''}>
                      {row.title ?? '-'}
                    </Typography>
                  </TableCell>

                  <TableCell>{row.property_type ?? '-'}</TableCell>
                  <TableCell>{row.property_category ?? '-'}</TableCell>
                  <TableCell>{row.community ?? '-'}</TableCell>
                  <TableCell>{row.sub_community ?? '-'}</TableCell>
                  <TableCell>{row.property ?? '-'}</TableCell>

                  <TableCell>
                    <Typography variant="subtitle2">{formatPrice(row.price)}</Typography>
                  </TableCell>

                  <TableCell>{row.furnishing ?? '-'}</TableCell>

                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(row.created_at)}
                    </Typography>
                  </TableCell>

                  {canToggle ? (
                    <TableCell>
                      <Switch
                        checked={row.active === 1}
                        onChange={() => onToggle?.(row)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#0b4a35',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#0b4a35',
                          },
                        }}
                      />
                    </TableCell>
                  ) : null}

                  {showActions ? (
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {canEdit ? (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => onEdit?.(row)}
                              sx={{ color: '#9f8151' }}
                            >
                              <PencilSimpleIcon fontSize="var(--icon-fontSize-md)" />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        {canDelete ? (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => onDelete?.(row)}
                              sx={{ color: '#FF0000' }}
                            >
                              <TrashIcon fontSize="var(--icon-fontSize-md)" />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                      </Stack>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>

      <Divider />

      <TablePagination
        component="div"
        count={count}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={onPageChange ?? (() => {})}
        onRowsPerPageChange={onRowsPerPageChange ?? (() => {})}
      />
    </Card>
  );
}