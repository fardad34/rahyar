(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const menus = [...document.querySelectorAll('.header-tool')];
  const toolsMenu = byId('tools-menu');
  document.addEventListener('click', event => {
    if (!toolsMenu.contains(event.target)) toolsMenu.open = false;
    const menu = event.target.closest('.header-tool');
    if (!menu || (event.target.closest('summary') && !menu.open)) {
      for (const other of menus) if (other !== menu) other.open = false;
    }
  });
  document.addEventListener('keydown', event => {
    const menu = menus.find(item => item.open);
    if (event.key !== 'Escape') return;
    const openMenu = menu || (toolsMenu.open ? toolsMenu : null);
    if (!openMenu) return;
    openMenu.open = false;
    openMenu.querySelector('summary').focus();
  });

  function read(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }
  function save(key, rows, status) {
    try {
      localStorage.setItem(key, JSON.stringify(rows));
      return true;
    } catch {
      status.textContent = 'This browser could not save the entry.';
      return false;
    }
  }
  function list(container, lines, emptyText) {
    const rows = lines.length ? lines : [emptyText];
    container.replaceChildren(...rows.map(line => {
      const li = document.createElement('li');
      li.textContent = line;
      return li;
    }));
  }

  const incidentKey = 'rahyar.roadNotes';
  const recentIncidents = () => read(incidentKey).filter(note => note.expires > Date.now());
  const reportKinds = {
    police: 'Police presence',
    collision: 'Collision',
    construction: 'Construction',
    closed: 'Road closed',
  };
  const reportButtons = [...document.querySelectorAll('[data-report]')];
  const dashboardReportStatus = byId('dashboard-report-status');
  let locatingReport = false;

  function reportStatus(text) {
    dashboardReportStatus.textContent = text;
  }

  function saveReport(kind, coords) {
    if (!Number.isFinite(coords?.latitude) || !Number.isFinite(coords?.longitude) ||
        !Number.isFinite(coords.accuracy) || coords.accuracy > 100) {
      reportStatus('GPS location is not accurate enough. Tap again when GPS is available.');
      return;
    }
    const {latitude, longitude} = coords;
    const note = {
      kind,
      place: latitude.toFixed(5) + ', ' + longitude.toFixed(5),
      latitude,
      longitude,
      expires: Date.now() + 7200000,
    };
    if (save(incidentKey, [note, ...recentIncidents()].slice(0, 40), dashboardReportStatus)) {
      reportStatus(kind + ' saved on this device.');
    } else {
      reportStatus('This browser could not save the report.');
    }
  }

  function reportIncident(kind) {
    if (locatingReport || !kind) return;
    if (watch !== null && lastPos && Date.now() - gpsTime <= 10000 &&
        Number.isFinite(lastAccuracyMeters) && lastAccuracyMeters <= 100) {
      saveReport(kind, {longitude:lastPos[0], latitude:lastPos[1], accuracy:lastAccuracyMeters});
      return;
    }
    if (!navigator.geolocation) {
      reportStatus('GPS is unavailable on this device.');
      return;
    }
    locatingReport = true;
    for (const button of reportButtons) button.disabled = true;
    reportStatus('Getting your GPS location…');
    const finish = () => {
      locatingReport = false;
      for (const button of reportButtons) button.disabled = false;
    };
    navigator.geolocation.getCurrentPosition(position => {
      finish();
      saveReport(kind, position.coords);
    }, () => {
      finish();
      reportStatus('Could not get your location. Allow GPS and tap again.');
    }, {enableHighAccuracy:true, maximumAge:3000, timeout:10000});
  }

  for (const button of reportButtons) {
    button.onclick = () => reportIncident(reportKinds[button.dataset.report]);
  }

  const carrierKey = 'rahyar.carrierReviews';
  const companyKey = name => name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
  function showCarriers() {
    const ranked = read(carrierKey).sort((a, b) => b.score - a.score || a.company.localeCompare(b.company));
    list(byId('carrier-list'), ranked.map(review => [
      review.company + ' · ' + review.score + '/5',
      review.positive && '+ ' + review.positive,
      review.negative && 'Improve: ' + review.negative,
    ].filter(Boolean).join(' · ')), 'No ratings on this device.');
  }
  byId('carrier-form').onsubmit = event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const company = data.get('company').trim();
    if (!company) return;
    const review = {company, score: Number(data.get('score')), positive: data.get('positive'), negative: data.get('negative')};
    const status = byId('carrier-feedback');
    const reviews = read(carrierKey).filter(row => companyKey(row.company) !== companyKey(company));
    if (save(carrierKey, [...reviews, review], status)) {
      status.textContent = 'Rating saved on this device.';
      form.reset();
      showCarriers();
    }
  };
  showCarriers();
})();
