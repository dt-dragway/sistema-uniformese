const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (content.includes("overflow: 'hidden'")) {
    if (content.includes("TableContainer") || content.includes("<Table")) {
        content = content.replace(/overflow:\s*'hidden'/g, "overflowX: 'auto'");
        changed = true;
    }
  }

  if (content.includes("<Table ")) {
    content = content.replace(/<Table\s+([^>]*?)>/g, (match, attrs) => {
      if (attrs.includes('minWidth')) {
        return match;
      }
      if (attrs.includes('sx={{')) {
        changed = true;
        return `<Table ${attrs.replace('sx={{', 'sx={{ minWidth: 1000, ')}>`;
      } else {
        changed = true;
        return `<Table ${attrs} sx={{ minWidth: 1000 }}>`;
      }
    });
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
