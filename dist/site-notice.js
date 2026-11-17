'use strict';

const siteNoticeVersion = '2026-11-16.1';
const siteNoticeKey = 'rahyar.siteNotice';

function savedSiteNotice() {
  try {
    const saved = JSON.parse(localStorage.getItem(siteNoticeKey));
    return saved?.version === siteNoticeVersion && Number.isFinite(Date.parse(saved.acceptedAt))
      && Object.hasOwn(siteNoticeText, saved.language) ? saved : null;
  } catch { return null; }
}

function initSiteNotice(startApp) {
  const dialog = $('site-notice');
  const language = $('notice-language');
  const check = $('notice-agree');
  const confirm = $('notice-confirm');
  const content = $('notice-content');
  const saved = savedSiteNotice();
  const browserLanguage = (navigator.language || '').split('-')[0];
  let accepted = !!saved;
  let declined = false;
  let opener;
  language.value = saved?.language || (Object.hasOwn(siteNoticeText, browserLanguage) ? browserLanguage : 'en');

  function render() {
    const text = siteNoticeText[language.value];
    dialog.lang = language.value;
    dialog.dir = language.value === 'fa' ? 'rtl' : 'ltr';
    for (const key of ['title','intro','agree','confirm','decline','close','reset','review','declined']) {
      $(key === 'agree' ? 'notice-agree-label' : 'notice-' + key).textContent = text[key];
    }
    $('notice-language-label').textContent = text.language;
    $('notice-declined').hidden = !declined;
    $('notice-review').hidden = !declined;
    $('notice-consent').hidden = accepted || declined;
    $('notice-close').hidden = !accepted;
    $('notice-reset').hidden = !accepted;
    content.hidden = declined;
    content.replaceChildren(...text.sections.map((paragraphs, index) => {
      const section = document.createElement('section');
      const heading = document.createElement('h3');
      heading.textContent = text.headings[index];
      section.append(heading, ...paragraphs.map(paragraph => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        return p;
      }));
      return section;
    }));
    content.scrollTop = 0;
    check.checked = false;
    confirm.disabled = true;
  }

  function openNotice() {
    render();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closeNotice() {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    opener?.focus();
  }

  function enterApp() {
    document.body.classList.remove('notice-required');
    startApp();
  }

  language.onchange = render;
  check.onchange = () => { confirm.disabled = !check.checked; };
  $('notice-consent').onsubmit = event => {
    event.preventDefault();
    if (!check.checked || accepted || declined) return;
    const record = {version: siteNoticeVersion, language: language.value, acceptedAt: new Date().toISOString()};
    try { localStorage.setItem(siteNoticeKey, JSON.stringify(record)); } catch {}
    accepted = true;
    closeNotice();
    enterApp();
  };
  $('notice-decline').onclick = () => { declined = true; render(); $('notice-review').focus(); };
  $('notice-review').onclick = () => { declined = false; render(); language.focus(); };
  $('notice-close').onclick = closeNotice;
  $('notice-reset').onclick = () => {
    stopWatch();
    try { localStorage.removeItem(siteNoticeKey); } catch {}
    location.reload();
  };
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    if (accepted) closeNotice();
  });
  for (const button of document.querySelectorAll('[data-open-site-notice]')) {
    button.onclick = () => { opener = button; openNotice(); };
  }
  if (accepted) enterApp();
  else openNotice();
}
