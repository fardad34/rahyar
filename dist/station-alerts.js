'use strict';

const stationReportKey = 'rahyar.stationObservations';
const stationReportLifetime = 20 * 60 * 1000;
const stationWarnings = new Map();
let stationWarningSession;
let stationNoticeTimer;

function stationDirection(station) {
  const text = station.direction || '';
  if (/\bboth(?:\s+directions)?\s*$/i.test(text)) return 'both';
  const label = text.match(/\b(north|east|south|west)\s*bound\b/i)?.[1] ||
    text.match(/\d\s*([NESW])\s*$/i)?.[1] ||
    text.match(/^([NESW])$/i)?.[1];
  return {n:0,e:90,s:180,w:270}[label?.[0].toLowerCase()];
}

function stationRouteBearing(station) {
  return bearingBetween(pointOnRoute(Math.max(0,station.at-250)),
    pointOnRoute(Math.min(routeLength,station.at+250)));
}

function stationMatchesRoute(station) {
  // Catalog points are often facility centroids. Avoid matching distant or parallel roads.
  if (!Number.isFinite(station.off) || station.off > 150) return false;
  const direction = stationDirection(station);
  if (direction === 'both') {
    if (!station.reportByDirection) return true;
    const bearing = stationRouteBearing(station);
    return Number.isFinite(bearing) && Math.abs(Math.sin(bearing*Math.PI/180)) >= Math.SQRT1_2 - 1e-8;
  }
  if (!Number.isFinite(direction)) return false;
  const heading = stationRouteBearing(station);
  return heading !== null && Math.abs(((heading-direction+540)%360)-180) <= 45;
}

function stationIdentity(station) {
  const identity = [station.country,station.osmType,station.osmId,station.coord,station.direction];
  if (station.reportByDirection) {
    const bearing = stationRouteBearing(station);
    identity.push(Number.isFinite(bearing) && bearing > 0 && bearing < 180 ? 'eastbound' : 'westbound');
  }
  return JSON.stringify(identity);
}

function readStationObservations() {
  try {
    const rows = JSON.parse(localStorage.getItem(stationReportKey));
    return Array.isArray(rows) ? rows.filter(r=>r && ['open','closed'].includes(r.status) &&
      r.time <= Date.now() && Date.now()-r.time < stationReportLifetime) : [];
  } catch { return []; }
}

function currentStationObservation(station) {
  if(typeof window==='undefined' || !window.RahyarCloud) return null;
  const result=window.RahyarCloud.stationStatus(station,stationRouteBearing(station));
  return result.latest ? {...result,time:Date.parse(result.latest.observed_at)} : null;
}

function stationThreshold(distance, stages) {
  if (distance < 0) return 0;
  if (distance <= 3000 && !stages.has(3)) return 3;
  if (distance > 3000 && distance <= 20000 && !stages.has(20)) return 20;
  return 0;
}

function updateStationWarning() {
  if (stationWarningSession !== session) {
    stationWarnings.clear();
    stationWarningSession = session;
    $('station-warning-notice').textContent = '';
  }
  if (watch === null || activeRouteVehicle !== 'truck' || isDemo || !coords.length ||
      guidanceOffRoute || !gpsTime || Date.now()-gpsTime > 15000 ||
      !Number.isFinite(lastAccuracyMeters) || lastAccuracyMeters > 50) return;
  const station = nextAlertStation();
  if (!station) return;
  const key = stationIdentity(station);
  if (!stationWarnings.has(key)) stationWarnings.set(key,new Set());
  const stages = stationWarnings.get(key);
  const stage = stationThreshold(station.at-progress,stages);
  if (!stage) return;
  stages.add(stage);
  if (stage === 3) stages.add(20);
  const observation = currentStationObservation(station);
  const status = observation && observation.status!=='unknown' ? 'Drivers report '+observation.status+'; not official' : 'Current status unknown';
  const distance = usesMiles(currentCountry) ? (stage === 20 ? '12.4 miles' : '1.9 miles') : stage+' km';
  const message = stage === 20
    ? 'Inspection station ahead: '+station.name+'. Review its status. Report it when you can see the sign.'
    : 'Inspection station approaching: '+station.name+'. '+status+'. Follow posted signs.';
  const notice = $('station-warning-notice');
  notice.textContent = 'Within '+distance+' · '+message;
  clearTimeout(stationNoticeTimer);
  stationNoticeTimer = setTimeout(()=>{notice.textContent='';},20000);
  if(typeof speakNavigationText==='function')speakNavigationText(message);

}

function nextAlertStation() {
  return roadFacilities.find(station=>station.at>=progress && isGovernmentFacility(station) &&
    facilityVisible(station) && stationMatchesRoute(station)) || null;
}

function createStationReportPanel(station) {
  const panel = document.createElement('div');
  panel.className = 'station-report-panel';
  panel.innerHTML = '<div class="station-lamps" aria-hidden="true"><i></i><i></i></div>'+
    '<div class="station-report-copy"><strong></strong><small></small></div>'+
    '<div class="station-report-actions"><span>Station open?</span> <button type="button" class="secondary">Yes</button> <button type="button" class="secondary">No</button></div>';
  const title = panel.querySelector('strong'), detail = panel.querySelector('small');
  const actions = panel.querySelector('.station-report-actions');
  const buttons = [...panel.querySelectorAll('button')];
  const refresh = () => {
    const observation = currentStationObservation(station);
    panel.dataset.status = observation?.status || 'unknown';
    title.textContent = observation && observation.status!=='unknown' ? 'Drivers report: '+observation.status+' · Not official' : 'Current status Unknown';
    detail.textContent = observation ? new Date(observation.time).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})+' · '+observation.source+' · '+observation.count+' independent driver(s). Latest: '+observation.latest.status : 'No fresh, direction-matched corroboration. Follow posted signs';
    actions.hidden = !stationMatchesRoute(station) || isDemo || watch === null || activeRouteVehicle !== 'truck';
  };
  buttons.forEach((button,index)=>button.onclick=async()=>{
    button.disabled=true;
    try {
      if(!stationMatchesRoute(station))throw Error('This station does not match your route direction.');
      const result=await window.rahyarSubmitStation(station,index?'closed':'open');
      detail.textContent=result.queued?'Observation queued offline; not shared yet.':'Observation shared. Waiting for independent corroboration.';
    } catch(error){detail.textContent=error.message;}
    finally{button.disabled=false;}
  });

  panel.refreshStatus = refresh;
  refresh();
  return panel;
}
