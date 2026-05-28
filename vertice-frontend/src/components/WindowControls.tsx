import { IconButton, Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { Remove as RemoveIcon, Close as CloseIcon } from '@mui/icons-material';
import { useState } from 'react';

const WindowControls = () => {
    const [openConfirm, setOpenConfirm] = useState(false);

    const handleMinimize = () => {
        if (window.electronAPI) {
            window.electronAPI.minimize();
        }
    };

    const handleCloseClick = () => {
        setOpenConfirm(true);
    };

    const handleConfirmClose = () => {
        if (window.electronAPI) {
            window.electronAPI.close();
        }
        setOpenConfirm(false);
    };

    const handleCancelClose = () => {
        setOpenConfirm(false);
    };

    // Only show if running in Electron
    if (!window.electronAPI) {
        return null;
    }

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', zIndex: 9999 }}>
                <IconButton onClick={handleMinimize} sx={{ color: 'white' }} tabIndex={-1}>
                    <RemoveIcon />
                </IconButton>
                <IconButton onClick={handleCloseClick} sx={{ color: 'white', '&:hover': { backgroundColor: 'red' } }} tabIndex={-1}>
                    <CloseIcon />
                </IconButton>
            </Box>
            <Dialog
                open={openConfirm}
                onClose={handleCancelClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"¿Salir de la aplicación?"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        ¿Estás seguro de que deseas cerrar el sistema?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelClose}>Cancelar</Button>
                    <Button onClick={handleConfirmClose} color="error" autoFocus>
                        Salir
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default WindowControls;
