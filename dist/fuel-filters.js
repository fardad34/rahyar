'use strict';
const fuelBrandKeys=['petro-pass','flying-j','pilot','esso','bvd','ta-petro','loves','other'];
function fuelBrandKey(item){
  const text=[item.brand,item.name,item.sourceType].filter(Boolean).join(' ');
  if(/petro[ -]?pass/i.test(text))return 'petro-pass';
  if(/flying[ -]?j/i.test(text))return 'flying-j';
  if(/\bpilot\b/i.test(text))return 'pilot';
  if(/\besso\b/i.test(text))return 'esso';
  if(/\bbvd\b/i.test(text))return 'bvd';
  if(/travelcenters|\bTA\b|petro stopping/i.test(text))return 'ta-petro';
  if(/love.s/i.test(text))return 'loves';
  return 'other';
}
function fuelBrandVisible(item){if(!['diesel','truck','service'].includes(item.kind))return true;const box=$('brand-'+fuelBrandKey(item));return !box||box.checked}
function initFuelFilters(){for(const key of fuelBrandKeys)$('brand-'+key).onchange=()=>{focusRowsKey='';render();drawRoute();updateDrivingHud();refreshFocusSummary(true)}}
