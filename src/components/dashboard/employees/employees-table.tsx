'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
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
import employeesImagesUrl from '@/helpers/employeesImagesURL';

import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string | null;
  position: string | null;
  phone: string | null;
  whatsapp: string | null;
  profile_picture: string | null;
  active: number;
  created_at: string | null;
}

interface EmployeesTableProps {
  count?: number;
  page?: number;
  rows?: Employee[];
  rowsPerPage?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  onToggle?: (employee: Employee, active: 0 | 1) => void;
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
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${IMAGE_BASE_URL}/${path.replace(/^\/+/, '')}`;
  }
  return `${IMAGE_BASE_URL}/default_user.avif`;
}

function formatPhone(value: string | null | undefined): string {
  if (!value) return '-';
  return value;
}

function buildWhatsAppLink(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.replace(/[^\d]/g, '');
  if (!cleaned) return null;
  return `https://wa.me/${cleaned}`;
}

export function EmployeesTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onToggle,
}: EmployeesTableProps): React.JSX.Element {
  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 1400 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Profile</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Position</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>WhatsApp</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="right" sx={{ width: 120, fontWeight: 700 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) => {
              const isOn = Number(row.active) === 1;
              const whatsappLink = buildWhatsAppLink(row.whatsapp);

              return (
                <TableRow hover key={row.id}>
                  <TableCell>
                    <Image
                     src={employeesImagesUrl(row.profile_picture ?? undefined)}
                      alt={row.name}
                      width={56}
                      height={56}
                      style={{
                        borderRadius: '50%',
                        objectFit: 'cover',
                        width: 56,
                        height: 56,
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2">{row.name || '-'}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {row.email || '-'}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {row.department || '-'}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {row.position || '-'}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatPhone(row.phone)}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {whatsappLink ? (
                      <Link
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                      >
                        {row.whatsapp}
                      </Link>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(row.created_at)}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {/* <Chip
                      label={isOn ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        backgroundColor: isOn ? '#e6f4ea' : '#fdecea',
                        color: isOn ? '#1e4620' : '#b42318',
                        mb: 1,
                      }}
                    /> */}
                    <Box>
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
                    </Box>
                  </TableCell>

                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => onEdit?.(row)}
                          sx={{ color: '#9f8151' }}
                        >
                          <PencilSimpleIcon fontSize="var(--icon-fontSize-md)" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}

            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <Typography variant="body2" color="text.secondary">
                    No employees found.
                  </Typography>
                </TableCell>
              </TableRow>
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