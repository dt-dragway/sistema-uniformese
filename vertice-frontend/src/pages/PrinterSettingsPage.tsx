import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Select,
  MenuItem,
  Button,
  Snackbar,
  Alert,
  Box,
  CircularProgress,
  TextField,
  Paper,
  Divider,
} from '@mui/material';
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
              isDefault: p.name.toLowerCase().includes('default') || false,
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
            setSnackbarMessage(
              printersResponse.message || 'No se pudieron cargar las impresoras desde el servidor de impresión.'
            );
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
      setSnackbarMessage(
        'No se pudo conectar al servidor de impresión. Verifica la URL y que el servidor esté encendido.'
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: 900,
          color: '#0f172a',
          fontFamily: '"Outfit", sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          mb: 3,
        }}
      >
        Configuración de Impresora
      </Typography>

      {/* Print Server URL Configuration */}
      <Paper
        sx={{
          p: 4,
          mb: 4,
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0255A5', mb: 1 }}>
          Servidor de Impresión (Para clientes en red)
        </Typography>
        <Typography variant="body2" sx={{ color: '#475569', mb: 3, fontWeight: 500 }}>
          Si estás accediendo desde un cliente en red, configura la dirección IP del servidor donde está instalado el
          print-server.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            label="URL del Servidor de Impresión"
            value={printServerUrl}
            onChange={(e) => setPrintServerUrlState(e.target.value)}
            placeholder="http://192.168.1.100:3001"
            fullWidth
            helperText="Ejemplo: http://192.168.1.100:3001"
            sx={{
              flexGrow: 1,
              '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#f8fafc' },
            }}
          />
          <Button
            variant="outlined"
            onClick={handleTestConnection}
            disabled={testingConnection}
            sx={{
              minWidth: 150,
              height: '56px',
              borderRadius: '12px',
              fontWeight: 700,
              textTransform: 'none',
              borderColor: '#e2e8f0',
              color: '#0255A5',
              mb: 2.5,
            }}
          >
            {testingConnection ? <CircularProgress size={24} color="inherit" /> : 'Probar Conexión'}
          </Button>
        </Box>
      </Paper>

      {/* Printer Selection */}
      <Paper
        sx={{
          p: 4,
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#0255A5' }} />
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
              Seleccione la impresora de tickets:
            </Typography>
            <Select
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value as string)}
              fullWidth
              displayEmpty
              sx={{ borderRadius: '12px', backgroundColor: '#f8fafc', mb: 3 }}
            >
              <MenuItem value="" disabled>
                <em style={{ color: '#94a3b8' }}>Seleccione una impresora</em>
              </MenuItem>
              {printers.map((printer) => (
                <MenuItem key={printer.name} value={printer.name} sx={{ fontWeight: 500 }}>
                  {printer.name}{' '}
                  {printer.isDefault && (
                    <Typography component="span" variant="caption" sx={{ color: '#0255A5', ml: 1, fontWeight: 700 }}>
                      (Predeterminada)
                    </Typography>
                  )}
                </MenuItem>
              ))}
            </Select>

            {printers.length === 0 && !loading && (
              <Alert
                severity="warning"
                sx={{
                  mb: 3,
                  borderRadius: '12px',
                  backgroundColor: '#fff7ed',
                  color: '#9a3412',
                  border: '1px solid #ffedd5',
                }}
              >
                {window.electronAPI ? (
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    No se encontraron impresoras instaladas en este equipo. Por favor, instale una impresora e intente
                    nuevamente.
                  </Typography>
                ) : (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                      No se encontraron impresoras. Si está accediendo desde un navegador web, asegúrese de que el
                      servidor de impresión ('vertice-print-server') esté ejecutándose{' '}
                      <strong>localmente en este equipo</strong> en el puerto 3001.
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Para iniciar el servidor de impresión localmente, ejecute:
                    </Typography>
                    <Box
                      component="code"
                      sx={{
                        display: 'block',
                        marginTop: '12px',
                        padding: '12px',
                        background: '#f1f5f9',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        color: '#0f172a',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                      }}
                    >
                      cd vertice-print-server && npm start
                    </Box>
                  </Box>
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
                    mb: 3,
                    borderRadius: '12px',
                    backgroundColor: '#fff7ed',
                    color: '#9a3412',
                    border: '1px solid #ffedd5',
                  }}
                >
                  <strong>Advertencia:</strong> Has seleccionado una impresora virtual (PDF/XPS/Fax). Para imprimir
                  tickets en una impresora térmica, selecciona tu impresora física real.
                </Alert>
              )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={!selectedPrinter}
                sx={{
                  backgroundColor: '#0255A5',
                  borderRadius: '12px',
                  px: 4,
                  py: 1.5,
                  fontWeight: 800,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#014484' },
                }}
              >
                Guardar Configuración
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%', borderRadius: '12px' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PrinterSettingsPage;
