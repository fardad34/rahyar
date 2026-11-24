'use strict';
(() => {
  const offline =
    'No internet connection. A route already started keeps guiding you. Rerouting, search and traffic return when you are back online.';
  const missing =
    'The map could not load. Connect to the internet and reload once. After that, Rahyar also opens without a connection.';
  let timer, banner;
  function show(text, temporary = false) {
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'offline-banner';
      banner.setAttribute('role', 'status');
      banner.setAttribute('aria-live', 'polite');
      banner.style.cssText =
        'position:fixed;top:calc(env(safe-area-inset-top,0px) + 8px);left:50%;transform:translateX(-50%);z-index:1250;box-sizing:border-box;width:max-content;max-width:calc(100vw - 24px);padding:12px 16px;border:1px solid var(--line,#64748b);border-left:4px solid var(--accent,#a78bfa);border-radius:12px;background:var(--panel,#162534);color:var(--ink,#f3f7fc);font-size:16px;font-weight:700;line-height:1.4;text-align:center';
      document.body.append(banner);
    }
    clearTimeout(timer);
    banner.textContent = text;
    banner.hidden = false;
    if (temporary) timer = setTimeout(() => (banner.hidden = true), 3000);
  }
  window.addEventListener('offline', () => show(offline));
  window.addEventListener('online', () => show('Back online.', true));
  window.addEventListener('load', () => {
    if (navigator.onLine === false) show(offline);
    else if (typeof L === 'undefined') show(missing);
    if (
      'serviceWorker' in navigator &&
      (location.protocol === 'https:' ||
        (location.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(location.hostname)))
    )
      navigator.serviceWorker.register('sw.js').catch(() => {
        if (navigator.onLine !== false)
          show('Offline preparation failed. Keep this page open and retry with a connection.');
      });
  });
})();
