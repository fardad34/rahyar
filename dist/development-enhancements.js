'use strict';
(() => {
 const historyKey='rahyar.destinationHistory.v1',favoritesKey='rahyar.quickFavorites.v1';
 const read=(key,fallback=[])=>{try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return key===appThemeKey?(localStorage.getItem(key)||fallback):fallback;}};
 const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{message('Device storage unavailable. Changes are not persisted.',true);return false;}};
 const same=(a,b)=>a?.coord?.join(',')===b?.coord?.join(',');
 function renderHistory(){
  const box=$('destination-history');if(!box)return;box.replaceChildren();
  const favorites=read(favoritesKey),history=read(historyKey);
  for(const [heading,places] of [['★ Favorites',favorites],['◷ Recent destinations',history]]){
   const title=document.createElement('strong');title.textContent=heading;box.append(title);
   for(const place of places){const row=document.createElement('div'),use=document.createElement('button'),fav=document.createElement('button');
    use.type=fav.type='button';use.className=fav.className='secondary';use.textContent=place.addressLabel||place.name;use.onclick=()=>{if(watch!==null&&!confirm('Change the destination and recalculate your active route?'))return;setSearchedDestination(place,false);};
    const chosen=favorites.some(f=>same(f,place));fav.textContent=chosen?'★':'☆';fav.setAttribute('aria-label',chosen?'Remove favorite':'Add favorite');fav.onclick=()=>{if(!chosen&&favorites.length>=5){message('Five quick favorites are already saved. Remove one before adding another.',true);return;}write(favoritesKey,chosen?favorites.filter(f=>!same(f,place)):[place,...favorites]);renderHistory();};
    row.append(use,fav);box.append(row);
   }
  }
 }
 function setup(){
  const picker=$('route-vehicle'),cards=document.createElement('div');cards.className='vehicle-cards';cards.setAttribute('role','group');cards.setAttribute('aria-label','Vehicle type');
  const car='<svg viewBox="0 0 160 70" aria-hidden="true"><path d="M20 44 34 22h72l21 22h17v15H14V44z" fill="currentColor"/><path d="M42 27h24v17H31zm30 0h28l17 17H72z" fill="#bad5ea"/><circle cx="40" cy="59" r="10" fill="#263342"/><circle cx="118" cy="59" r="10" fill="#263342"/></svg>';
  const truck='<svg viewBox="0 0 180 70" aria-hidden="true"><rect x="4" y="12" width="114" height="39" rx="4" fill="currentColor"/><path d="M122 24h26l23 23v12h-49z" fill="currentColor"/><path d="M129 29h17l13 15h-30z" fill="#bad5ea"/><path d="M4 54h118" stroke="#263342" stroke-width="6"/><g fill="#263342"><circle cx="22" cy="59" r="9"/><circle cx="43" cy="59" r="9"/><circle cx="106" cy="59" r="9"/><circle cx="153" cy="59" r="9"/></g></svg>';
  for(const [value,label,icon] of [['auto','Passenger car',car],['truck','Semi-truck',truck]]){
   const b=document.createElement('button');b.type='button';b.className='secondary vehicle-card';b.dataset.vehicle=value;b.innerHTML=icon+'<span>'+label+'</span>';
   b.onclick=()=>{if(picker.disabled)return;picker.value=value;picker.dispatchEvent(new Event('change'));if(value==='truck'&&!read('rahyar.truckReviewed',false)){openTruckSettings();write('rahyar.truckReviewed',true);}updateCards();};cards.append(b);
  }
  const updateCards=()=>{for(const b of cards.children){b.setAttribute('aria-pressed',String(b.dataset.vehicle===picker.value));b.disabled=picker.disabled;}};
  picker.after(cards);picker.hidden=true;picker.addEventListener('change',updateCards);new MutationObserver(updateCards).observe(picker,{attributes:true,attributeFilter:['disabled']});updateCards();
  const history=document.createElement('details');history.className='destination-history';history.innerHTML='<summary>★ Favorites &amp; ◷ last 30 destinations</summary><div id="destination-history"></div><button id="clear-destination-history" type="button" class="secondary">Clear history</button>';$('results').after(history);$('clear-destination-history').onclick=()=>{write(historyKey,[]);renderHistory();};renderHistory();
  const original=selectDestination;
  selectDestination=function(city,...args){if(city){const items=read(historyKey).filter(c=>!same(c,city));write(historyKey,[city,...items].slice(0,30));renderHistory();}return original(city,...args);};
  // A deliberate tap in Explore chooses coordinates. Active navigation is unaffected.
  $('pick-map-pin').hidden=true;
  const menu=document.createElement('details');menu.className='map-settings-menu';menu.innerHTML='<summary aria-label="Map settings">☰</summary><div class="map-settings-content"></div>';
  const menuContent=menu.querySelector('div');
  for(const id of ['map-night','map-traffic','map-satellite','map-dimension'])menuContent.append($(id));
  const voice=document.querySelector('.map-heading-actions [data-voice-toggle]');if(voice)menuContent.append(voice);
  const voiceSettings=document.createElement('button');voiceSettings.type='button';voiceSettings.className='secondary';voiceSettings.textContent='Voice & alert settings';voiceSettings.onclick=()=>{openAppDialog($('app-settings'));};menuContent.append(voiceSettings);
  document.querySelector('.map-wrap').append(menu);
  $('focus-fullscreen').hidden=true;$('phone-full-map').hidden=true;
  const recenter=$('focus-follow');recenter.classList.add('compact-recenter');document.querySelector('.speed-dials').after(recenter);
  const pickerTheme=$('app-theme');pickerTheme.replaceChildren(...[['light','Classic Light'],['original','Midnight Blue'],['graphite','Graphite'],['forest','Forest Green'],['sand','Warm Sand'],['contrast','High Contrast']].map(([value,name])=>new Option(name,value)));applyAppTheme(read(appThemeKey,'original'));
  $('open-account').onclick=()=>{$('cloud-panel').open=true;$('cloud-panel').scrollIntoView({block:'start',behavior:'smooth'});};
  const configuration=document.createElement('details');configuration.className='settings-section';configuration.innerHTML='<summary>Saved truck combinations</summary><label>Configuration name <input id="vehicle-name" maxlength="60" placeholder="Loaded dry van"></label><label>Load state <select id="vehicle-load"><option value="loaded">Loaded</option><option value="empty">Empty</option></select></label><p>Enter the actual current gross weight above. Selecting Empty does not infer or change weight.</p><button id="save-vehicle-config" class="secondary" type="button">Save combination</button><div id="vehicle-configs"></div><p id="vehicle-config-status" role="status"></p>';$('truck-profile').append(configuration);
  function renderVehicles(){const box=$('vehicle-configs');box.replaceChildren();for(const record of read('rahyar.vehicles.v1')){const use=document.createElement('button');use.type='button';use.className='secondary';use.textContent=record.name;use.onclick=()=>{if(watch!==null){$('vehicle-config-status').textContent='Pause your trip before changing the vehicle.';return;}for(const field of truckFields)$('truck-'+field).value=record.profile[field];$('truck-hazmat').checked=record.profile.hazmat;showTrailerPreset(record.trailer);$('vehicle-load').value=record.load;persistTruckProfile(record.profile);truckProfileNeedsReview=true;$('vehicle-config-status').textContent='Loaded saved combination. Review actual dimensions and weights, then save.';};box.append(use);}}
  $('save-vehicle-config').onclick=()=>{const profile=readTruckProfile(text=>$('vehicle-config-status').textContent=text);if(!profile)return;const name=$('vehicle-name').value.trim();if(!name){$('vehicle-config-status').textContent='Choose a configuration name.';return;}const records=read('rahyar.vehicles.v1');const row={name,profile,trailer:trailerPreset,load:$('vehicle-load').value};write('rahyar.vehicles.v1',[...records.filter(r=>r.name!==name),row]);$('vehicle-config-status').textContent='Saved on this device. Use account sync to copy to another device.';renderVehicles();};renderVehicles();
  const sync=document.createElement('div');sync.innerHTML='<p>Settings sync is explicit: upload replaces your saved cloud settings; download replaces local settings. Trips/media files are not included.</p><button id="upload-settings" type="button" class="secondary">Upload my settings</button><button id="download-settings" type="button" class="secondary">Download my settings</button><p id="sync-settings-status" role="status"></p>';$('cloud-panel').append(sync);
  const syncKeys=[historyKey,favoritesKey,'rahyar.uiLanguage','rahyar.vehicles.v1',truckProfileKey,'rahyar-focus-watch',appThemeKey,'rahyar.voiceLanguage','rahyar.voiceEnabled'];
  const syncId='00000000-0000-4000-8000-000000000001';
  async function synchronize(upload){const cloud=window.RahyarCloud;if(!cloud?.user){$('sync-settings-status').textContent='Sign in first.';return;}if(!confirm(upload?'Replace your cloud settings with this device’s settings?':'Replace this device’s settings with your cloud settings?'))return;
   const c=cloud.client();let error;
   if(upload){const data={};for(const key of syncKeys)data[key]=localStorage.getItem(key);({error}=await c.from('rahyar_saved_records').upsert({user_id:cloud.user.id,kind:'preferences',client_id:syncId,data,updated_at:new Date().toISOString()},{onConflict:'user_id,kind,client_id'}));}
   else{const response=await c.from('rahyar_saved_records').select('data').eq('user_id',cloud.user.id).eq('kind','preferences').eq('client_id',syncId).maybeSingle();error=response.error;if(response.data){for(const key of syncKeys){const value=response.data.data[key];if(typeof value==='string')localStorage.setItem(key,value);}renderHistory();renderVehicles();applyAppTheme(read(appThemeKey,'original'));}}
   $('sync-settings-status').textContent=error?'Sync failed. Your local settings remain available.':upload?'Settings saved to your private account.':'Settings downloaded. Reload to apply truck/voice settings.';
  }
  $('upload-settings').onclick=()=>synchronize(true);$('download-settings').onclick=()=>synchronize(false);
  const validTrip=()=>{const active=watch!==null&&coords.length>1&&routeLength>0;$('stop').hidden=!active;$('end-trip').hidden=!active;};setInterval(validTrip,1000);validTrip();
 }
 if(!document.body.classList.contains('notice-required'))setup();else new MutationObserver((_,observer)=>{if(!document.body.classList.contains('notice-required')){observer.disconnect();queueMicrotask(setup);}}).observe(document.body,{attributes:true,attributeFilter:['class']});
})();
