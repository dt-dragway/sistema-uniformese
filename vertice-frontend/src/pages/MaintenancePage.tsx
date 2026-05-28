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
      
      setNotification({ open: true, message: 'Copia de seguridad generada y descargada con éxito.', severity: 'success' });
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
        severity: 'error' 
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
      const details = response.data.details ? ` (Ventas: ${response.data.details.sales}, Sesiones: ${response.data.details.sessions})` : '';
      setNotification({ open: true, message: 'Limpieza completada con éxito.' + details, severity: 'success' });
    } catch (error: any) {
      setNotification({ 
        open: true, 
        message: error.response?.data?.message || 'Error al realizar la limpieza de datos.', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
      setIsCleanupDialogOpen(false);
    }
  };

  return (
    <Box sx={{ p: 3 }} className="animate-snappy gpu-accelerated">
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 4, fontFamily: '"Kanit", sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Mantenimiento del Sistema
      </Typography>
 
      <Grid container spacing={4}>
        {/* Backup Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', background: 'rgba(10, 25, 47, 0.65)', backdropFilter: 'blur(20px)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: 'var(--institutional-shadow)' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CloudDownloadIcon sx={{ fontSize: 40, color: '#0255A5', mr: 2 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: '"Kanit", sans-serif' }}>Copia de Seguridad</Typography>
              </Box>
              
              <Typography variant="body2" paragraph sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Genere un respaldo completo de toda la información del sistema (Productos, Ventas, Clientes, Historial). 
                Se recomienda realizar esta acción al menos una vez por semana.
              </Typography>
 
              <Alert severity="info" variant="outlined" sx={{ mb: 4, borderColor: 'rgba(2, 85, 165, 0.3)', color: 'rgba(255,255,255,0.8)' }}>
                El archivo se descargará en formato .SQL y puede ser guardado en un pendrive o en la nube.
              </Alert>
 
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <StorageIcon />}
                onClick={handleDownloadBackup}
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '0.95rem',
                  letterSpacing: '0.2em', // Municipal Style
                  fontWeight: 900,
                  borderRadius: '9999px', // Pill shape
                  background: 'linear-gradient(135deg, #0255A5 0%, #003780 100%)',
                  boxShadow: '0 4px 15px rgba(0, 55, 128, 0.3)',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #036cd2 0%, #004fb8 100%)',
                    boxShadow: '0 8px 25px rgba(2, 85, 165, 0.55)',
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(1px)',
                  },
                  '&:disabled': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.3)',
                  }
                }}
              >
                RESPALDAR TODA LA BASE DE DATOS
              </Button>
            </CardContent>
          </Card>
        </Grid>
 
        {/* Restore Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', background: 'rgba(10, 25, 47, 0.65)', backdropFilter: 'blur(20px)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: 'var(--institutional-shadow)' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CloudUploadIcon sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: '"Kanit", sans-serif' }}>Restaurar Sistema</Typography>
              </Box>
 
              <Typography variant="body2" paragraph sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Cargue un archivo de respaldo previo para restaurar el sistema a un punto anterior. 
              </Typography>
 
              <Alert severity="warning" variant="filled" sx={{ mb: 4, borderRadius: 4 }}>
                <AlertTitle sx={{ fontWeight: 'bold' }}>¡ADVERTENCIA CRÍTICA!</AlertTitle>
                Esta acción borrará <strong>TODOS</strong> los datos actuales y los reemplazará con los del archivo seleccionado. No se puede deshacer.
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
                  py: 1.5,
                  fontSize: '0.95rem',
                  letterSpacing: '0.2em',
                  fontWeight: 900,
                  borderRadius: '9999px',
                  borderWidth: '2px',
                  transition: 'all 0.25s ease',
                  '&:hover': { 
                    borderWidth: '2px',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(244, 67, 54, 0.3)',
                  },
                  '&:active': {
                    transform: 'translateY(1px)',
                  }
                }}
              >
                SELECCIONAR ARCHIVO Y RESTAURAR
                <input
                  type="file"
                  hidden
                  accept=".sql"
                  onChange={handleFileChange}
                />
              </Button>
            </CardContent>
          </Card>
        </Grid>
 
        {/* Cleanup Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', background: 'rgba(10, 25, 47, 0.65)', backdropFilter: 'blur(20px)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: 'var(--institutional-shadow)' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <DeleteSweepIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: '"Kanit", sans-serif' }}>Limpieza de Datos Históricos</Typography>
              </Box>
 
              <Typography variant="body2" paragraph sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Elimine registros antiguos (ventas, tickets, cierres de caja, movimientos) que tengan más de 1 año de antigüedad.
                Esta acción ayuda a liberar espacio y mejorar el rendimiento.
              </Typography>
 
              <Alert severity="warning" variant="filled" sx={{ mb: 4, borderRadius: 4 }}>
                <AlertTitle sx={{ fontWeight: 'bold' }}>¡ACCIÓN IRREVERSIBLE!</AlertTitle>
                Se eliminarán permanentemente las ventas y reportes antiguos. Los clientes, usuarios e inventario <strong>NO</strong> se verán afectados.
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
                  py: 1.5,
                  fontSize: '0.95rem',
                  letterSpacing: '0.2em',
                  fontWeight: 900,
                  borderRadius: '9999px',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(237, 108, 2, 0.3)',
                  },
                  '&:active': {
                    transform: 'translateY(1px)',
                  }
                }}
              >
                ELIMINAR DATOS ANTIGUOS (&gt; 1 AÑO)
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
