'use strict';
const {readdirSync} = require('node:fs');
const {resolve} = require('node:path');
const {spawnSync} = require('node:child_process');
const root = resolve(__dirname, '..');
const files = readdirSync(resolve(root, 'tests')).filter(name => name.endsWith('.test.cjs')).sort();
const result = spawnSync(process.execPath, ['--test', ...process.argv.slice(2), ...files.map(name => 'tests/' + name)], {cwd: root, stdio: 'inherit'});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
