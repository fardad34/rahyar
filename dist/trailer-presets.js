'use strict';

// Example loaded combinations in metres and metric tonnes. The Canadian
// interprovincial MOU supplies reference dimensions by combination category.
// Actual axle weights and dimensions must be checked for each loaded vehicle.
const trailerPresets = {
  'dry-van': ['Dry Van', 23, 39.5, 9, 5],
  reefer: ['Reefer', 23, 39.5, 9, 5],
  heated: ['Heated Van', 23, 39.5, 9, 5],
  flatbed: ['Flatbed', 23, 39.5, 9, 5],
  conestoga: ['Conestoga', 23, 39.5, 9, 5],
  'step-deck': ['Step Deck', 23, 39.5, 9, 5],
  lowboy: ['Lowboy', 23, 43, 9, 6],
  tanker: ['Tanker', 23, 39.5, 9, 5],
  dump: ['Dump Trailer', 23, 39.5, 9, 5],
  'walking-floor': ['Walking Floor', 23, 39.5, 9, 5],
  chassis: ['Intermodal Chassis', 23, 39.5, 9, 5],
  'car-carrier': ['Car Carrier', 23, 39.5, 9, 5],
  log: ['Log Trailer', 23, 43, 9, 6],
  livestock: ['Livestock Trailer', 23, 39.5, 9, 5],
  'super-b': ['Super-B Train', 27.5, 62.5, 9, 8],
  'a-train': ['A-Train', 25, 53.5, 9, 7],
  'c-train': ['C-Train', 25, 58.5, 9, 8],
};
let trailerPreset = '';
let truckProfileNeedsReview = false;

function showTrailerPreset(key) {
  trailerPreset = Object.prototype.hasOwnProperty.call(trailerPresets,key) ? key : '';
  const icon = trailerPreset ? 'trailer-icons/' + trailerPreset + '.svg' : '';
  document.body.classList.toggle('has-trailer-avatar', Boolean(icon));
  if (icon) document.body.style.setProperty('--trailer-avatar', 'url("' + icon + '")');
  for (const button of $('trailer-presets').querySelectorAll('button')) {
    button.setAttribute('aria-pressed',String(button.value === trailerPreset));
  }
}

function selectTrailerPreset(key) {
  const [name,length,weight,axle_load,axle_count] = trailerPresets[key];
  const values = {height:4.15,width:2.6,length,weight,axle_load,axle_count};
  for (const field of truckFields) $('truck-' + field).value = values[field];
  showTrailerPreset(key);
  truckProfileNeedsReview = true;
  $('truck-save-status').textContent = name + ' selected. Check the loaded values and save the profile.';
}

function initTrailerPresets() {
  const picker = $('trailer-presets');
  for (const [key,[name]] of Object.entries(trailerPresets)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.value = key;
    const icon = document.createElement('img');
    icon.src = 'trailer-icons/' + key + '.svg';
    icon.alt = '';
    const label = document.createElement('span');
    label.textContent = name;
    button.append(icon,label);
    button.onclick = () => selectTrailerPreset(key);
    picker.append(button);
  }
}
