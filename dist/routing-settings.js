'use strict';
const defaultRoutingEndpoint = 'https://valhalla1.openstreetmap.de/route';
function validateRoutingEndpoint(value) {
  const u = new URL(String(value || defaultRoutingEndpoint).trim());
  if (
    u.username ||
    u.password ||
    u.search ||
    u.hash ||
    !(
      u.protocol === 'https:' ||
      (u.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname))
    )
  )
    throw Error(
      'Use an HTTPS route endpoint without credentials, keys, query or fragment. HTTP is allowed only for local development.',
    );
  if (u.pathname === '/') u.pathname = '/route';
  return u.href;
}
(() => {
  const key = 'rahyar.routingEndpoint';
  function endpoint() {
    try {
      return validateRoutingEndpoint(localStorage.getItem(key) || defaultRoutingEndpoint);
    } catch {
      return defaultRoutingEndpoint;
    }
  }
  window.RahyarRoutingSettings = { getEndpoint: endpoint };
  function init() {
    const host = document.getElementById('app-settings');
    if (!host) return;
    const section = document.createElement('details');
    section.className = 'settings-section';
    const summary = document.createElement('summary');
    summary.textContent = 'Routing provider';
    const label = document.createElement('label');
    label.textContent = 'Valhalla route endpoint ';
    const input = document.createElement('input');
    input.type = 'url';
    input.id = 'routing-endpoint';
    input.value = endpoint();
    input.spellcheck = false;
    input.autocomplete = 'off';
    label.append(input);
    const save = document.createElement('button');
    save.type = 'button';
    save.id = 'save-routing-endpoint';
    save.className = 'secondary';
    save.textContent = 'Save routing provider';
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.id = 'reset-routing-endpoint';
    reset.className = 'secondary';
    reset.textContent = 'Use public Valhalla';
    const note = document.createElement('p');
    note.textContent =
      'Public Valhalla has no availability guarantee, may limit distance/rate and cannot certify every truck restriction. A custom endpoint receives your coordinates and vehicle profile directly and must allow browser CORS. No silent fallback to another provider. Changes affect the next route request; current geometry stays visible. Never paste a key here.';
    const status = document.createElement('p');
    status.id = 'routing-endpoint-status';
    status.setAttribute('role', 'status');
    save.onclick = () => {
      try {
        const value = validateRoutingEndpoint(input.value);
        localStorage.setItem(key, value);
        input.value = value;
        status.textContent = 'Routing provider saved. It will be used for the next request.';
      } catch (error) {
        status.textContent = error.message;
      }
    };
    reset.onclick = () => {
      try {
        localStorage.removeItem(key);
        input.value = defaultRoutingEndpoint;
        status.textContent = 'Public Valhalla selected for future requests.';
      } catch {
        status.textContent = 'Device storage unavailable.';
      }
    };
    section.append(summary, label, save, reset, note, status);
    host.append(section);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
