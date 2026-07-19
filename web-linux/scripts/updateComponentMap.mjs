import fs from 'fs';
import path from 'path';

const appsDir = './src/apps';
const windowManagerPath = './src/components/desktop/WindowManager.tsx';

const files = fs.readdirSync(appsDir);
const appNames = files
  .filter(f => f.endsWith('.tsx') && !f.includes('.css.'))
  .map(f => path.parse(f).name)
  .sort((a, b) => a.localeCompare(b));

const windowManagerContent = fs.readFileSync(windowManagerPath, 'utf-8');

const startMarker = 'const componentMap: Record<string, () => Promise<{ default: React.ComponentType<any> }>> = {';
const endMarker = '};';

const startIndex = windowManagerContent.indexOf(startMarker) + startMarker.length;
const endIndex = windowManagerContent.lastIndexOf(endMarker);

const existingContent = windowManagerContent.substring(startIndex, endIndex).trim();

const existingMap = {};
const existingRegex = /'([^']+)': \(\) => import/g;
let match;
while ((match = existingRegex.exec(existingContent)) !== null) {
  existingMap[match[1]] = true;
}

const newEntries = appNames.filter(name => !existingMap[name]);
const entriesToAdd = newEntries.map(name => `  ${name}: () => import('../../apps/${name}'),`).join('\n');

const separator = existingContent.trim() ? '\n' : '';
const newMapContent = existingContent + separator + entriesToAdd;

const newWindowManagerContent = 
  windowManagerContent.substring(0, startIndex) + '\n' +
  newMapContent + '\n' +
  windowManagerContent.substring(endIndex);

fs.writeFileSync(windowManagerPath, newWindowManagerContent);

console.log(`Added ${newEntries.length} new component mappings`);
console.log(`Total mappings now: ${appNames.length}`);
