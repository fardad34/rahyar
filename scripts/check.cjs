'use strict';
const {readdirSync, readFileSync} = require('node:fs');
const {resolve, join} = require('node:path');
const {spawnSync} = require('node:child_process');
const root = resolve(__dirname, '..');
function walk(dir) {
  return readdirSync(dir, {withFileTypes: true}).flatMap(entry => entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]);
}
let count = 0;
for (const file of ['dist', 'scripts', 'tests', 'api', 'src'].flatMap(dir => walk(resolve(root, dir)))) {
  if (/\.(js|cjs)$/.test(file)) {
    const result = spawnSync(process.execPath, ['--check', file], {stdio: 'inherit'});
    if (result.status !== 0) process.exit(result.status ?? 1);
    count++;
  } else if (/\.(json|webmanifest)$/.test(file)) {
    JSON.parse(readFileSync(file, 'utf8'));
    count++;
  }
}
JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
console.log(`Syntax and JSON checks passed (${count + 1} files).`);
