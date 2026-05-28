import axios from 'axios';

// Get Print Server URL from localStorage or fallback to VITE env or localhost
const getPrintServerUrl = (): string => {
  const savedUrl = localStorage.getItem('printServerUrl');
  if (savedUrl) {
    return savedUrl;
  }
  return import.meta.env.VITE_PRINT_SERVER_URL || 'http://localhost:3001';
};

/**
 * Sets the print server URL in localStorage
 */
export const setPrintServerUrl = (url: string): void => {
  localStorage.setItem('printServerUrl', url);
};

/**
 * Gets the current print server URL
 */
export const getCurrentPrintServerUrl = (): string => {
  return getPrintServerUrl();
};

/**
 * Fetches the list of available printers from the print server.
 */
export const getPrinters = async (customUrl?: string) => {
  const url = customUrl || getPrintServerUrl();
  try {
    const response = await axios.get(`${url}/get-printers`);
    return response.data; // Expected format: { success: true, printers: [...] }
  } catch (error) {
    console.error('Error fetching printers from print server:', error);
    throw new Error('Could not connect to the print server to get printers.');
  }
};

/**
 * Prints a ticket directly to the thermal printer using ESC/POS commands.
 */
export const printTicket = async (
  sale: any,
  exchangeRate: number,
  printerName: string,
  pendingRecharges?: any[],
  pendingCashAdvances?: any[]
) => {
  const url = getPrintServerUrl();
  try {
    // Request HTML from server instead of triggering server-side print
    const response = await axios.post(`${url}/print-ticket`, {
      sale,
      exchangeRate,
      printerName,
      pendingRecharges,
      pendingCashAdvances,
      returnHtml: true, // Request HTML content
    });

    if (response.data.success && response.data.html) {
      const htmlContent = response.data.html;

      // Handle printing client-side
      // Standardize on using Browser Print (window.open) as it is proven to work for Recharges
      // even inside Electron.
      console.log('Printing via Web Browser Endpoint...');
      await printHtmlInBrowser(htmlContent);
      return { success: true, message: 'Impresión enviada' };

      /* 
      // DISABLED: Electron IPC method seems to have issues with specific printer drivers or silent printing.
      // Falling back to window.open logic which works for Recharges.
      if (window.electronAPI && window.electronAPI.printComponent) {
        // Electron Environment
        console.log('Printing via Electron IPC...');
        await window.electronAPI.printComponent(htmlContent, printerName);
        return { success: true, message: 'Impresión enviada (Electron)' };
      } else {
        // Web Browser Environment
        console.log('Printing via Web Browser...');
        printHtmlInBrowser(htmlContent);
        return { success: true, message: 'Impresión enviada (Navegador)' };
      }
      */
    }

    return response.data;
  } catch (error: any) {
    console.error('Error printing ticket:', error);
    const message = error.response?.data?.message || 'Could not connect to the print server.';
    throw new Error(message);
  }
};

/**
 * Helper to print HTML in a standard web browser using a popup window
 * This matches the logic used in RechargePage which is confirmed to work.
 */
const printHtmlInBrowser = async (html: string) => {
  // Fix for Electron window hiding the print dialog/window
  if (window.electronAPI?.disableAlwaysOnTopTemporarily) {
    await window.electronAPI.disableAlwaysOnTopTemporarily();
  }

  // Use a popup window for printing (more reliable than iframe for styling/margins)
  const printWindow = window.open('', '_blank', `width=${screen.width},height=${screen.height},left=0,top=0`);

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load then print
    // Use a small delay to ensure styles are applied
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      // Close window after print dialog is closed (or immediately depending on browser)
      // Note: print() blocks in some browsers, in others it doesn't.
      // We'll close it after a reasonable delay or listening to events if possible.
      // Recharge logic simply closes it.
      printWindow.close();
    }, 500);
  } else {
    console.error('Popup blocked. Please allow popups for printing.');
    alert('Por favor habilite las ventanas emergentes para imprimir.');
  }
};