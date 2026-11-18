(() => {
  'use strict';

  const byId = id => document.getElementById(id);
  const audio = byId('road-audio');
  const picker = byId('media-playlist');
  const quickToggle = byId('dashboard-media-toggle');
  const statuses = [byId('media-status'), byId('dashboard-media-status')];
  const stations = [
    ['Iran International', 'https://radio.iraninternational.app/iintl_c'],
    ['Radio Farda', 'https://stream.radiojar.com/cp13r2cpn3quv'],
    ['Radio Javan TV audio', 'https://rjtvhls.wns.live/hls/stream.m3u8'],
    ['کلاب نبرد اندیشه‌ها', 'https://clubhouse-mini.tail4a3417.ts.net/hls/master.m3u8'],
    ['CHUM 104.5', 'https://playerservices.streamtheworld.com/api/livestream-redirect/CHUMFMAAC_SC'],
    ['Z100 New York', 'https://stream.revma.ihrhls.com/zc1469/hls.m3u8'],
    ['KIIS FM Los Angeles', 'https://stream.revma.ihrhls.com/zc185/hls.m3u8'],
  ].map(([name, url], index) => ({id: 'radio-' + index, name, url}));
  const radio = {id: 'radio', name: 'Radio', entries: stations};

  let playlists = [{id: 'music', name: 'Music', entries: []}];
  let selectedId = 'music';
  let database;
  let selectedMedia;
  let fileUrl;
  let playAttempt = 0;
  let playbackTimer;
  let starting = false;
  let saveAttempt = 0;

  function status(text) {
    for (const element of statuses) element.textContent = text;
  }

  function refreshControls() {
    const playing = starting || !audio.paused;
    const action = playing ? 'Pause' : 'Play';
    quickToggle.disabled = !selectedMedia;
    quickToggle.firstElementChild.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">'+(playing?'<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>':'<path d="m7 3 15 9-15 9z"/>')+'</svg>';
    byId('dashboard-media-action').textContent = action;
    quickToggle.setAttribute('aria-label', selectedMedia ? action + ' ' + selectedMedia.entry.name : 'Play');
    for (const button of document.querySelectorAll('[data-media-id]')) {
      const active = playing && selectedMedia?.entry.id === button.dataset.mediaId;
      button.textContent = (active ? 'Pause · ' : 'Play · ') + button.dataset.mediaName;
      button.setAttribute('aria-pressed', String(active));
    }
  }

  function pausePlayback() {
    ++playAttempt;
    clearTimeout(playbackTimer);
    starting = false;
    audio.pause();
    refreshControls();
  }

  function clearMedia() {
    pausePlayback();
    audio.onerror = null;
    audio.removeAttribute('src');
    audio.load();
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    fileUrl = undefined;
    selectedMedia = undefined;
    status('');
    refreshControls();
  }

  function resumePlayback() {
    if (!selectedMedia) return;
    const {entry} = selectedMedia;
    const attempt = ++playAttempt;
    starting = true;
    refreshControls();
    status('Loading · ' + entry.name);
    const unavailable = () => {
      if (attempt !== playAttempt) return;
      pausePlayback();
      status('Could not play ' + entry.name + '. Tap Play to retry.');
    };
    audio.onerror = unavailable;
    playbackTimer = setTimeout(unavailable, 12000);
    audio.play().then(() => {
      if (attempt !== playAttempt) return;
      clearTimeout(playbackTimer);
      starting = false;
      refreshControls();
      status(entry.name);
    }).catch(unavailable);
  }

  function togglePlayback() {
    if (!selectedMedia) return;
    if (starting || !audio.paused) {
      pausePlayback();
      status('Paused · ' + selectedMedia.entry.name);
    } else {
      resumePlayback();
    }
  }

  function selectMedia(list, entry) {
    if (selectedMedia?.entry.id === entry.id) {
      togglePlayback();
      return;
    }
    clearMedia();
    selectedMedia = {list, entry};
    fileUrl = entry.file ? URL.createObjectURL(entry.file) : undefined;
    audio.src = fileUrl || entry.url;
    resumePlayback();
  }

  quickToggle.onclick = togglePlayback;
  audio.onplay = audio.onpause = refreshControls;
  audio.onended = () => {
    if (!selectedMedia) return;
    const {list, entry} = selectedMedia;
    const index = list.entries.findIndex(item => item.id === entry.id);
    const next = list !== radio && index >= 0 && list.entries[index + 1];
    if (next) selectMedia(list, next);
    else {
      pausePlayback();
      status('Playback ended · ' + entry.name);
    }
  };

  function saveLibrary() {
    const attempt = ++saveAttempt;
    const done = saved => {
      if (attempt === saveAttempt) byId('media-save-status').textContent = saved
        ? 'Saved on this device.'
        : 'Storage is unavailable. Changes are kept for this visit.';
    };
    try {
      const tx = database.transaction('library', 'readwrite');
      tx.objectStore('library').put({playlists, selectedId}, 'playlists');
      tx.oncomplete = () => done(true);
      tx.onabort = tx.onerror = () => done(false);
    } catch {
      done(false);
    }
  }

  function selectedPlaylist() {
    return playlists.find(list => list.id === selectedId) || playlists[0];
  }

  function buildList(list, editable) {
    const entries = document.createElement('ul');
    entries.className = 'media-entries';
    for (const entry of list.entries) {
      const item = document.createElement('li');
      const play = document.createElement('button');
      play.type = 'button';
      play.className = 'secondary';
      play.dataset.mediaId = entry.id;
      play.dataset.mediaName = entry.name;
      play.onclick = () => selectMedia(list, entry);
      item.append(play);
      if (editable) {
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'secondary';
        remove.textContent = 'Remove';
        remove.setAttribute('aria-label', 'Remove ' + entry.name);
        remove.onclick = () => {
          if (selectedMedia?.entry.id === entry.id) clearMedia();
          list.entries = list.entries.filter(item => item.id !== entry.id);
          updateLibrary();
        };
        item.append(remove);
      }
      entries.append(item);
    }
    return entries;
  }

  function renderLibrary() {
    const list = selectedPlaylist();
    picker.replaceChildren(...playlists.map(item => new Option(item.name, item.id)));
    picker.value = list.id;
    byId('media-remove-list').disabled = playlists.length === 1;
    byId('media-entries').replaceChildren(buildList(list, true));
    const dashboard = byId('dashboard-playlists');
    dashboard.replaceChildren();
    for (const item of [radio, ...playlists]) {
      if (!item.entries.length) continue;
      const heading = document.createElement('h3');
      heading.textContent = item.name;
      dashboard.append(heading, buildList(item, false));
    }
    refreshControls();
  }

  function updateLibrary() {
    renderLibrary();
    saveLibrary();
  }

  function addEntries(entries) {
    selectedPlaylist().entries.push(...entries.map(entry => ({...entry, id: crypto.randomUUID()})));
    updateLibrary();
  }

  byId('media-new-list').onsubmit = event => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = new FormData(form).get('name').trim();
    if (!name || playlists.some(list => list.name.toLowerCase() === name.toLowerCase())) {
      byId('media-save-status').textContent = 'Choose a different playlist name.';
      return;
    }
    selectedId = crypto.randomUUID();
    playlists.push({id: selectedId, name, entries: []});
    form.reset();
    updateLibrary();
  };

  picker.onchange = () => { selectedId = picker.value; updateLibrary(); };
  byId('media-remove-list').onclick = () => {
    if (playlists.length <= 1) return;
    if (selectedMedia?.list.id === selectedId) clearMedia();
    playlists = playlists.filter(list => list.id !== selectedId);
    selectedId = playlists[0].id;
    updateLibrary();
  };
  byId('media-files').onchange = event => {
    const input = event.currentTarget;
    const entries = Array.from(input.files, file => ({name: file.name, file}));
    if (entries.length) addEntries(entries);
    input.value = '';
  };
  byId('media-stream-form').onsubmit = event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = data.get('name').trim();
    let url;
    try { url = new URL(data.get('stream')); } catch {}
    if (!name || url?.protocol !== 'https:' || url.username || url.password) {
      byId('media-save-status').textContent = 'Enter a name and an HTTPS audio stream.';
      return;
    }
    addEntries([{name, url: url.href}]);
    form.reset();
  };

  const stationPicker = byId('media-stations');
  stationPicker.replaceChildren(...stations.map((item, index) => new Option(item.name, String(index))));
  byId('media-add-station').onclick = () => addEntries([stations[Number(stationPicker.value)]]);

  async function initializeLibrary() {
    renderLibrary();
    try {
      database = await new Promise((resolve, reject) => {
        const request = indexedDB.open('rahyar.media', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('library');
        request.onsuccess = () => resolve(request.result);
        request.onerror = request.onblocked = reject;
      });
      const saved = await new Promise((resolve, reject) => {
        const request = database.transaction('library').objectStore('library').get('playlists');
        request.onsuccess = () => resolve(request.result);
        request.onerror = reject;
      });
      if (saved?.playlists?.length) {
        playlists = saved.playlists;
        selectedId = saved.selectedId;
        renderLibrary();
      }
    } catch {
      byId('media-save-status').textContent = 'Saved playlists are unavailable in this browser.';
    } finally {
      byId('media-library').disabled = false;
    }
  }

  initializeLibrary();
})();
