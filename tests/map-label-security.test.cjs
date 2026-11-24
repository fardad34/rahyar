'use strict';
const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm');
test('saved/imported map-label HTML is passed to Leaflet as inert DOM text', () => {
  const attack = '<img src=x onerror=alert(1)>',
    tooltips = [];
  const c = {
    window: { RahyarTripModel: { validPoint: () => true } },
    localStorage: {
      getItem: (k) => (k === 'rahyar.mapMarks.v1' ? JSON.stringify([{ name: attack, coord: [1, 2] }]) : '[]'),
    },
    document: { createElement: () => ({ textContent: '' }) },
    navigationMap: null,
    map: {},
    L: {
      marker: () => ({
        addTo() {
          return this;
        },
        bindTooltip: (x) => tooltips.push(x),
        on() {},
        remove() {},
      }),
    },
    setInterval: () => 0,
    clearInterval() {},
  };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync('dist/map-places.js', 'utf8'), c);
  c.window.RahyarMapPlaces.draw();
  assert.equal(tooltips.length, 1);
  assert.equal(typeof tooltips[0], 'object');
  assert.equal(tooltips[0].textContent, attack);
});
