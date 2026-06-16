const fs = require('fs');
const path = require('path');

const projectRoot = 'c:/Users/dragway/Documents/uniformese';
const entregableDir = path.join(projectRoot, 'Entregable-Servidor');
const srcInno = path.join(projectRoot, 'release/Uniformese-Servidor-Installer-v13.exe');
const destInno = path.join(entregableDir, 'Uniformese Servidor Setup (Opcion InnoSetup).exe');

try {
  // Delete old one
  if (fs.existsSync(destInno)) {
    fs.unlinkSync(destInno);
    console.log('Deleted old Inno installer from delivery folder');
  }

  // Copy new one
  if (fs.existsSync(srcInno)) {
    fs.copyFileSync(srcInno, destInno);
    console.log('Successfully copied fresh Inno Setup installer to:', destInno);
  } else {
    console.error('Inno Setup installer not found at:', srcInno);
  }
} catch (error) {
  console.error('Error during copying fresh Inno Setup installer:', error.message);
  process.exit(1);
}
