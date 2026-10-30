const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let errors = 0;
function scan(dir) {
  for (const file of fs.readdirSync(dir)) {
    if (file === 'node_modules' || file.startsWith('.')) continue;
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) scan(full);
    else if (file.endsWith('.js')) {
      try {
        execSync(`node -c "${full}"`);
      } catch (err) {
        console.error('SYNTAX ERROR:', full);
        errors++;
      }
    }
  }
}
scan(__dirname + '/..');
if (errors === 0) {
  console.log('SUCCESS: All server JS files are syntax clean!');
} else {
  console.log(`FAILED: Found ${errors} syntax errors.`);
}
