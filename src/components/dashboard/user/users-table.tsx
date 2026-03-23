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
import usersImagesUrl from '@/helpers/usersImagesURL';
import Image from 'next/image';

import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  role: string;
  profile_image: string;
  active: number;
  created_at: string;
  updated_at: string;
}

interface UsersTableProps {
  count?: number;
  page?: number;
  rows?: User[];
  rowsPerPage?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onToggle?: (user: User) => void;
}

export function UsersTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
  onToggle,
}: UsersTableProps): React.JSX.Element {
  const canEdit = Boolean(onEdit);
  const canDelete = Boolean(onDelete);
  const canToggle = Boolean(onToggle);
  const showActions = canEdit || canDelete;

  const totalColumns = 6 + (canToggle ? 1 : 0) + (showActions ? 1 : 0);

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Profile Image</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>

              {canToggle ? <TableCell sx={{ fontWeight: 700 }}>Status</TableCell> : null}

              <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>

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
                    No users found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow hover key={row.id}>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {row.first_name} {row.last_name}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Image
                      src={
                        row.profile_image && row.profile_image.trim() !== ''
                          ? usersImagesUrl(row.profile_image)
                          : usersImagesUrl('default_user.avif')
                      }
                      alt={`${row.first_name} ${row.last_name}`}
                      width={100}
                      height={100}
                      style={{
                        borderRadius: '10%',
                        objectFit: 'cover',
                      }}
                    />
                  </TableCell>

                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.phone_number}</TableCell>
                  <TableCell>{row.role}</TableCell>

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

                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(row.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Typography>
                  </TableCell>

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
        rowsPerPageOptions={[5, 10, 25]}
        onPageChange={onPageChange ?? (() => {})}
        onRowsPerPageChange={onRowsPerPageChange ?? (() => {})}
      />
    </Card>
  );
}