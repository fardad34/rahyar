'use strict';

const savedPlacesKey = 'rahyar.savedPlaces';
let savedPlaces = [];
let placeToSave = null;

function refreshSavedPlaces() {
  const picker = $('saved-places');
  picker.replaceChildren(new Option(savedPlaces.length ? 'Choose a saved place' : 'No saved places yet', ''),
    ...savedPlaces.map(place => new Option(place.label, place.label)));
  $('remove-saved-place').disabled = true;
}

function openSavePlace(place) {
  if (!place) return;
  placeToSave = place;
  $('saved-place-name').value = '';
  $('save-place-address').textContent = place.addressLabel || place.name;
  $('save-place-status').textContent = '';
  openAppDialog($('save-place-dialog'));
}

function initSavedPlaces() {
  try {
    const stored = JSON.parse(localStorage.getItem(savedPlacesKey));
    if (Array.isArray(stored)) savedPlaces = stored.filter(item => typeof item?.label === 'string' &&
      typeof item.place?.name === 'string' && item.place.coord?.length === 2 && item.place.coord.every(Number.isFinite));
  } catch {}
  refreshSavedPlaces();
  $('saved-places').onchange = () => {
    const disabled = !$('saved-places').value;
    $('use-saved-place').disabled = disabled;
    $('remove-saved-place').disabled = disabled;
  };
  $('use-saved-place').onclick = () => {
    const item = savedPlaces.find(place => place.label === $('saved-places').value);
    if (!item) return;
    setPlaceSearchMode('destination');
    setSearchedDestination(item.place, false);
  };
  $('remove-saved-place').onclick = () => {
    const next = savedPlaces.filter(place => place.label !== $('saved-places').value);
    if (!writeSavedPlaces(next, $('saved-places-status'))) return;
    $('saved-places-status').textContent = 'Saved place removed.';
  };
  $('save-current-destination').onclick = () => openSavePlace(dest);
  $('close-save-place').onclick = () => closeAppDialog($('save-place-dialog'));
  $('save-place-form').onsubmit = event => {
    event.preventDefault();
    const label = $('saved-place-name').value.trim();
    if (!label || !placeToSave) return;
    const duplicate = savedPlaces.some(place => place.label.toLowerCase() === label.toLowerCase());
    if (duplicate) {
      $('save-place-status').textContent = 'This name is in use. Choose another name or remove the old saved place.';
      return;
    }
    if (!writeSavedPlaces([...savedPlaces, {label, place:placeToSave}], $('save-place-status'))) return;
    closeAppDialog($('save-place-dialog'));
    $('saved-places-status').textContent = 'Saved ' + label + ' on this device.';
  };
}

function writeSavedPlaces(places, status) {
  try { localStorage.setItem(savedPlacesKey, JSON.stringify(places)); }
  catch { status.textContent = 'This device could not save the change.'; return false; }
  savedPlaces = places;
  refreshSavedPlaces();
  $('use-saved-place').disabled = true;
  return true;
}
