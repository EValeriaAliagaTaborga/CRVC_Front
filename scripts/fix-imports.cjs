const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'dist', 'src', 'services');
if (fs.existsSync(dir)) {
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\.\/auth"/g, './auth.js"').replace(/\.\/user"/g, './user.js"');
    fs.writeFileSync(filePath, content);
  }
}
