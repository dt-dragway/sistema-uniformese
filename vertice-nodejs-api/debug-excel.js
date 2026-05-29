const XLSX = require('xlsx');
const path = require('path');

async function debugExcel() {
    try {
        const workbook = XLSX.readFile(path.join(__dirname, '..', 'INVENTARIO BASA DE DATOS.xlsx'));
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('Total de filas:', data.length);
        console.log('Columnas encontradas:', Object.keys(data[0]));
        console.log('Ejemplo de la primera fila:', data[0]);
    } catch (error) {
        console.error('Error leyendo el Excel:', error.message);
    }
}

debugExcel();
