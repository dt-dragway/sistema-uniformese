import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { ProfessionalPagination } from '../components/common/ProfessionalPagination';
import axiosInstance from '../api/axiosInstance';
import { format } from 'date-fns';

interface UserConnection {
  id: number;
  userId: number;
  ipAddress: string | null;
  userAgent: string | null;
  loginTime: string;
  user: {
    id: number;
    username: string;
    fullname: string | null;
    role: string;
  };
}

const UserConnectionsPage = () => {
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [total, setTotal] = useState(0);

  const fetchConnections = async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend uses 1-based pagination for page
      const response = await axiosInstance.get(`/connections?page=${page + 1}&limit=${rowsPerPage}`);
      setConnections(response.data.connections);
      setTotal(response.data.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el historial de conexiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExportExcel = async () => {
    try {
      const response = await axiosInstance.get('/reports/connections/export-excel', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_conexiones_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting Excel:', err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            color: '#0f172a',
            fontFamily: '"Outfit", sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Historial de Conexiones
        </Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportExcel}
          sx={{
            bgcolor: '#10b981',
            color: 'white',
            fontWeight: 700,
            borderRadius: '12px',
            textTransform: 'none',
            px: 3,
            '&:hover': {
              bgcolor: '#059669',
            },
          }}
        >
          Exportar Excel
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.05)',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Fecha y Hora</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Usuario</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Rol</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Dirección IP</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Dispositivo / Navegador</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && connections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : connections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: '#64748b' }}>
                  No hay conexiones registradas.
                </TableCell>
              </TableRow>
            ) : (
              connections.map((conn) => (
                <TableRow key={conn.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {format(new Date(conn.loginTime), 'dd/MM/yyyy hh:mm a')}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {conn.user.fullname || conn.user.username}
                    </Typography>
                    {conn.user.fullname && (
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {conn.user.username}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={conn.user.role === 'CASHIER' ? 'CAJERO' : conn.user.role}
                      color={conn.user.role === 'ADMIN' ? 'error' : 'success'}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', color: '#2a6c8d', fontWeight: 600 }}>
                    {conn.ipAddress || 'Desconocida'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: '#64748b', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {conn.userAgent || 'Desconocido'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <ProfessionalPagination
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[15, 30, 50]}
        />
      </TableContainer>
    </Box>
  );
};

export default UserConnectionsPage;
