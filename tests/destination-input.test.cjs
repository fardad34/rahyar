'use strict';
const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm');
const c = { URL, document: { readyState: 'loading', addEventListener() {} } };
vm.createContext(c);
vm.runInContext(fs.readFileSync('dist/destination-input.js', 'utf8'), c);
test('paste accepts addresses and extracts coordinates/addresses without fetching arbitrary links', () => {
  assert.equal(c.parseDestinationInput('123 King St Toronto').query, '123 King St Toronto');
  assert.equal(
    JSON.stringify(c.parseDestinationInput('https://maps.google.com/?q=43.65,-79.38').coord),
    '[-79.38,43.65]',
  );
  assert.equal(c.parseDestinationInput('https://maps.apple.com/?daddr=Toronto').query, 'Toronto');
  for (const input of [
    'javascript:alert(1)',
    'https://user:pass@maps.google.com/?q=Toronto',
    '91,181',
    'https://unknown.test/private',
    'https://maps.google.com.evil.test/?q=Toronto',
  ])
    assert.throws(() => c.parseDestinationInput(input));
});
