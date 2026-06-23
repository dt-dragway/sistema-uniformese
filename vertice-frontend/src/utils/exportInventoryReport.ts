import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product } from '../models/Product';

const companyInfo = {
  name: 'UNIFORMESE',
  address: 'Dirección: AV FRANCISCO FAJARDO CC ECOCENTER NIVEL 1 LOCAL 16-7 SECTOR EL VALLE EL VALLE DEL ESPIRITU SANTO NUEVA ESPARTA ZONA 6301'
};

const formatFecha = () => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatHora = () => {
  const date = new Date();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strTime = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  return strTime;
};

export const exportStockToExcel = async (products: Product[]) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Existencias');

    // Remove gridlines for cleaner look
    worksheet.views = [
      { showGridLines: false }
    ];

    // Setup columns: A (Codigo), B (Descripcion), C (Total Existencias Label), D (Value)
    worksheet.columns = [
      { key: 'codigo', width: 18 },
      { key: 'desc', width: 60 },
      { key: 'total_label', width: 25 },
      { key: 'existencia', width: 20 },
    ];

    // Header Setup
    worksheet.mergeCells('A1:C1');
    const titleCell1 = worksheet.getCell('A1');
    titleCell1.value = companyInfo.name;
    titleCell1.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF505050' } };

    worksheet.mergeCells('A2:C2');
    const titleCell2 = worksheet.getCell('A2');
    titleCell2.value = companyInfo.address;
    titleCell2.font = { name: 'Arial', size: 8, color: { argb: 'FF505050' } };

    worksheet.mergeCells('A3:C3');
    const mainTitle = worksheet.getCell('A3');
    mainTitle.value = 'REPORTE DE EXISTENCIAS DE INVENTARIO';
    mainTitle.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF505050' } };

    // Date & Time (Top Right)
    worksheet.getCell('D2').value = `Fecha : ${formatFecha()}`;
    worksheet.getCell('D2').font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FF505050' } };
    worksheet.getCell('D2').alignment = { horizontal: 'right' };
    
    worksheet.getCell('D3').value = `Hora : ${formatHora()}`;
    worksheet.getCell('D3').font = { name: 'Arial', size: 8, bold: true, color: { argb: 'FF505050' } };
    worksheet.getCell('D3').alignment = { horizontal: 'right' };

    // Filters Box
    const filters = [
      'Producto :',
      'Familia :',
      'Marca :',
      'Depósito :',
      'Estatus : Todas',
      'Ordenado Por : Código'
    ];
    filters.forEach((filter, index) => {
      const cell = worksheet.getCell(`A${5 + index}`);
      cell.value = filter;
      cell.font = { name: 'Arial', size: 8, color: { argb: 'FF505050' } };
    });

    // NIVELES Box
    const nivelesTitle = worksheet.getCell('C4');
    nivelesTitle.value = 'NIVELES';
    nivelesTitle.font = { name: 'Arial', size: 8, color: { argb: 'FF505050' } };
    nivelesTitle.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

    const nivelesItems = ['Nivel Producto :', 'Nivel Marca :', 'Nivel Depósito :'];
    nivelesItems.forEach((item, index) => {
      worksheet.mergeCells(`C${5 + index}:D${5 + index}`);
      const cell = worksheet.getCell(`C${5 + index}`);
      cell.value = item;
      cell.font = { name: 'Arial', size: 8, color: { argb: 'FF505050' } };
      cell.border = {
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: index === 2 ? { style: 'thin' } : undefined
      };
    });

    worksheet.addRow([]); // row 11

    // Table Headers
    const headerRow = worksheet.getRow(12);
    headerRow.getCell(1).value = 'Codigo';
    headerRow.getCell(2).value = 'Descripcion';
    headerRow.getCell(4).value = 'Existencia';
    
    headerRow.eachCell((cell, colNumber) => {
      if (colNumber === 1 || colNumber === 2 || colNumber === 4) {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF505050' } };
        cell.alignment = { horizontal: colNumber === 4 ? 'right' : 'left' };
      }
    });

    // Divider line
    worksheet.mergeCells('A13:D13');
    worksheet.getCell('A13').border = { bottom: { style: 'thin', color: { argb: 'FFA0A0A0' } } };

    let currentRow = 14;
    products.forEach((product) => {
      const row = worksheet.getRow(currentRow);
      row.getCell(1).value = product.barCode || '-';
      row.getCell(1).font = { name: 'Arial', size: 8, color: { argb: 'FF505050' } };
      
      row.getCell(2).value = product.name;
      row.getCell(2).font = { name: 'Arial', size: 8, color: { argb: 'FF505050' } };

      // Add "Total Existencias" line
      const stockRow = worksheet.getRow(currentRow + 1);
      const totalTextCell = stockRow.getCell(3);
      totalTextCell.value = 'Total Existencias';
      totalTextCell.font = { name: 'Arial', size: 8, color: { argb: 'FF505050' } };
      totalTextCell.alignment = { horizontal: 'right' };

      const valueCell = stockRow.getCell(4);
      valueCell.value = parseFloat(product.stock.toString()).toFixed(2);
      valueCell.font = { name: 'Arial', size: 8, color: { argb: 'FF505050' } };
      valueCell.alignment = { horizontal: 'right' };
      
      // Add thin line bottom to simulate the underline seen in the print
      valueCell.border = { bottom: { style: 'thin', color: { argb: 'FFA0A0A0' } } };

      currentRow += 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Reporte_Existencias_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (err) {
    console.error('Error exporting Stock to Excel:', err);
    alert('Hubo un error al generar el archivo Excel.');
  }
};

export const exportStockToPDF = (products: Product[]) => {
  try {
    const doc = new jsPDF('p', 'pt', 'letter');
    const pageWidth = doc.internal.pageSize.width;
    
    // Default text color to gray-ish
    doc.setTextColor(128, 128, 128);

    // Header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(companyInfo.name, 40, 40);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(companyInfo.address, 40, 52, { maxWidth: pageWidth - 200 });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE EXISTENCIAS DE INVENTARIO', 40, 75);

    // Date and Time
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Fecha : ${formatFecha()}`, pageWidth - 40, 40, { align: 'right' });
    doc.text(`Hora : ${formatHora()}`, pageWidth - 40, 52, { align: 'right' });

    // Filters Left
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const startYFilters = 95;
    const lineHeight = 12;
    const filters = [
      'Producto :',
      'Familia :',
      'Marca :',
      'Depósito :',
      'Estatus : Todas',
      'Ordenado Por : Código'
    ];
    filters.forEach((f, i) => {
      doc.text(f, 40, startYFilters + (i * lineHeight));
    });

    // Box NIVELES Right
    const boxX = pageWidth - 240;
    const boxY = 85;
    doc.setDrawColor(128, 128, 128);
    doc.setLineWidth(0.5);
    
    // Draw "NIVELES" tab
    doc.rect(boxX, boxY, 80, 15);
    doc.text('NIVELES', boxX + 5, boxY + 10);
    
    // Draw main box
    doc.rect(boxX, boxY + 15, 200, 45);
    doc.text('Nivel Producto :', boxX + 5, boxY + 27);
    doc.text('Nivel Marca :', boxX + 5, boxY + 39);
    doc.text('Nivel Depósito :', boxX + 5, boxY + 51);

    // Table
    const tableData: any[] = [];
    products.forEach(p => {
      // Row 1: Product info
      tableData.push([
        { content: p.barCode || '-', styles: { fontStyle: 'normal' } },
        { content: p.name, styles: { fontStyle: 'normal' } },
        { content: '', styles: { halign: 'right' } }
      ]);
      // Row 2: "Total Existencias" and the value with an overline
      tableData.push([
        { content: '', colSpan: 1 },
        { content: 'Total Existencias', styles: { halign: 'right' } },
        { 
          content: parseFloat(p.stock.toString()).toFixed(2), 
          styles: { 
            halign: 'right', 
            lineWidth: { top: 0.5 }, // creates the line above the number
            lineColor: [128, 128, 128]
          } 
        }
      ]);
    });

    autoTable(doc, {
      startY: 180,
      head: [['Codigo', 'Descripcion', 'Existencia']],
      body: tableData,
      theme: 'plain',
      styles: {
        fontSize: 8,
        textColor: [128, 128, 128],
        cellPadding: 2,
      },
      headStyles: {
        fontStyle: 'bold',
        textColor: [128, 128, 128]
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 80, halign: 'right' }
      },
      margin: { top: 180, left: 40, right: 40 },
    });

    doc.save(`Reporte_Existencias_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (err) {
    console.error('Error exporting Stock to PDF:', err);
    alert('Hubo un error al generar el archivo PDF.');
  }
};
