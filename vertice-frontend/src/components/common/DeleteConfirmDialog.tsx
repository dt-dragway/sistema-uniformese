import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  confirmText?: string;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  confirmText = 'Eliminar Definitivamente',
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        },
      }}
    >
      <Box sx={{ height: '6px', background: 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)' }} />
      
      <DialogTitle sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, pt: 4, pb: 1 }}>
        <Box 
          sx={{ 
            width: 64, 
            height: 64, 
            borderRadius: '50%', 
            bgcolor: 'rgba(239, 68, 68, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '8px solid rgba(239, 68, 68, 0.05)'
          }}
        >
          <WarningAmberIcon sx={{ fontSize: 32, color: '#ef4444' }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', textAlign: 'center', fontFamily: '"Outfit", sans-serif' }}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 4, pb: 2 }}>
        <Typography variant="body1" sx={{ color: '#64748b', textAlign: 'center', mb: 2, lineHeight: 1.6 }}>
          {message}
        </Typography>
        {itemName && (
          <Box sx={{ 
            p: 2, 
            bgcolor: '#f8fafc', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0',
            textAlign: 'center',
            mt: 2
          }}>
            <Typography variant="subtitle2" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5, fontSize: '0.75rem' }}>
              Archivo / Elemento Seleccionado
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', wordBreak: 'break-all' }}>
              {itemName}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={{ 
            flex: 1,
            color: '#64748b',
            borderColor: '#cbd5e1',
            borderRadius: '12px',
            py: 1.5,
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': {
              borderColor: '#94a3b8',
              bgcolor: '#f8fafc',
            }
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          variant="contained"
          color="error"
          sx={{
            flex: 1,
            py: 1.5,
            borderRadius: '12px',
            fontWeight: 700,
            textTransform: 'none',
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              boxShadow: '0 15px 20px -3px rgba(239, 68, 68, 0.4)',
              transform: 'translateY(-1px)',
            }
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
