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

import { useSelection } from '@/hooks/use-selection';

export interface Department {
  id: string;
  name: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface DepartmentsTableProps {
  count?: number;
  page?: number;
  rows?: Department[];
  rowsPerPage?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit?: (department: Department) => void;
  onDelete?: (department: Department) => void;
  onToggleStatus?: (department: Department, nextActive: boolean) => void;
}

export function DepartmentsTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
  onToggleStatus,
}: DepartmentsTableProps): React.JSX.Element {
  const rowIds = React.useMemo(() => rows.map((row) => row.id), [rows]);
  const { selected } = useSelection(rowIds);

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 750 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 170 }}>Status</TableCell>
              <TableCell align="right" sx={{ width: 140, fontWeight: 700 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) => {
              const isSelected = selected?.has(row.id);

              return (
                <TableRow hover key={row.id} selected={isSelected}>
                  <TableCell>
                    <Typography variant="subtitle2">{row.name}</Typography>
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Switch
                        checked={row.active}
                        onChange={(e) => onToggleStatus?.(row, e.target.checked)}
                        disabled={!onToggleStatus}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#0b4a35',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#0b4a35',
                          },
                        }}
                        inputProps={{ 'aria-label': `Toggle status for ${row.name}` }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {row.active ? 'Active' : 'Inactive'}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Edit">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onEdit?.(row)}
                            disabled={!onEdit}
                            sx={{ color: '#9f8151' }}
                          >
                            <PencilSimpleIcon fontSize="var(--icon-fontSize-md)" />
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title="Delete">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onDelete?.(row)}
                            disabled={!onDelete}
                            sx={{ color: '#FF0000' }}
                          >
                            <TrashIcon fontSize="var(--icon-fontSize-md)" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}

            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="body2" color="text.secondary">
                    No Departments found.
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