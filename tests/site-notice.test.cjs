const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const script = ['site-notice-text.js', 'site-notice.js'].map(name => fs.readFileSync('dist/' + name, 'utf8')).join('\n');

function setup(existing) {
  const elements = new Map();
  const element = () => ({append() {}, replaceChildren() {}, focus() {}, showModal() { this.open = true; },
    close() { this.open = false; }, addEventListener() {}});
  const $ = id => {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  };
  let record = existing;
  let started = 0;
  let reloaded = 0;
  let stopped = 0;
  const ctx = vm.createContext({
    $,
    navigator: {language: 'fa-IR'},
    document: {body: {classList: {remove() {}}}, querySelectorAll: () => [], createElement: element},
    localStorage: {getItem: () => record, setItem: (_, value) => { record = value; }, removeItem: () => { record = null; }},
    stopWatch: () => { stopped++; },
    location: {reload() { reloaded++; }},
    startApp: () => { started++; },
  });
  vm.runInContext(script + '\ninitSiteNotice(startApp);', ctx);
  return {$, ctx, get record() { return record; }, get started() { return started; },
    get reloaded() { return reloaded; }, get stopped() { return stopped; }};
}

test('acceptance gates initialization, versions the record, and can be withdrawn', () => {
  const app = setup();
  const {$} = app;
  const submit = () => $('notice-consent').onsubmit({preventDefault() {}});
  assert.equal(app.started, 0);
  assert.equal($('site-notice').dir, 'rtl');
  submit();
  assert.equal(app.started, 0);
  $('notice-decline').onclick();
  assert.equal(app.started, 0);
  assert.equal($('notice-consent').hidden, true);
  $('notice-review').onclick();
  $('notice-agree').checked = true;
  $('notice-agree').onchange();
  assert.equal($('notice-confirm').disabled, false);
  submit();
  assert.equal(app.started, 1);
  assert.equal($('site-notice').open, false);
  const record = JSON.parse(app.record);
  assert.equal(record.language, 'fa');
  assert.ok(Number.isFinite(Date.parse(record.acceptedAt)));
  const returning = setup(app.record);
  assert.equal(returning.started, 1);
  returning.$('notice-reset').onclick();
  assert.equal(returning.stopped, 1);
  assert.equal(returning.reloaded, 1);
  assert.equal(returning.record, null);
  assert.equal(setup(JSON.stringify({...record, version: 'older'})).started, 0);
});

test('all six languages include the three notices and switch without carrying the checkbox', () => {
  const {$, ctx} = setup();
  const languages = vm.runInContext('JSON.stringify(Object.keys(siteNoticeText))', ctx);
  assert.deepEqual(JSON.parse(languages), ['en', 'fr', 'fa', 'hi', 'es', 'de']);
  for (const code of JSON.parse(languages)) {
    assert.equal(vm.runInContext('siteNoticeText[' + JSON.stringify(code) + '].sections.length', ctx), 3);
    $('notice-agree').checked = true;
    $('notice-language').value = code;
    $('notice-language').onchange();
    assert.equal($('site-notice').lang, code);
    assert.equal($('notice-agree').checked, false);
    assert.equal($('notice-confirm').disabled, true);
  }
});
