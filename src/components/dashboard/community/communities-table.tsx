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

export interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  selling_point?: string | null;
  about?: string | null;
  main_image?: string | null;
  is_area: boolean;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CommunitiesTableProps {
  count?: number;
  page?: number;
  rows?: Community[];
  rowsPerPage?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit?: (community: Community) => void;
  onDelete?: (community: Community) => void;
  onToggleStatus?: (community: Community, nextActive: boolean) => void;
}

export function CommunitiesTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
  onToggleStatus,
}: CommunitiesTableProps): React.JSX.Element {
  const rowIds = React.useMemo(() => rows.map((r) => r.id), [rows]);
  const { selected } = useSelection(rowIds);

  const canToggle = Boolean(onToggleStatus);
  const canEdit = Boolean(onEdit);
  const canDelete = Boolean(onDelete);
  const showActions = canEdit || canDelete;

  const totalColumns = 1 + (canToggle ? 1 : 0) + (showActions ? 1 : 0);

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 750 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>

              {canToggle ? (
                <TableCell sx={{ fontWeight: 700, width: 170 }}>Status</TableCell>
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
                    No Communities found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const isSelected = selected?.has(row.id);

                return (
                  <TableRow hover key={row.id} selected={isSelected}>
                    <TableCell>
                      <Typography variant="subtitle2">{row.name}</Typography>
                    </TableCell>

                    {canToggle ? (
                      <TableCell>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Switch
                            checked={row.active}
                            onChange={(e) => onToggleStatus?.(row, e.target.checked)}
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