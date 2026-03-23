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
import Image from 'next/image';

import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';

export interface Developer {
  id: string;
  name: string;
  email: string;
  logo: string | null;
  thumbnail: string | null;
  active: number;
  created_at: string | null;
  updated_at: string | null;
}

interface DevelopersTableProps {
  count?: number;
  page?: number;
  rows?: Developer[];
  rowsPerPage?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit?: (developer: Developer) => void;
  onDelete?: (developer: Developer) => void;
  onToggle?: (developer: Developer, active: 0 | 1) => void;
}

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL?.replace(/\/$/, '') || '';

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function buildImageUrl(path?: string | null): string {
  if (path && path.trim() !== '') {
    if (path.startsWith('http')) return path;
    return `${IMAGE_BASE_URL}/${path}`;
  }
  return `${IMAGE_BASE_URL}/default_user.avif`;
}

export function DevelopersTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
  onToggle,
}: DevelopersTableProps): React.JSX.Element {
  const canToggle = Boolean(onToggle);
  const canEdit = Boolean(onEdit);
  const canDelete = Boolean(onDelete);
  const showActions = canEdit || canDelete;

  const totalColumns = 4 + (canToggle ? 1 : 0) + (showActions ? 1 : 0);

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 1100 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Thumbnail</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Logo</TableCell>
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
                    No developers found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const isOn = Number(row.active) === 1;

                return (
                  <TableRow hover key={row.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{row.name}</Typography>
                    </TableCell>

                    <TableCell>
                      <Image
                        src={buildImageUrl(row.thumbnail)}
                        alt={`${row.name} thumbnail`}
                        width={200}
                        height={150}
                        style={{ borderRadius: '10%', objectFit: 'cover' }}
                      />
                    </TableCell>

                    <TableCell>
                      <Image
                        src={buildImageUrl(row.logo)}
                        alt={`${row.name} logo`}
                        width={150}
                        height={50}
                        style={{ borderRadius: '10%', height: 'auto' }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(row.created_at)}
                      </Typography>
                    </TableCell>

                    {canToggle ? (
                      <TableCell>
                        <Switch
                          checked={isOn}
                          onChange={(e) => onToggle?.(row, e.target.checked ? 1 : 0)}
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
                );
              })
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
        rowsPerPageOptions={[5, 10, 25]}
        onPageChange={onPageChange ?? (() => {})}
        onRowsPerPageChange={onRowsPerPageChange ?? (() => {})}
      />
    </Card>
  );
}