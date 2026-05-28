const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Business information
const BUSINESS_INFO = {
  name: 'Comercializadora Gonzalez 2018',
  rif: '',
  address: 'Porlamar, Sector Achipano',
};

// Endpoint to print a ticket - generates HTML and opens in browser
app.post('/print-ticket', async (req, res) => {
  const { sale, exchangeRate, printerName, pendingRecharges, pendingCashAdvances, returnHtml } = req.body;

  if (!sale || !exchangeRate) {
    return res.status(400).json({ success: false, message: 'Missing sale data or exchange rate.' });
  }

  try {
    console.log(`Generating ticket for: ${sale.ticketNumber}`);

    // Generate items HTML
    const itemsHtml = sale.items.map(item => {
      const unitPrice = (item.price * exchangeRate).toFixed(2);
      const totalPrice = (item.quantity * item.price * exchangeRate).toFixed(2);
      // Format quantity: if decimal show 2 decimals, if integer show as is
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

    // Generate recharges HTML
    const rechargesHtml = pendingRecharges && pendingRecharges.length > 0 ? `
      <div class="section-title">Recargas</div>
      ${pendingRecharges.map(r => `
        <div style="display: flex; justify-content: space-between; font-size: 10px; margin: 3px 0;">
          <span>${r.serviceName} - ${r.phoneNumber}</span>
          <span>Bs. ${r.totalChargeBs.toFixed(2)}</span>
        </div>
      `).join('')}
    ` : '';

    // Generate cash advances HTML
    const cashAdvancesHtml = pendingCashAdvances && pendingCashAdvances.length > 0 ? `
      <div class="section-title">Avances de Efectivo</div>
      ${pendingCashAdvances.map(a => `
        <div style="display: flex; justify-content: space-between; font-size: 10px; margin: 3px 0;">
          <span>Entrega: Bs. ${a.amountToGive.toFixed(2)}</span>
          <span>Cobro: Bs. ${a.totalChargeBs.toFixed(2)}</span>
        </div>
      `).join('')}
    ` : '';

    // Generate payments HTML
    const paymentsHtml = sale.payments.map(p =>
      `<div>${p.method}${p.reference ? ` REF: ${p.reference}` : ''}</div>`
    ).join('');

    // Full HTML document
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ticket ${sale.ticketNumber}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      width: 80mm;
      padding: 5mm;
      background: white;
      color: black;
    }
    .header { text-align: center; margin-bottom: 10px; }
    .logo { max-width: 50mm; height: auto; margin-bottom: 5px; }
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
    .print-btn { 
      position: fixed; top: 10px; right: 10px; 
      padding: 10px 20px; font-size: 14px; 
      background: #4CAF50; color: white; border: none; cursor: pointer;
    }
    @media print {
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">IMPRIMIR</button>
  
  <div class="header">
    <div class="business-name">${BUSINESS_INFO.name}</div>
    ${BUSINESS_INFO.rif ? `<div class="business-info">RIF: ${BUSINESS_INFO.rif}</div>` : ''}
    <div class="business-info">${BUSINESS_INFO.address}</div>
  </div>
  
  <div class="ticket-info">
    <div><strong>Ticket:</strong> ${sale.ticketNumber}</div>
    <div><strong>Fecha:</strong> ${new Date(sale.createdAt).toLocaleString('es-VE')}</div>
    <div><strong>Cliente:</strong> ${sale.customer?.name || 'N/A'}</div>
  </div>
  
  ${sale.items.length > 0 ? `
  <div class="section-title">Artículos</div>
  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th style="text-align:center;">Cant</th>
        <th style="text-align:right;">P.Unit</th>
        <th style="text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>
  ` : ''}
  
  ${rechargesHtml}
  
  ${cashAdvancesHtml}
  
  <div class="section-title">Pagos</div>
  ${paymentsHtml}
  
  <div class="total">Total: Bs. ${sale.totalBs.toFixed(2)}</div>
  
  <div class="footer">
    *** GRACIAS POR SU COMPRA ***
  </div>
  
  ${!returnHtml ? `
  <script>
    // Auto-print when opened
    window.onload = function() {
      window.print(); // Auto-print activated
    };
    
    // Close window after printing or canceling
    window.onafterprint = function() {
      window.close();
    };
  </script>
  ` : ''}
</body>
</html>
    `;

    // If requested to return HTML only (for remote client printing)
    if (returnHtml) {
      console.log('Returning HTML to client for local printing.');
      return res.json({ success: true, html });
    }

    // Save to temp file
    const tempFile = path.join(os.tmpdir(), `ticket_${sale.ticketNumber}_${Date.now()}.html`);
    fs.writeFileSync(tempFile, html, 'utf8');

    console.log(`Ticket saved to: ${tempFile}`);

    // Open in default browser
    const openCmd = process.platform === 'win32' ? 'start' : 'open';
    exec(`${openCmd} "" "${tempFile}"`, { shell: true }, (error) => {
      if (error) {
        console.error('Failed to open file:', error);
        return res.status(500).json({ success: false, message: 'Failed to open ticket.' });
      }
      console.log('Ticket opened in browser!');
      res.json({ success: true, message: 'Ticket opened. Press the IMPRIMIR button.' });
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get printers endpoint
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

// Listen on all interfaces for network access
const host = process.env.HOST || '0.0.0.0';
app.listen(port, host, () => {
  console.log(`Print server: http://${host}:${port}`);
});
