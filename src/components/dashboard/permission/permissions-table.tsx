'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';

export type PermissionGroupRow = {
  id: string;
  title: string;
  permissions: { id: string; title: string }[];
};

type Props = {
  count: number;
  page: number;
  rows: PermissionGroupRow[];
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit: (row: PermissionGroupRow) => void;
};

export function PermissionsTable({
  count,
  page,
  rows,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
}: Props): React.JSX.Element {
  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, width: 260 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Permissions</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 90 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="body2" color="text.secondary">
                    No data found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{row.title}</Typography>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {row.permissions.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      ) : (
                        row.permissions.map((p) => (
                          <Chip
                            key={p.id}
                            label={p.title}
                            size="small"
                            sx={{
                              backgroundColor: '#094834',
                              color: '#fff',
                              fontWeight: 500,
                              '& .MuiChip-label': { color: '#fff' },
                              padding: '10px',
                              paddingTop: '20px',
                              paddingBottom: '20px'
                            }}
                          />
                        ))
                      )}
                    </Box>
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton onClick={() => onEdit(row)} size="small"  style={{color: "#9f8151"}}>
                        <PencilSimpleIcon fontSize="var(--icon-fontSize-md)" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={count}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Paper>
  );
}
