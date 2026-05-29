const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Reemplazar casos comunes
      content = content.replace(/\$\$\{/g, 'REF ${');
      content = content.replace(/\(\$\)/g, '(REF)');
      content = content.replace(/Efectivo \$/g, 'Efectivo REF');
      content = content.replace(/Tasa \$\/Bs\./g, 'Tasa REF/Bs.');
      content = content.replace(/currency === '\$'/g, "currency === 'REF'");
      content = content.replace(/currency: 'Bs\.' \| '\$'/g, "currency: 'Bs.' | 'REF'");
      content = content.replace(/'\$'/g, "'REF'");
      content = content.replace(/>\s*\$\s*</g, '>REF<'); // Para >$< o > $ <
      content = content.replace(/\$ \{(.*?)\}/g, 'REF {$1}'); // Para JSX $ {(totals...)}
      content = content.replace(/\$ \{(.*?)\}/g, 'REF {$1}'); // JSX
      content = content.replace(/Ref \(\$\)/g, 'REF');
      content = content.replace(/Crédito \(\$\)/g, 'Crédito (REF)');
      content = content.replace(/Ventas \(\$\)/g, 'Ventas (REF)');
      content = content.replace(/USD/g, 'REF'); // Reemplazar USD por REF
      
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDirectory('/DATA/Desarrollos  /sistema_uniformese/vertice-frontend/src');
console.log('Done');
