/**
 * Fixes expo packages that reference the removed "expo-module-scripts" package
 * in their tsconfig.json extends field. Replaces with "expo/tsconfig.base" or
 * "expo/tsconfig.plugin" accordingly.
 *
 * This runs as part of the postinstall step.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const filesToFix = [
  'node_modules/expo-file-system/tsconfig.json',
  'node_modules/expo-status-bar/tsconfig.json',
  'node_modules/expo-symbols/tsconfig.json',
  'node_modules/expo-secure-store/tsconfig.json',
  'node_modules/expo-web-browser/tsconfig.json',
  'node_modules/expo-sharing/tsconfig.json',
  'node_modules/expo-system-ui/tsconfig.json',
  'node_modules/expo-splash-screen/tsconfig.json',
  'node_modules/expo-sqlite/tsconfig.json',
  'node_modules/expo-sqlite/plugin/tsconfig.json',
  'node_modules/expo-router/plugin/tsconfig.json',
  'node_modules/expo-splash-screen/plugin/tsconfig.json',
  'node_modules/expo-secure-store/plugin/tsconfig.json',
  'node_modules/expo-web-browser/plugin/tsconfig.json',
  'node_modules/expo-system-ui/plugin/tsconfig.json',
];

let fixed = 0;
filesToFix.forEach((f) => {
  const full = path.join(root, f);
  try {
    let content = fs.readFileSync(full, 'utf8');
    const original = content;
    content = content.replace(
      'expo-module-scripts/tsconfig.base',
      'expo/tsconfig.base',
    );
    content = content.replace(
      'expo-module-scripts/tsconfig.plugin',
      'expo/tsconfig.plugin',
    );
    if (content !== original) {
      fs.writeFileSync(full, content, 'utf8');
      fixed++;
    }
  } catch {
    // File may not exist if the package isn't installed — ignore
  }
});

if (fixed > 0) {
  console.log(`fix-tsconfig: patched ${fixed} file(s)`);
}
