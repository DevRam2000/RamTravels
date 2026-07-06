const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../gen/db/package.json');
if (!fs.existsSync(filePath)) {
  console.warn('No generated HDI deployer package.json found at', filePath);
  process.exit(0);
}

const content = fs.readFileSync(filePath, 'utf8');
let json;
try {
  json = JSON.parse(content);
} catch (err) {
  console.error('Failed to parse generated package.json:', err.message);
  process.exit(1);
}

if (!json.engines) {
  json.engines = {};
}

const current = json.engines.node;
const patched = '>=22.0.0 <25.0.0';
if (current !== patched) {
  console.log(`Patching gen/db/package.json engines.node from '${current || ''}' to '${patched}'`);
  json.engines.node = patched;
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
} else {
  console.log('gen/db/package.json engines.node already compatible:', patched);
}
