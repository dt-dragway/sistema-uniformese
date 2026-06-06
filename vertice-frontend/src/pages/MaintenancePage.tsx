import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  AlertTitle,
  CircularProgress,
  Snackbar,
  Container,
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
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
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#0f172a', mb: 3 }}>
        Base de Datos
      </Typography>

      <Typography variant="body1" sx={{ color: '#64748b', mb: 4, maxWidth: '800px' }}>
        Gestiona la seguridad y el respaldo de la información vital de tu negocio. Crea copias de seguridad o restaura el sistema desde un punto anterior.
      </Typography>

      <Container maxWidth="lg" disableGutters sx={{ m: 0 }}>
        <Grid container spacing={4}>
          {/* Backup Section */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 30px 60px -15px rgba(2, 85, 165, 0.1)',
                  transform: 'translateY(-4px)',
                },
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ p: 5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      backgroundColor: 'rgba(2, 85, 165, 0.08)', 
                      borderRadius: '20px', 
                      mr: 2.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(2, 85, 165, 0.1)'
                    }}
                  >
                    <CloudDownloadIcon sx={{ fontSize: 36, color: '#0255A5' }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontFamily: '"Outfit", sans-serif' }}>
                      Copia de Seguridad
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#0255A5', fontWeight: 600 }}>
                      Descarga un respaldo local
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body1" paragraph sx={{ color: '#64748b', mb: 3, lineHeight: 1.6, flexGrow: 1 }}>
                  Genera un respaldo completo de toda la información del sistema, incluyendo productos, inventarios, historial de ventas y clientes. Se recomienda realizar esta acción <strong>al menos una vez por semana</strong>.
                </Typography>

                <Alert
                  severity="info"
                  icon={<StorageIcon />}
                  sx={{
                    mb: 4,
                    borderRadius: '16px',
                    backgroundColor: '#f0f7ff',
                    color: '#0255A5',
                    '& .MuiAlert-icon': {
                      color: '#0255A5',
                    }
                  }}
                >
                  El archivo se descargará en formato <strong>.SQL</strong> y puede ser guardado de forma segura en una memoria USB o la nube.
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
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #0255A5 0%, #013b73 100%)',
                    boxShadow: '0 10px 20px -5px rgba(2, 85, 165, 0.4)',
                    textTransform: 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #036cd2 0%, #004fb8 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 15px 25px -5px rgba(2, 85, 165, 0.5)',
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
                border: '1px solid rgba(226, 232, 240, 0.8)',
                boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 30px 60px -15px rgba(220, 38, 38, 0.15)',
                  transform: 'translateY(-4px)',
                },
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ p: 5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      backgroundColor: 'rgba(220, 38, 38, 0.08)', 
                      borderRadius: '20px', 
                      mr: 2.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(220, 38, 38, 0.1)'
                    }}
                  >
                    <CloudUploadIcon sx={{ fontSize: 36, color: '#dc2626' }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontFamily: '"Outfit", sans-serif' }}>
                      Restaurar Sistema
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 600 }}>
                      Cargar respaldo anterior
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body1" paragraph sx={{ color: '#64748b', mb: 3, lineHeight: 1.6, flexGrow: 1 }}>
                  Carga un archivo de respaldo previo (.SQL) para restaurar el sistema completo a un punto anterior. Útil en casos de reinstalación del sistema o recuperación por fallas.
                </Typography>

                <Alert
                  severity="error"
                  variant="outlined"
                  sx={{ 
                    mb: 4, 
                    borderRadius: '16px', 
                    backgroundColor: '#fef2f2',
                    borderColor: 'rgba(220, 38, 38, 0.2)',
                    color: '#991b1b',
                    '& .MuiAlert-icon': {
                      color: '#dc2626',
                    }
                  }}
                >
                  <AlertTitle sx={{ fontWeight: 800 }}>¡ADVERTENCIA CRÍTICA!</AlertTitle>
                  Esta acción sobrescribirá <strong>TODOS</strong> los datos actuales del sistema por los del archivo de respaldo.
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
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    borderRadius: '16px',
                    borderWidth: '2px',
                    textTransform: 'none',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#fff',
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
        </Grid>
      </Container>

      <DeleteConfirmDialog
        open={isRestoreDialogOpen}
        onClose={() => setIsRestoreDialogOpen(false)}
        onConfirm={handleConfirmRestore}
        title="¿Confirmar Restauración Total?"
        message="¿Realmente desea reemplazar toda la base de datos actual? Se perderán todos los cambios realizados desde el último respaldo."
        itemName={selectedFile?.name}
        confirmText="Restaurar Base de Datos"
      />

      <DeleteConfirmDialog
        open={isCleanupDialogOpen}
        onClose={() => setIsCleanupDialogOpen(false)}
        onConfirm={handleCleanup}
        title="¿Confirmar Limpieza de Historial?"
        message="Se eliminarán todas las ventas, cierres de caja y movimientos con más de 1 año de antigüedad. Esta acción no se puede deshacer."
        itemName="Datos Históricos (> 1 año)"
        confirmText="Eliminar Registros"
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert severity={notification.severity} variant="filled" sx={{ width: '100%', borderRadius: '12px' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MaintenancePage;
