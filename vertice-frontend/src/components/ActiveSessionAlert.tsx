import { Alert, Box, Button, Card, Typography } from '@mui/material';
import { Info, Schedule, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActiveSessionAlertProps {
  sessionData: {
    id: number;
    openedAt: string;
    status: string;
  };
  onClose?: () => void;
}

const ActiveSessionAlert = ({ sessionData, onClose }: ActiveSessionAlertProps) => {
  const navigate = useNavigate();

  const openedDate = new Date(sessionData.openedAt);
  const formattedDate = openedDate.toLocaleString('es-VE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const timeElapsed = formatDistanceToNow(openedDate, {
    addSuffix: true,
    locale: es,
  });

  // Auto-close after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 6000); // 6 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <Card
      sx={{
        position: 'fixed',
        top: 80,
        right: 20,
        width: 400,
        maxWidth: '90vw',
        zIndex: 1300,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        border: '2px solid #4CAF50',
      }}
    >
      <Alert
        severity="info"
        icon={<CheckCircle sx={{ color: '#4CAF50' }} />}
        onClose={onClose}
        sx={{
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Sesión de Caja Activa
        </Typography>

        <Box sx={{ mt: 2, mb: 2 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Schedule fontSize="small" color="action" />
            <Typography variant="body2">
              <strong>Abierta:</strong> {formattedDate}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Info fontSize="small" color="action" />
            <Typography variant="body2">
              <strong>Tiempo:</strong> {timeElapsed}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Tienes una sesión de caja abierta. Puedes continuar trabajando o cerrarla cuando finalices.
        </Typography>

        <Button
          variant="contained"
          fullWidth
          onClick={() => {
            navigate('/sales');
            onClose?.();
          }}
          sx={{
            background: 'linear-gradient(45deg, #4CAF50, #66BB6A)',
            '&:hover': {
              background: 'linear-gradient(45deg, #66BB6A, #81C784)',
            },
          }}
        >
          Ir a Punto de Venta
        </Button>
      </Alert>
    </Card>
  );
};

export default ActiveSessionAlert;
