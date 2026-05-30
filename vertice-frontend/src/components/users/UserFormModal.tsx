import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { User } from '../../models/User';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (user: Partial<User>) => void;
  userToEdit: Partial<User> | null;
}

const UserFormModal = ({ open, onClose, onSave, userToEdit }: UserFormModalProps) => {
  const [user, setUser] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setUser(userToEdit);
      setIsEditing(true);
    } else {
      setUser({ role: 'CASHIER' });
      setIsEditing(false);
    }
  }, [userToEdit, open]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setUser((prev: Partial<User>) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(user);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}</DialogTitle>
      <DialogContent dividers>
        <TextField
          autoFocus
          margin="dense"
          name="fullname"
          label="Nombre y Apellido"
          type="text"
          fullWidth
          variant="outlined"
          value={user.fullname || ''}
          onChange={handleChange}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          name="username"
          label="Login Ingreso"
          type="text"
          fullWidth
          variant="outlined"
          value={user.username || ''}
          onChange={handleChange}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          name="password"
          label={isEditing ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}
          type="password"
          fullWidth
          variant="outlined"
          onChange={handleChange}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Rol</InputLabel>
          <Select name="role" value={user.role || 'CASHIER'} onChange={handleChange} label="Rol">
            <MenuItem value="ADMIN">ADMINISTRADOR</MenuItem>
            <MenuItem value="CASHIER">CAJERO</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserFormModal;
