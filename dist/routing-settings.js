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
  function provider() {
    const selected = localStorage.getItem('rahyar.routingProvider');
    if (selected === 'tomtom' || selected === 'valhalla') return selected;
    // Preserve custom endpoints. Use the owner's already configured TomTom key otherwise.
    return !localStorage.getItem(key) && localStorage.getItem('rahyar.tomtom-key') ? 'tomtom' : 'valhalla';
  }
  function tomtomRequest() {
    const apiKey = localStorage.getItem('rahyar.tomtom-key') || '';
    if (!apiKey) throw new Error('Add your TomTom key in Traffic setup before selecting TomTom routing.');
    const month = new Date().toISOString().slice(0, 7);
    const usageKey = 'rahyar.tomtom-routing-usage';
    let usage;try { usage = JSON.parse(localStorage.getItem(usageKey) || '{}'); } catch { throw new Error('Routing usage storage is invalid.'); }
    const count = usage.month === month ? Number(usage.count) || 0 : 0;
    if (count >= 1000) throw new Error('TomTom monthly safety limit reached on this device (1,000 requests). Further requests are blocked on this device.');
    localStorage.setItem(usageKey, JSON.stringify({month, count: count + 1}));
    return apiKey;
  }
  let routeCredit=null;
  function showAttribution(name){
    const text='Routing © TomTom';
    if(typeof map!=='undefined'&&map?.attributionControl){map.attributionControl.removeAttribution(text);if(name==='tomtom')map.attributionControl.addAttribution(text);}
    if(typeof navigationMap!=='undefined'&&navigationMap&&typeof maplibregl!=='undefined'){
      if(routeCredit){navigationMap.removeControl(routeCredit);routeCredit=null;}
      if(name==='tomtom'){routeCredit=new maplibregl.AttributionControl({compact:true,customAttribution:text});navigationMap.addControl(routeCredit,'bottom-right');}
    }
  }
  window.RahyarRoutingSettings = { getEndpoint: endpoint, getProvider: provider, takeTomTomRequest: tomtomRequest, showAttribution };
  function init() {
    const host = document.getElementById('app-settings');
    if (!host) return;
    const section = document.createElement('details');
    section.className = 'settings-section';
    const summary = document.createElement('summary');
    summary.textContent = 'Routing provider';
    const providerLabel = document.createElement('label');
    providerLabel.textContent = 'Route calculations ';
    const select = document.createElement('select');select.id='routing-provider';
    for (const [value,text] of [['tomtom','TomTom · car / truck'],['valhalla','Valhalla · public / custom']]) { const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option); }
    select.value=provider();providerLabel.append(select);
    const providerStatus=document.createElement('p');providerStatus.setAttribute('role','status');providerStatus.textContent='TomTom uses the key saved in Traffic setup. Safety cap: 1,000 routing requests per UTC month on this device. This does not cap other devices or account-wide billing. Keep your TomTom account on its free plan. No automatic fallback.';
    select.onchange=()=>{localStorage.setItem('rahyar.routingProvider',select.value);providerStatus.textContent=select.value==='tomtom'?'TomTom selected. Uses your key from Traffic setup. Limit: 1,000 routing requests/month on this device. Keep the TomTom account on its free plan; this device limit cannot cap account-wide usage.':'Valhalla selected for future requests.';};
    const label = document.createElement('label');
    label.textContent = 'Custom Valhalla endpoint (only used when Valhalla is selected) ';
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
        localStorage.setItem('rahyar.routingProvider','valhalla');select.value='valhalla';
        input.value = value;
        status.textContent = 'Routing provider saved. It will be used for the next request.';
      } catch (error) {
        status.textContent = error.message;
      }
    };
    reset.onclick = () => {
      try {
        localStorage.removeItem(key);
        localStorage.setItem('rahyar.routingProvider','valhalla');select.value='valhalla';
        input.value = defaultRoutingEndpoint;
        status.textContent = 'Public Valhalla selected for future requests.';
      } catch {
        status.textContent = 'Device storage unavailable.';
      }
    };
    section.append(summary, providerLabel, providerStatus, label, save, reset, note, status);
    host.append(section);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
