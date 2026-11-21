'use strict';

let pickingMapPin = false;
let pendingMapPin = null;
let mapPinLookupPending = false;
let leafletDestinationPin = null;
let navigationDestinationPin = null;

function setMapPinPicking(enabled) {
  pickingMapPin = enabled;
  const button = $('pick-map-pin');
  button.textContent = enabled ? 'Cancel pin' : 'Pick on map';
  button.setAttribute('aria-pressed', String(enabled));
  document.body.classList.toggle('picking-map-pin', enabled);
  $('map-pin-help').hidden = !enabled;
}

function drawMapPin(coord) {
  leafletDestinationPin?.remove();
  navigationDestinationPin?.remove();
  leafletDestinationPin = null;
  navigationDestinationPin = null;
  if (!coord) return;
  if (map) {
    const icon = L.divIcon({className:'destination-map-pin', iconSize:[22,22], iconAnchor:[11,22]});
    leafletDestinationPin = L.marker([coord[1],coord[0]], {icon,interactive:false,keyboard:false}).addTo(map);
  }
  if (navigationMap) {
    const element = document.createElement('div');
    element.className = 'destination-map-pin';
    navigationDestinationPin = new maplibregl.Marker({element,anchor:'bottom'}).setLngLat(coord).addTo(navigationMap);
  }
}

async function findMapPinAddress([lon, lat]) {
  try {
    const params = new URLSearchParams({location:`${lon},${lat}`,f:'json',featureTypes:'PointAddress,StreetAddress'});
    const {address} = await getJSON('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?'+params,{},6500);
    if (address?.Match_addr && ['PointAddress','StreetAddress'].includes(address.Addr_type)) {
      return {label:address.Match_addr, locality:address.City, regionLabel:address.Region,
        country:esriCountryCodes.get(address.CountryCode)};
    }
  } catch {}
  try {
    const params = new URLSearchParams({lon,lat,limit:'5',lang:'en'});
    const result = await getJSON('https://photon.komoot.io/reverse?'+params,{},4500);
    const place = result.features?.find(({properties:p}) => p?.housenumber && p.street)?.properties;
    if (place) {
      const locality = place.city || place.town || place.village;
      const label = [place.housenumber+' '+place.street, locality, place.state, place.postcode, place.country].filter(Boolean).join(', ');
      return {label, locality, regionLabel:place.state, country:place.countrycode?.toUpperCase()};
    }
  } catch {}
  return null;
}

function clearPendingMapPin() {
  if (pickingMapPin) setMapPinPicking(false);
  if (!pendingMapPin) return;
  pendingMapPin = null;
  mapPinLookupPending = false;
  $('search').disabled = false;
  requestId++;
  drawMapPin(dest?.mapPin ? dest.coord : null);
}

async function selectMapPin(lngLat) {
  if (!pickingMapPin || document.body.classList.contains('driving')) return;
  const {lng, lat} = lngLat;
  const longitude = lng >= -180 && lng <= 180 ? lng : ((lng + 180) % 360 + 360) % 360 - 180;
  const coord = [longitude, lat];
  if (!coord.every(Number.isFinite) || Math.abs(coord[1]) > 90) return;

  setPlaceSearchMode('destination');
  const id = ++requestId;
  const coordinates = coord[1].toFixed(6) + ', ' + coord[0].toFixed(6);
  const country = regionAt(coord)?.country;
  pendingMapPin = {name:coordinates, addressLabel:coordinates, coord, country, mapPin:true, isAddress:true};
  drawMapPin(coord);
  $('query').value = coordinates;
  mapPinLookupPending = true;
  $('search').disabled = true;
  $('search-status').textContent = 'Looking up the nearest address…';
  $('query').closest('.searchrow').scrollIntoView({block:'center'});
  const match = await findMapPinAddress(coord);
  if (id !== requestId) return;
  if (match) {
    Object.assign(pendingMapPin, {name:match.label,addressLabel:match.label,locality:match.locality,
      regionLabel:match.regionLabel,country:country || match.country});
    $('query').value = match.label;
  }
  mapPinLookupPending = false;
  $('search').disabled = false;
  showCityResults([pendingMapPin]);
  $('search-status').textContent = match ? 'Nearby address found. Select the result to navigate to the pin.' :
    'No nearby address found. Select the coordinates to navigate to the pin.';
}

function initMapPin() {
  $('pick-map-pin').onclick = () => {
    if (pickingMapPin) {
      setMapPinPicking(false);
      return;
    }
    setPlaceSearchMode('destination');
    pauseMainMapFollow();
    setMapPinPicking(true);
    $('map-pin-help').scrollIntoView({block:'start'});
  };
  $('query').addEventListener('input', () => {
    if (!pendingMapPin && !pickingMapPin) return;
    clearPendingMapPin();
    $('results').replaceChildren();
    $('search-status').textContent = '';
  });
  const choosePin = event => {
    if(event.originalEvent?._rahyarRoute||watch!==null)return;
    if(coords.length&&!confirm('Choose a new destination on the map?'))return;
    setMapPinPicking(true);
    selectMapPin(event.lngLat || event.latlng);
  };
  map?.on('click', choosePin);
  navigationMap?.on('click', choosePin);
}
