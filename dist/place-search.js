'use strict';
function looksLikeAddress(q){return /\d|,|\b(ave|avenue|street|st|road|rd|blvd|drive|dr|highway|hwy)\b/i.test(q)}
function canadianPostal(text){return (String(text).toUpperCase().match(/\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/)||[])[0]?.replace(/\s/g,'')||''}
const esriCountryCodes = new Map(Object.entries(supportedGeocodingCountries).map(([iso2,iso3]) => [iso3,iso2]));

function parseAddressCandidates(data,query){
  const number=(query.match(/^\s*(\d+[A-Za-z]?)\b/)||[])[1],requestedPostal=canadianPostal(query);
  return (data.candidates||[]).filter(c=>esriCountryCodes.has(c.attributes?.Country)&&c.score>=85&&Number.isFinite(c.location?.x)&&Number.isFinite(c.location?.y)).filter(c=>!number||(['PointAddress','StreetAddress','Subaddress','PointAddressInt'].includes(c.attributes?.Addr_type)&&(String(c.attributes.AddNum||'').toLowerCase()===number.toLowerCase()||String(c.address).toLowerCase().startsWith(number.toLowerCase()+' ')))).map(c=>{
    const label=c.attributes.Match_addr||c.address,postal=canadianPostal(label),mismatch=!!requestedPostal&&!!postal&&requestedPostal!==postal;
    const name=label.split(',')[0];return {name,en:name,addressLabel:looksLikeAddress(query)?query:label,providerAddress:label,locality:c.attributes.City||'',coord:[c.location.x,c.location.y],country:esriCountryCodes.get(c.attributes.Country),regionLabel:c.attributes.Region||'',isAddress:true,matchNote:c.attributes.Addr_type==='PointAddress'?'Address point — verify entrance':'Address match — verify entrance',postalMismatch:mismatch};
  });
}
function parsePhotonPlaces(data,query){
  const numbered=/^\s*\d+\b/.test(query);
  return (data.features||[]).filter(f=>supportsCountry(f.properties?.countrycode?.toUpperCase())&&f.geometry?.coordinates?.every(Number.isFinite)).map(f=>{
    const p=f.properties,street=p.street||(/street/.test(p.type||'')?p.name:''),name=[p.housenumber,street].filter(Boolean).join(' ')||p.name||p.city||p.postcode;
    const label=[name,p.city,p.state,p.postcode,p.country].filter(Boolean).filter((v,i,a)=>!i||v!==a[i-1]).join(', ');
    return {name,en:name,addressLabel:looksLikeAddress(query)?label:null,coord:f.geometry.coordinates,country:p.countrycode.toUpperCase(),locality:p.city||p.town||p.village||'',regionLabel:p.state||'',isAddress:!!street,matchNote:numbered&&!p.housenumber?'Street only — house number not confirmed':''};
  });
}
function localFacilityMatches(query,facilities) {
  const normalize=value=>String(value||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/\bwassi\b/g,'wasi').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const tokens=normalize(query).split(/\s+/).filter(Boolean);
  if(!tokens.length||tokens.join('').length<3)return [];
  return facilities.filter(f=>f.kind!=='scale'&&tokens.every(token=>normalize(f.name).includes(token))).slice(0,12).map(f=>({...f,en:f.name,regionLabel:f.region||'',matchNote:(f.direction?f.direction+' · ':'')+'Inventory point; verify signed entrance. Operating status is not supplied by this inventory.'}));
}
async function searchPlaces(){
  if(mapPinLookupPending)return;
  if(pendingMapPin){
    const pin=pendingMapPin;
    setPlaceSearchMode('destination');
    setSearchedDestination(pin);
    return;
  }
  const q=$('query').value.trim(),id=++requestId;if(searchKey(q).length<2){$('search-status').textContent='Enter a city, street address or postal code.';return}
  if(placeSearchMode==='watch'&&looksLikeAddress(q)){$('search-status').textContent='Enter a city name for the watchlist.';return}
  $('search').disabled=true;$('results').replaceChildren();$('search-status').textContent='Searching places…';
  try{
    if(!looksLikeAddress(q)){let catalog=[];try{catalog=await loadCatalog()}catch{}if(id!==requestId)return;const local=localCityMatches(q,catalog);if(local.length){showCityResults(local);$('search-status').textContent=integer(local.length)+' results. Select a match.';return}}
    if(placeSearchMode!=='watch'&&typeof window!=='undefined'){const facilities=localFacilityMatches(q,window.RAHYAR_FACILITY_CATALOG?.facilities||[]);if(facilities.length){showCityResults(facilities);$('search-status').textContent=facilities.length+' inventory matches. Verify travel direction and signed entrance; operating status is separate.';return;}}
    let matches=[];
    if(looksLikeAddress(q))try{const params=new URLSearchParams({SingleLine:q,f:'json',sourceCountry:Object.values(supportedGeocodingCountries).join(','),maxLocations:'6',outFields:'Match_addr,Addr_type,Country,City,Region,Postal,AddNum',forStorage:'false'});matches=parseAddressCandidates(await getJSON('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?'+params,{},12000),q)}catch{}
    if(!matches.length)try{
      const params=new URLSearchParams({q,limit:'12',lang:'en'});
      for(const code of Object.keys(supportedGeocodingCountries))params.append('countrycode',code);
      matches=parsePhotonPlaces(await getJSON('https://photon.komoot.io/api/?'+params,{},10000),q);
    }catch{}
    if(id!==requestId)return;showCityResults(matches);$('search-status').textContent=matches.length?'Check the address before selecting.':'No matching place found. Check the address or try a nearby street. Online search may be unavailable.';
  }finally{if(id===requestId)$('search').disabled=false}
}
