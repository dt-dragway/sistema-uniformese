import React from 'react';
import { Box, Typography, IconButton, Tooltip, Select, MenuItem, Pagination, styled } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
} from '@mui/icons-material';

const PaginationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3),
  backgroundColor: '#ffffff',
  borderTop: '1px solid rgba(0, 0, 0, 0.05)',
  borderBottomLeftRadius: '24px',
  borderBottomRightRadius: '24px',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
}));

const ControlsGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

interface ProfessionalPaginationProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  rowsPerPageOptions?: number[];
  labelRowsPerPage?: string;
}

export const ProfessionalPagination: React.FC<ProfessionalPaginationProps> = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50],
  labelRowsPerPage = 'Filas por página:',
}) => {
  const totalPages = Math.ceil(count / rowsPerPage);
  const from = count === 0 ? 0 : page * rowsPerPage + 1;
  const to = Math.min(count, (page + 1) * rowsPerPage);

  return (
    <PaginationContainer>
      {/* Rows per page selector */}
      <ControlsGroup>
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
          {labelRowsPerPage}
        </Typography>
        <Select
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(e as any)}
          size="small"
          sx={{
            height: '32px',
            fontSize: '0.85rem',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.1)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2a6c8d' },
          }}
        >
          {rowsPerPageOptions.map((option) => (
            <MenuItem key={option} value={option} sx={{ fontSize: '0.85rem' }}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </ControlsGroup>

      {/* Page information */}
      <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600 }}>
        Mostrando{' '}
        <span style={{ color: '#2a6c8d' }}>
          {from}-{to}
        </span>{' '}
        de <span style={{ color: '#2a6c8d' }}>{count}</span>
      </Typography>

      {/* Pagination controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Pagination
          count={totalPages}
          page={page + 1}
          onChange={(_e, p) => onPageChange(null, p - 1)}
          variant="outlined"
          shape="rounded"
          size="small"
          showFirstButton
          showLastButton
          sx={{
            '& .MuiPaginationItem-root': {
              borderRadius: '8px',
              fontWeight: 700,
              border: '1px solid rgba(0,0,0,0.05)',
              backgroundColor: '#ffffff',
              '&:hover': {
                backgroundColor: 'rgba(2, 85, 165, 0.05)',
                borderColor: '#2a6c8d',
              },
              '&.Mui-selected': {
                backgroundColor: '#2a6c8d',
                color: '#ffffff',
                borderColor: '#2a6c8d',
                '&:hover': {
                  backgroundColor: '#003780',
                },
              },
            },
          }}
        />
      </Box>
    </PaginationContainer>
  );
};
