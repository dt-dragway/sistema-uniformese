const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Business information (tickets de venta)
const BUSINESS_INFO = {
  name: 'UNIFORMESE',
  rif: '',
  address: 'RIF-403375640',
};

// Business information (etiquetas de prenda)
const LABEL_COMPANY = 'UNIFORMESE PERSEO GLOBAL, C.A.';
const LABEL_RIF     = 'J-403375640';

// ─────────────────────────────────────────────────────────────
// Endpoint: imprimir ticket de venta (HTML → navegador)
// ─────────────────────────────────────────────────────────────
app.post('/print-ticket', async (req, res) => {
  const { sale, exchangeRate, printerName, pendingRecharges, pendingCashAdvances, returnHtml } = req.body;

  if (!sale || !exchangeRate) {
    return res.status(400).json({ success: false, message: 'Missing sale data or exchange rate.' });
  }

  try {
    console.log(`Generating ticket for: ${sale.ticketNumber}`);

    const itemsHtml = sale.items.map(item => {
      const unitPrice = (item.price * exchangeRate).toFixed(2);
      const totalPrice = (item.quantity * item.price * exchangeRate).toFixed(2);
      const formattedQty = Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(2);
      return `
        <tr>
          <td>${item.product.name}</td>
          <td style="text-align:center;">${formattedQty}</td>
          <td style="text-align:right;">${unitPrice}</td>
          <td style="text-align:right;">${totalPrice}</td>
        </tr>
      `;
    }).join('');

    const rechargesHtml = pendingRecharges && pendingRecharges.length > 0 ? `
      <div class="section-title">Recargas</div>
      ${pendingRecharges.map(r => `
        <div style="display: flex; justify-content: space-between; font-size: 10px; margin: 3px 0;">
          <span>${r.serviceName} - ${r.phoneNumber}</span>
          <span>Bs. ${r.totalChargeBs.toFixed(2)}</span>
        </div>
      `).join('')}
    ` : '';

    const cashAdvancesHtml = pendingCashAdvances && pendingCashAdvances.length > 0 ? `
      <div class="section-title">Avances de Efectivo</div>
      ${pendingCashAdvances.map(a => `
        <div style="display: flex; justify-content: space-between; font-size: 10px; margin: 3px 0;">
          <span>Entrega: Bs. ${a.amountToGive.toFixed(2)}</span>
          <span>Cobro: Bs. ${a.totalChargeBs.toFixed(2)}</span>
        </div>
      `).join('')}
    ` : '';

    const paymentsHtml = sale.payments.map(p =>
      `<div>${p.method}${p.reference ? ` REF: ${p.reference}` : ''}</div>`
    ).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ticket ${sale.ticketNumber}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; font-size: 12px; width: 80mm; padding: 5mm; background: white; color: black; }
    .header { text-align: center; margin-bottom: 10px; }
    .business-name { font-size: 14px; font-weight: bold; }
    .business-info { font-size: 10px; }
    .ticket-info { margin: 10px 0; font-size: 11px; }
    .section-title { font-weight: bold; font-size: 12px; margin: 10px 0 5px 0; border-bottom: 1px dashed #000; padding-bottom: 3px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { text-align: left; border-bottom: 1px solid #000; padding: 3px 4px; }
    td { padding: 3px 4px; vertical-align: top; }
    td:nth-child(1) { width: 40%; }
    td:nth-child(2) { width: 15%; text-align: center; }
    td:nth-child(3) { width: 22%; text-align: right; }
    td:nth-child(4) { width: 23%; text-align: right; }
    .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 15px; border-top: 2px solid #000; padding-top: 10px; }
    .footer { text-align: center; margin-top: 15px; font-size: 10px; }
    .print-btn { position: fixed; top: 10px; right: 10px; padding: 10px 20px; font-size: 14px; background: #4CAF50; color: white; border: none; cursor: pointer; }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">IMPRIMIR</button>
  <div class="header">
    <div class="business-name">${BUSINESS_INFO.name}</div>
    ${BUSINESS_INFO.rif ? `<div class="business-info">RIF: ${BUSINESS_INFO.rif}</div>` : ''}
    <div class="business-info">${BUSINESS_INFO.address}</div>
    <div style="font-weight: bold; margin-top: 8px; font-size: 13px;">COMPROBANTE DE VENTA</div>
  </div>
  <div class="ticket-info">
    <div><strong>No. Comprobante:</strong> ${sale.ticketNumber}</div>
    <div><strong>Fecha:</strong> ${new Date(sale.createdAt).toLocaleString('es-VE')}</div>
    <div><strong>Cliente:</strong> ${sale.customer?.name || 'CONSUMIDOR FINAL'}</div>
    ${sale.customer?.cedula ? `<div><strong>CI/RIF:</strong> ${sale.customer.cedula}</div>` : ''}
    <div><strong>Cajero:</strong> ${sale.cashierName || 'Caja Principal'}</div>
  </div>
  ${sale.items.length > 0 ? `
  <div class="section-title">Artículos</div>
  <table>
    <thead><tr><th>Producto</th><th style="text-align:center;">Cant</th><th style="text-align:right;">P.Unit</th><th style="text-align:right;">Total</th></tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  ` : ''}
  ${rechargesHtml}
  ${cashAdvancesHtml}
  <div class="section-title">Pagos</div>
  ${paymentsHtml}
  <div class="total">Total: Bs. ${sale.totalBs.toFixed(2)}</div>
  <div class="footer">*** GRACIAS POR SU COMPRA ***</div>
  ${!returnHtml ? `
  <script>
    window.onload = function() { window.print(); };
    window.onafterprint = function() { window.close(); };
  </script>
  ` : ''}
</body>
</html>
    `;

    if (returnHtml) {
      console.log('Returning HTML to client for local printing.');
      return res.json({ success: true, html });
    }

    const tempFile = path.join(os.tmpdir(), `ticket_${sale.ticketNumber}_${Date.now()}.html`);
    fs.writeFileSync(tempFile, html, 'utf8');
    const openCmd = process.platform === 'win32' ? 'start' : 'open';
    exec(`${openCmd} "" "${tempFile}"`, { shell: true }, (error) => {
      if (error) {
        console.error('Failed to open file:', error);
        return res.status(500).json({ success: false, message: 'Failed to open ticket.' });
      }
      res.json({ success: true, message: 'Ticket opened. Press the IMPRIMIR button.' });
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// Get printers endpoint
// ─────────────────────────────────────────────────────────────
app.get('/get-printers', (req, res) => {
  exec('Get-Printer | Select-Object Name, IsDefault | ConvertTo-Json',
    { shell: 'powershell.exe' },
    (error, stdout) => {
      if (error) {
        return res.status(500).json({ success: false, message: 'Failed to get printers.' });
      }
      try {
        const output = JSON.parse(stdout);
        const printers = Array.isArray(output) ? output : [output];
        res.json({
          success: true,
          printers: printers.map(p => ({ name: p.Name, isDefault: p.IsDefault }))
        });
      } catch (e) {
        res.status(500).json({ success: false, message: 'Parse error.' });
      }
    }
  );
});

// ─────────────────────────────────────────────────────────────
// MÓDULO DE ETIQUETAS — Zebra LP2824 Plus (USB)
// ─────────────────────────────────────────────────────────────

/**
 * Genera una cadena ZPL para una etiqueta de prenda.
 * Calibrada para etiqueta 2" × 1.5" a 203 DPI (406 × 304 dots).
 */
function generateZpl(item) {
  const { name = '', barCode = '', price = 0, size = '', color = '' } = item;
  const fecha = new Date().toLocaleDateString('es-VE');

  // Nombre en mayúsculas, permitimos hasta 45 caracteres para aprovechar 2 líneas
  const productName = String(name).substring(0, 45).toUpperCase();

  // Código de barras: solo caracteres válidos para Code128
  const barCodeVal = String(barCode || '').replace(/[^A-Za-z0-9\-\.\/+\s]/g, '') || String(price);

  // Precio formateado
  const priceStr = Number(price) > 0 ? Number(price).toFixed(2) : '0.00';

  // Línea de detalle con talla y color
  const detailParts = [];
  if (size) detailParts.push(`TALLA: ${size}`);
  if (color) detailParts.push(`COLOR: ${color}`);
  const detailLine = detailParts.join('  ');

  const lines = [
    '^XA',
    '^PW406',         // Ancho: 406 dots = 2"
    '^LL304',         // Alto: 304 dots = 1.5"
    '^LH0,0',
    '^CI28',          // UTF-8 encoding para tildes y ñ

    // ── Encabezado empresa (centrado) ──
    '^CF0,22',
    `^FO5,12^FB396,1,,C^FD${LABEL_COMPANY}^FS`,
    '^CF0,18',
    `^FO5,36^FB396,1,,C^FDRIF: ${LABEL_RIF} - FECHA: ${fecha}^FS`,

    // ── Separador horizontal ──
    '^FO5,60^GB396,2,2^FS',

    // ── Nombre del producto (máx 2 líneas) ──
    '^CF0,24',
    `^FO8,66^FB390,2,0,L^FD${productName}^FS`,
  ];

  // Talla/Color si existen
  if (detailLine) {
    lines.push('^CF0,20');
    lines.push(`^FO8,118^FB390,1,,L^FD${detailLine}^FS`);
  }

  // ── Código de barras Code128 (siempre en la misma posición base) ──
  // Posición Y fija en 142 para dar espacio suficiente a las 2 líneas del nombre
  lines.push('^BY2,2,60');
  lines.push(`^FO8,142^BCN,60,N,N,N^FD${barCodeVal}^FS`);

  // ── Texto del código bajo el barcode ──
  lines.push('^CF0,20');
  lines.push(`^FO8,208^FB200,1,,L^FD${barCodeVal}^FS`);

  // ── Bloque precio (derecha inferior) ──
  lines.push('^CF0,30'); // Precio más grande y visible
  lines.push(`^FO150,198^FB246,1,,R^FDREF. ${priceStr}^FS`);

  lines.push('^XZ');
  return lines.join('\n');
}

/**
 * Envía ZPL a la Zebra LP2824 Plus vía USB.
 * Soporta Linux (/dev/usb/lp0), Windows (copy /b) y macOS (lpr).
 */
function sendZplToZebra(zplData, printerName) {
  return new Promise((resolve, reject) => {
    const platform = os.platform();

    if (platform === 'linux') {
      // Intentar escribir directamente al dispositivo USB
      const usbPorts = ['/dev/usb/lp0', '/dev/usb/lp1', '/dev/lp0'];
      let sent = false;
      for (const usbPort of usbPorts) {
        try {
          if (fs.existsSync(usbPort)) {
            fs.appendFileSync(usbPort, zplData);
            sent = true;
            return resolve({ method: 'linux-usb', port: usbPort });
          }
        } catch (e) {
          console.warn(`Cannot write to ${usbPort}: ${e.message}`);
        }
      }
      if (sent) return;
      // Fallback: comando lp con modo raw
      const tmpFile = path.join(os.tmpdir(), `zebra_${Date.now()}.zpl`);
      fs.writeFileSync(tmpFile, zplData, 'utf8');
      const printer = printerName || 'ZebraLP2824';
      exec(`lp -d "${printer}" -o raw "${tmpFile}"`, (err) => {
        fs.unlink(tmpFile, () => {});
        if (err) return reject(new Error(`lp command failed: ${err.message}`));
        resolve({ method: 'linux-lp', printer });
      });

    } else if (platform === 'win32') {
      const tmpFile = path.join(os.tmpdir(), `zebra_${Date.now()}.zpl`);
      fs.writeFileSync(tmpFile, zplData, 'binary');
      const printer = printerName || 'Zebra Technologies ZPL';
      // Intentar enviar vía share local primero
      const cmd = `copy /b "${tmpFile}" "\\\\localhost\\${printer}"`;
      exec(cmd, { shell: 'cmd.exe' }, (err) => {
        fs.unlink(tmpFile, () => {});
        if (err) {
          // Fallback: puerto USB directo
          const tmpFile2 = path.join(os.tmpdir(), `zebra2_${Date.now()}.zpl`);
          fs.writeFileSync(tmpFile2, zplData, 'binary');
          exec(`copy /b "${tmpFile2}" "USB001"`, { shell: 'cmd.exe' }, (err2) => {
            fs.unlink(tmpFile2, () => {});
            if (err2) return reject(new Error(`Windows print failed: ${err2.message}`));
            resolve({ method: 'win-usb', printer: 'USB001' });
          });
        } else {
          resolve({ method: 'win-share', printer });
        }
      });

    } else {
      // macOS
      const tmpFile = path.join(os.tmpdir(), `zebra_${Date.now()}.zpl`);
      fs.writeFileSync(tmpFile, zplData, 'utf8');
      const printer = printerName || 'ZebraLP2824';
      exec(`lpr -P "${printer}" -l "${tmpFile}"`, (err) => {
        fs.unlink(tmpFile, () => {});
        if (err) return reject(new Error(`lpr failed: ${err.message}`));
        resolve({ method: 'mac-lpr', printer });
      });
    }
  });
}

/**
 * POST /print-label
 * Body: { items: [{ name, barCode, price, size, color, quantity }], printerName? }
 * Genera y envía ZPL a la Zebra LP2824 Plus vía USB.
 */
app.post('/print-label', async (req, res) => {
  const { items, printerName } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Se requiere al menos un producto.' });
  }

  try {
    let totalPrinted = 0;
    let fullZpl = '';

    for (const item of items) {
      const qty = Math.max(1, Math.min(parseInt(item.quantity) || 1, 500));
      const zplForItem = generateZpl(item);
      for (let i = 0; i < qty; i++) {
        fullZpl += zplForItem + '\n';
        totalPrinted++;
      }
    }

    const result = await sendZplToZebra(fullZpl, printerName);
    console.log(`[Etiquetas] Impresas ${totalPrinted} etiqueta(s). Método: ${result.method}`);
    res.json({ success: true, totalPrinted, method: result.method });

  } catch (error) {
    console.error('[Etiquetas] Error al imprimir:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /preview-label
 * Devuelve el ZPL generado para debug / previsualización externa
 */
app.post('/preview-label', (req, res) => {
  const { item } = req.body;
  if (!item) return res.status(400).json({ success: false, message: 'Se requiere item.' });
  const zpl = generateZpl(item);
  res.json({ success: true, zpl });
});

// Listen on all interfaces for network access
const host = process.env.HOST || '0.0.0.0';
app.listen(port, host, () => {
  console.log(`Print server: http://${host}:${port}`);
  console.log(`  → Tickets:  POST /print-ticket`);
  console.log(`  → Etiquetas: POST /print-label  (Zebra LP2824 USB)`);
});
