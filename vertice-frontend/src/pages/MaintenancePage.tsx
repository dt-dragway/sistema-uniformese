import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Divider,
  Alert,
  AlertTitle,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WarningIcon from '@mui/icons-material/Warning';
import StorageIcon from '@mui/icons-material/Storage';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import axiosInstance from '../api/axiosInstance';
import DeleteConfirmDialog from '../components/common/DeleteConfirmDialog';

const MaintenancePage = () => {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDownloadBackup = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/maintenance/backup', {
        responseType: 'blob', // Important for file download
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `vertice-pos-backup-${new Date().toISOString().split('T')[0]}.sql`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setNotification({
        open: true,
        message: 'Copia de seguridad generada y descargada con éxito.',
        severity: 'success',
      });
    } catch (error) {
      setNotification({ open: true, message: 'Error al generar la copia de seguridad.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setIsRestoreDialogOpen(true);
    }
  };

  const handleConfirmRestore = async () => {
    if (!selectedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('backup', selectedFile);

    try {
      const response = await axiosInstance.post('/maintenance/restore', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setNotification({ open: true, message: response.data.message, severity: 'success' });
      // Suggest reload after a few seconds
      setTimeout(() => window.location.reload(), 3000);
    } catch (error: any) {
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Error crítico durante la restauración.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
      setSelectedFile(null);
    }
  };

  const handleCleanup = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post('/maintenance/cleanup');
      const details = response.data.details
        ? ` (Ventas: ${response.data.details.sales}, Sesiones: ${response.data.details.sessions})`
        : '';
      setNotification({ open: true, message: 'Limpieza completada con éxito.' + details, severity: 'success' });
    } catch (error: any) {
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Error al realizar la limpieza de datos.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
      setIsCleanupDialogOpen(false);
    }
  };

  return (
    <Box sx={{ p: 3 }} className="animate-snappy gpu-accelerated">
      <Typography
        variant="h4"
        sx={{
          mb: 4,
          fontWeight: 900,
          color: '#0f172a',
          fontFamily: '"Outfit", sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Mantenimiento del Sistema
      </Typography>

      <Grid container spacing={4}>
        {/* Backup Section */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{ p: 1.5, backgroundColor: 'rgba(2, 85, 165, 0.08)', borderRadius: '12px', mr: 2 }}>
                  <CloudDownloadIcon sx={{ fontSize: 32, color: '#2a6c8d' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontFamily: '"Outfit", sans-serif' }}>
                  Copia de Seguridad
                </Typography>
              </Box>

              <Typography variant="body2" paragraph sx={{ color: '#64748b', mb: 3, lineHeight: 1.6 }}>
                Genere un respaldo completo de toda la información del sistema (Productos, Ventas, Clientes, Historial).
                Se recomienda realizar esta acción al menos una vez por semana para proteger sus datos.
              </Typography>

              <Alert
                severity="info"
                variant="outlined"
                sx={{
                  mb: 4,
                  borderRadius: '12px',
                  backgroundColor: 'rgba(2, 85, 165, 0.04)',
                  borderColor: 'rgba(2, 85, 165, 0.15)',
                }}
              >
                El archivo se descargará en formato <strong>.SQL</strong> y puede ser guardado de forma segura en medios
                externos.
              </Alert>

              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <StorageIcon />}
                onClick={handleDownloadBackup}
                disabled={loading}
                sx={{
                  py: 2,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #2a6c8d 0%, #003780 100%)',
                  boxShadow: '0 10px 15px -3px rgba(2, 85, 165, 0.3)',
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #036cd2 0%, #004fb8 100%)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Generar Respaldo Ahora
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Restore Section */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{ p: 1.5, backgroundColor: 'rgba(220, 38, 38, 0.08)', borderRadius: '12px', mr: 2 }}>
                  <CloudUploadIcon sx={{ fontSize: 32, color: '#dc2626' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontFamily: '"Outfit", sans-serif' }}>
                  Restaurar Sistema
                </Typography>
              </Box>

              <Typography variant="body2" paragraph sx={{ color: '#64748b', mb: 3, lineHeight: 1.6 }}>
                Cargue un archivo de respaldo previo para restaurar el sistema a un punto anterior. Útil en casos de
                migración o recuperación.
              </Typography>

              <Alert
                severity="warning"
                variant="filled"
                sx={{ mb: 4, borderRadius: '12px', backgroundColor: '#dc2626' }}
              >
                <AlertTitle sx={{ fontWeight: 800 }}>¡ADVERTENCIA CRÍTICA!</AlertTitle>
                Esta acción borrará <strong>TODOS</strong> los datos actuales. Asegúrese de tener el archivo correcto
                antes de proceder.
              </Alert>

              <Button
                variant="outlined"
                component="label"
                fullWidth
                size="large"
                color="error"
                startIcon={<CloudUploadIcon />}
                disabled={loading}
                sx={{
                  py: 2,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '16px',
                  borderWidth: '2px',
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderWidth: '2px',
                    transform: 'translateY(-2px)',
                    backgroundColor: 'rgba(220, 38, 38, 0.05)',
                  },
                }}
              >
                Cargar Archivo SQL
                <input type="file" hidden accept=".sql" onChange={handleFileChange} />
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Cleanup Section */}
        <Grid item xs={12} md={6} sx={{ display: 'none' }}>
          <Card
            sx={{
              height: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{ p: 1.5, backgroundColor: 'rgba(234, 88, 12, 0.08)', borderRadius: '12px', mr: 2 }}>
                  <DeleteSweepIcon sx={{ fontSize: 32, color: '#ea580c' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontFamily: '"Outfit", sans-serif' }}>
                  Limpieza de Historial
                </Typography>
              </Box>

              <Typography variant="body2" paragraph sx={{ color: '#64748b', mb: 3, lineHeight: 1.6 }}>
                Elimine registros antiguos (ventas, cierres, movimientos) de más de 1 año para optimizar el rendimiento
                de la base de datos.
              </Typography>

              <Alert
                severity="warning"
                sx={{
                  mb: 4,
                  borderRadius: '12px',
                  backgroundColor: '#fff7ed',
                  color: '#9a3412',
                  border: '1px solid #ffedd5',
                }}
              >
                <AlertTitle sx={{ fontWeight: 800 }}>ACCIÓN IRREVERSIBLE</AlertTitle>
                Solo se eliminan registros históricos. Clientes, productos y usuarios permanecen intactos.
              </Alert>

              <Button
                variant="contained"
                fullWidth
                size="large"
                color="warning"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DeleteSweepIcon />}
                onClick={() => setIsCleanupDialogOpen(true)}
                disabled={loading}
                sx={{
                  py: 2,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Limpiar Datos de +1 Año
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <DeleteConfirmDialog
        open={isRestoreDialogOpen}
        onClose={() => setIsRestoreDialogOpen(false)}
        onConfirm={handleConfirmRestore}
        title="¿Confirmar Restauración Total?"
        message="¿Realmente desea reemplazar toda la base de datos actual? Se perderán todos los cambios realizados desde el último respaldo."
        itemName={selectedFile?.name}
      />

      <DeleteConfirmDialog
        open={isCleanupDialogOpen}
        onClose={() => setIsCleanupDialogOpen(false)}
        onConfirm={handleCleanup}
        title="¿Confirmar Limpieza de Historial?"
        message="Se eliminarán todas las ventas, cierres de caja y movimientos con más de 1 año de antigüedad. Esta acción no se puede deshacer."
        itemName="Datos Históricos (> 1 año)"
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert severity={notification.severity} variant="filled" sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MaintenancePage;
