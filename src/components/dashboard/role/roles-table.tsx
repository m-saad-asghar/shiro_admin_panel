'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
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

export interface Role {
  id: string;
  title: string;
}

interface RolesTableProps {
  count?: number;
  page?: number;
  rows?: Role[];
  rowsPerPage?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
}

export function RolesTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
}: RolesTableProps): React.JSX.Element {
  const rowIds = React.useMemo(() => rows.map((r) => r.id), [rows]);

  const { selected } = useSelection(rowIds);

  const canEdit = Boolean(onEdit);
  const canDelete = Boolean(onDelete);
  const showActions = canEdit || canDelete;

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>

              {showActions ? (
                <TableCell align="right" sx={{ width: 140, fontWeight: 700 }}>
                  Actions
                </TableCell>
              ) : null}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) => {
              const isSelected = selected?.has(row.id);

              return (
                <TableRow hover key={row.id} selected={isSelected}>
                  <TableCell>
                    <Typography variant="subtitle2">{row.title}</Typography>
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
              );
            })}

            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showActions ? 2 : 1}>
                  <Typography variant="body2" color="text.secondary">
                    No roles found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
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