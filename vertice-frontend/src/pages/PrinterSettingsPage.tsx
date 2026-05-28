import React, { useState, useEffect } from 'react';
import { Container, Typography, Select, MenuItem, Button, Snackbar, Alert, Box, CircularProgress, TextField, Paper, Divider } from '@mui/material';
import { useDispatch } from 'react-redux';
import { getSavedPrinter, savePrinter } from '../api/settingService';
import { getPrinters, setPrintServerUrl, getCurrentPrintServerUrl } from '../api/printService';
import { setPrinterName } from '../store/printerSlice';

// Interface matching the printer server's response
interface Printer {
  name: string;
  isDefault: boolean;
}

const PrinterSettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning'>('success');
  const [printServerUrl, setPrintServerUrlState] = useState<string>(getCurrentPrintServerUrl());
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    const fetchPrintersAndSettings = async () => {
      setLoading(true);
      try {
        let fetchedPrinters: Printer[] = [];

        // Priority 1: Use Electron API if available (Electron app context)
        if (window.electronAPI?.getPrinters) {
          console.log('Using Electron API to get printers (local client)');
          try {
            const electronPrinters = await window.electronAPI.getPrinters();
            // Convert Electron printer format to our Printer interface
            fetchedPrinters = electronPrinters.map((p) => ({
              name: p.name,
              isDefault: p.name.toLowerCase().includes('default') || false
            }));
            console.log('Printers from Electron API:', fetchedPrinters);
          } catch (electronError) {
            console.error('Failed to get printers from Electron API:', electronError);
            setSnackbarMessage('Error al obtener impresoras desde Electron. Intentando con print-server...');
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
          }
        }

        // Priority 2: Use print-server API if Electron API not available or failed
        if (fetchedPrinters.length === 0) {
          console.log('Using Print Server API to get printers (assumes local print-server on port 3001)');
          const printersResponse = await getPrinters();
          if (printersResponse.success) {
            fetchedPrinters = printersResponse.printers;
            console.log('Printers from Print Server:', fetchedPrinters);
          } else {
            setSnackbarMessage(printersResponse.message || 'No se pudieron cargar las impresoras desde el servidor de impresión.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
          }
        }

        // Set the fetched printers
        setPrinters(fetchedPrinters);

        // Fetch saved printer setting from backend
        if (fetchedPrinters.length > 0) {
          const savedPrinterData = await getSavedPrinter();
          if (savedPrinterData.success && savedPrinterData.printer) {
            setSelectedPrinter(savedPrinterData.printer);
          } else {
            // If no printer is saved, suggest the default one
            const defaultPrinter = fetchedPrinters.find((p: Printer) => p.isDefault);
            if (defaultPrinter) {
              setSelectedPrinter(defaultPrinter.name);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching printers or settings:', error);
        setSnackbarMessage('Error al conectar con el servidor de impresión. ¿Está encendido?');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPrintersAndSettings();
  }, []);

  const handleSave = async () => {
    try {
      await savePrinter(selectedPrinter);
      dispatch(setPrinterName(selectedPrinter)); // Update store
      setSnackbarMessage('Impresora guardada correctamente.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Error al guardar la impresora.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await getPrinters(printServerUrl);
      if (result.success) {
        setPrintServerUrl(printServerUrl); // Save to localStorage
        setPrinters(result.printers);
        setSnackbarMessage(`Conexión exitosa! Se encontraron ${result.printers.length} impresoras.`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage('Error al conectar con el servidor de impresión.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage('No se pudo conectar al servidor de impresión. Verifica la URL y que el servidor esté encendido.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Configuración de Impresora
      </Typography>

      {/* Print Server URL Configuration */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'rgba(30, 45, 55, 0.6)' }}>
        <Typography variant="h6" gutterBottom>
          Servidor de Impresión (Para clientes en red)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Si estás accediendo desde un cliente en red, configura la dirección IP del servidor donde está instalado el print-server.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="URL del Servidor de Impresión"
            value={printServerUrl}
            onChange={(e) => setPrintServerUrlState(e.target.value)}
            placeholder="http://192.168.1.100:3001"
            fullWidth
            helperText="Ejemplo: http://192.168.1.100:3001"
          />
          <Button
            variant="contained"
            onClick={handleTestConnection}
            disabled={testingConnection}
            sx={{ minWidth: 150 }}
          >
            {testingConnection ? <CircularProgress size={24} /> : 'Probar Conexión'}
          </Button>
        </Box>
      </Paper>

      <Divider sx={{ my: 3 }} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Seleccione la impresora de tickets:</Typography>
          <Select
            value={selectedPrinter}
            onChange={(e) => setSelectedPrinter(e.target.value as string)}
            fullWidth
            displayEmpty
          >
            <MenuItem value="" disabled>
              <em>Seleccione una impresora</em>
            </MenuItem>
            {printers.map((printer) => (
              <MenuItem key={printer.name} value={printer.name}>
                {printer.name} {printer.isDefault && '(Predeterminada)'}
              </MenuItem>
            ))}
          </Select>
          {printers.length === 0 && !loading && (
            <Alert
              severity="warning"
              sx={{
                mt: 2,
                bgcolor: 'rgba(255, 152, 0, 0.1)',
                border: '1px solid rgba(255, 152, 0, 0.3)',
                color: 'white',
                '& .MuiAlert-icon': {
                  color: '#ff9800',
                },
              }}
            >
              {window.electronAPI ? (
                <>
                  No se encontraron impresoras instaladas en este equipo.
                  Por favor, instale una impresora e intente nuevamente.
                </>
              ) : (
                <>
                  No se encontraron impresoras. Si está accediendo desde un navegador web,
                  asegúrese de que el servidor de impresión ('vertice-print-server') esté
                  ejecutándose <strong>localmente en este equipo</strong> en el puerto 3001.
                  <br /><br />
                  Para iniciar el servidor de impresión localmente, ejecute:
                  <Box
                    component="code"
                    sx={{
                      display: 'block',
                      marginTop: '12px',
                      padding: '12px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 152, 0, 0.3)',
                      color: '#4fc3f7',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                    }}
                  >
                    cd vertice-print-server && npm start
                  </Box>
                </>
              )}
            </Alert>
          )}
          {selectedPrinter &&
            (selectedPrinter.toLowerCase().includes('pdf') ||
              selectedPrinter.toLowerCase().includes('xps') ||
              selectedPrinter.toLowerCase().includes('fax')) && (
              <Alert
                severity="warning"
                sx={{
                  mt: 2,
                  bgcolor: 'rgba(255, 152, 0, 0.1)',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  color: 'white',
                  '& .MuiAlert-icon': {
                    color: '#ff9800',
                  },
                }}
              >
                <strong>Advertencia:</strong> Has seleccionado una impresora virtual (PDF/XPS/Fax).
                Para imprimir tickets en una impresora térmica de 80mm, selecciona tu impresora física real de la lista.
              </Alert>
            )}
          <Button variant="contained" color="primary" onClick={handleSave} sx={{ mt: 2 }} disabled={!selectedPrinter}>
            Guardar
          </Button>
        </Box>
      )}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PrinterSettingsPage;
