'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
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
  const canEdit = Boolean(onEdit);
  const canToggle = Boolean(onToggle);

  const totalColumns = 7 + (canToggle ? 1 : 0) + (canEdit ? 1 : 0);

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

              {canToggle ? <TableCell sx={{ fontWeight: 700 }}>Status</TableCell> : null}

              {canEdit ? (
                <TableCell align="right" sx={{ width: 120, fontWeight: 700 }}>
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
                    No employees found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
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

                    {canToggle ? (
                      <TableCell>
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
                    ) : null}

                    {canEdit ? (
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