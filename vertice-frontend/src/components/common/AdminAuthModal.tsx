import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';
import { API_URL } from '../../api/axiosInstance';

interface AdminAuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionName: string; // e.g., "Cambiar Tasa" or "Anular Venta"
}

const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ open, onClose, onSuccess, actionName }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuthorize = async () => {
    setError(null);
    setLoading(true);
    try {
      // Use the verify-admin endpoint
      const response = await axios.post(`${API_URL}/auth/verify-admin`, { password });

      if (response.data.success) {
        onSuccess();
        onClose();
        setPassword('');
      } else {
        setError('Contraseña incorrecta.');
      }
    } catch (err: any) {
      setError('Contraseña incorrecta o error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#d32f2f', color: 'white' }}>
        Autorización de Administrador
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
          Ingrese una contraseña de Administrador para: <strong>{actionName}</strong>.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          autoFocus
          margin="dense"
          label="Contraseña de Admin"
          type="password"
          fullWidth
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAuthorize();
            }
          }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleAuthorize}
          variant="contained"
          color="error"
          disabled={loading || !password}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? 'Verificando...' : 'Autorizar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminAuthModal;
