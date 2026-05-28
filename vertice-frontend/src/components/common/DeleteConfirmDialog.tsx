import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(20, 25, 35, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <WarningAmberIcon color="error" sx={{ fontSize: 32 }} />
        <Typography variant="h6" fontWeight="bold" color="white">
          {title}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
          {message}
        </Typography>
        {itemName && (
          <Box sx={{ p: 1.5, bgcolor: 'rgba(211, 47, 47, 0.1)', borderRadius: 1, borderLeft: '4px solid #d32f2f' }}>
            <Typography variant="subtitle1" fontWeight="bold" color="white">
              {itemName}
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose} sx={{ color: 'rgba(255,255,255,0.6)' }}>
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
            px: 3, 
            borderRadius: '20px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)'
          }}
        >
          Eliminar Definitivamente
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
