const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function migrate() {
    console.log('--- Iniciando Migración de Inventario desde Excel ---');
    
    try {
        const workbook = XLSX.readFile(path.join(__dirname, '..', 'INVENTARIO BASA DE DATOS.xlsx'));
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`Se encontraron ${data.length} registros en el archivo.`);
        
        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        const sizes = ['SS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '32', '34', '36', '38', '40', '42', '44', '46', '48'];

        for (const row of data) {
            // Normalizar datos del Excel
            const name = (row['DESCRIPCION'] || '').trim().toUpperCase();
            const barCode = (row['CODIGO'] || '').trim().toUpperCase();
            const tipo = (row['TIPO'] || '').trim().toUpperCase();
            const caracteristica = (row['CARACTERISTICA'] || '').trim().toUpperCase();
            let detalle = (row['DETALLE'] || '').trim().toUpperCase();
            let talla = '';

            // Si el detalle es una talla conocida, moverlo a la columna talla
            if (sizes.includes(detalle)) {
                talla = detalle;
                detalle = '';
            }

            const tela = (row['TELA'] || '').trim().toUpperCase();
            const color = (row['COLOR'] || '').trim().toUpperCase();
            const price = parseFloat(row['PRECIO ($)']) || 0;
            const stock = parseFloat(row['CANTIDAD']) || 0;

            if (!name) {
                console.warn('Registro sin descripción saltado.');
                skippedCount++;
                continue;
            }

            try {
                if (barCode) {
                    // Si tiene código de barras, usar upsert
                    await prisma.product.upsert({
                        where: { barCode: barCode },
                        update: {
                            name,
                            tipo,
                            caracteristica,
                            detalle,
                            talla,
                            tela,
                            color,
                            price,
                            stock,
                            isActive: true,
                            minStock: 0
                        },
                        create: {
                            name,
                            barCode,
                            tipo,
                            caracteristica,
                            detalle,
                            talla,
                            tela,
                            color,
                            price,
                            stock,
                            isActive: true,
                            minStock: 0
                        }
                    });
                    updatedCount++;
                } else {
                    // Si no tiene código de barras, crear como nuevo (o buscar por nombre)
                    // Para evitar duplicados exactos por nombre, buscamos primero
                    const existingByName = await prisma.product.findFirst({
                        where: { name: name, barCode: null }
                    });

                    if (existingByName) {
                        await prisma.product.update({
                            where: { id: existingByName.id },
                            data: {
                                tipo,
                                caracteristica,
                                detalle,
                                tela,
                                color,
                                price,
                                stock,
                                minStock: 0
                            }
                        });
                        updatedCount++;
                    } else {
                        await prisma.product.create({
                            data: {
                                name,
                                tipo,
                                caracteristica,
                                detalle,
                                tela,
                                color,
                                price,
                                stock,
                                isActive: true,
                                minStock: 0
                            }
                        });
                        createdCount++;
                    }
                }
            } catch (err) {
                console.error(`Error procesando "${name}":`, err.message);
                skippedCount++;
            }
        }

        console.log('\n--- Resumen de Migración ---');
        console.log(`✅ Registros procesados correctamente: ${createdCount + updatedCount}`);
        console.log(`   - Nuevos creados: ${createdCount}`);
        console.log(`   - Actualizados: ${updatedCount}`);
        console.log(`⚠️  Saltados/Errores: ${skippedCount}`);
        
    } catch (error) {
        console.error('Error crítico durante la migración:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
