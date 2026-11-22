'use strict';

let routeManeuvers = [];
let routeRoads = [];
let guidanceOffRoute = false;

function routeRoadLabel(step) {
  return [...new Set([step.name, step.ref].filter(Boolean))].join(' · ');
}

function maneuverInstruction(step, previousRoad) {
  const {type, modifier, exit} = step.maneuver;
  const road = routeRoadLabel(step);
  const exitSign = step.exits?.replace(/;/g, ' / ');
  const direction = modifier?.includes('left') ? 'left' : modifier?.includes('right') ? 'right' : '';
  let instruction;
  if (type === 'arrive') return 'Arrive at your destination';
  if (['roundabout', 'rotary', 'roundabout turn', 'exit roundabout', 'exit rotary'].includes(type)) {
    instruction = exit ? 'Take exit ' + exit + ' at the roundabout' :
      type.startsWith('exit') ? 'Exit the roundabout' : 'Enter the roundabout';
  } else if (modifier === 'uturn') {
    instruction = 'Make a U-turn';
  } else if (type === 'off ramp' || exitSign) {
    instruction = (exitSign ? 'Take exit ' + exitSign : 'Take the exit') + (direction ? ' on the ' + direction : '');
  } else if (type === 'on ramp') {
    instruction = direction ? 'Take the ramp on the ' + direction : 'Take the ramp';
  } else if (type === 'fork' && previousRoad && (
    step.ref && previousRoad.ref ? step.ref === previousRoad.ref :
    step.name && step.name === previousRoad.name
  )) {
    return direction ? 'Keep ' + direction + ' to stay on ' + road : 'Stay on ' + road;
  } else if (type === 'fork' || type === 'merge') {
    instruction = (type === 'fork' ? 'Keep' : 'Merge') + (direction ? ' ' + direction : ' ahead');
  } else if (type === 'end of road' && direction) {
    instruction = 'Turn ' + direction + ' at the end of the road';
  } else if (['turn', 'continue'].includes(type) && direction) {
    instruction = modifier.startsWith('slight') ? 'Bear ' + direction :
      modifier.startsWith('sharp') ? 'Turn sharply ' + direction : 'Turn ' + direction;
  } else {
    instruction = 'Continue';
  }
  return [instruction + (road ? ' onto ' + road : ''), step.destinations ? 'Toward ' + step.destinations.replace(/;/g, ' / ') : ''].filter(Boolean).join(' · ');
}

function maneuverSymbol({type, modifier}) {
  if (type === 'arrive') return '⚑';
  if (['roundabout', 'rotary', 'roundabout turn', 'exit roundabout', 'exit rotary'].includes(type)) return '⟳';
  if (modifier === 'uturn') return '↶';
  const angled = modifier?.startsWith('slight') || ['fork', 'merge', 'on ramp', 'off ramp'].includes(type);
  if (modifier?.includes('left')) return angled ? '↖' : '↰';
  if (modifier?.includes('right')) return angled ? '↗' : '↱';
  return '↑';
}

function buildRouteManeuvers(route) {
  let distance = 0;
  const maneuvers = [];
  routeRoads = [];
  let previousRoad;
  const legs = route.legs || [];
  for (const [index, leg] of legs.entries()) {
    for (const step of leg.steps || []) {
      const type = step.maneuver?.type;
      if (step.distance > 0) {
        const road = routeRoadLabel(step);
        if (routeRoads.at(-1)?.road !== road) routeRoads.push({at: distance, road});
      }
      if (type && !(type === 'arrive' && index < legs.length - 1) && !['depart', 'notification', 'new name'].includes(type)) {
        maneuvers.push({speech:{type,exit:step.exits?.replace(/;/g,' / '),roundaboutExit:step.maneuver.exit,road:routeRoadLabel(step)},at: distance, instruction: maneuverInstruction(step, previousRoad), symbol: maneuverSymbol(step.maneuver), direction: step.maneuver.modifier?.includes('left') ? 'left' : step.maneuver.modifier?.includes('right') ? 'right' : null});
      }
      if (step.distance > 0) previousRoad = step;
      distance += Number.isFinite(step.distance) ? step.distance : 0;
    }
  }
  return maneuvers;
}

function updateRouteGuidance() {
  const banner = $('focus-guidance');
  if (!banner) return;
  const live = !isDemo && watch !== null && !!gpsTime && Date.now()-gpsTime <= 15000 &&
    !guidanceOffRoute && !routeBusy && coords.length;
  const upcoming = live ? routeManeuvers.find(step => step.at >= progress - 12) : null;
  const remaining = upcoming ? Math.max(0, upcoming.at-progress) : Infinity;
  const cue = live ? navigationCue(upcoming, remaining) : '';
  if (cue) announceNavigationCue(cue, upcoming, remaining);
  banner.dataset.cue = cue;
  if (!document.body.classList.contains('driving')) return;

  $('focus-route-action').hidden = watch !== null;
  $('focus-route-action').textContent = dest && !isDemo ? 'Start '+vehicleLabel($('route-vehicle').value)+' trip' : 'Choose destination';
  $('focus-route-retry').hidden = $('retry-route').hidden || watch === null;
  let instruction = 'Choose a destination to start navigation';
  let distance = '';
  let symbol = '';
  let currentRoad = '';
  if (isDemo) instruction = 'Demo map · Start a live trip for turn guidance';
  else if(watch===null&&coords.length&&document.body.classList.contains('navigation-redesign')) instruction='Saved route · Start to resume GPS guidance';
  else if (watch !== null) {
    if (!$('retry-route').hidden) instruction = 'Route unavailable · Retry route';
    else if (!gpsTime || !lastPos || Date.now() - gpsTime > 25000) instruction = 'Waiting for a fresh GPS fix';
    else if (guidanceOffRoute || routeBusy || !coords.length) instruction = 'Updating your route…';
    else if (progress >= routeLength) instruction = 'Near your destination';
    else {
      for (const segment of routeRoads) {
        if (segment.at > progress) break;
        currentRoad = segment.road;
      }
      const next = routeManeuvers.find(step => step.at >= progress - 12);
      instruction = next?.instruction || 'Follow the highlighted route';
      if (next) {
        symbol = next.symbol;
        const remaining = Math.max(0, next.at - progress);
        distance = remaining < 200
          ? usesMiles(currentCountry) ? integer(remaining * 3.28084) + ' ft' : integer(remaining) + ' m'
          : fa(roadDistance(remaining)) + ' ' + distanceUnit();
      }
    }
  } else if (tripEndState) {
    instruction = tripEndState;
    if (tripEndState.startsWith('Arrived')) {symbol='⚑';banner.dataset.cue='arrive';}
  } else if (dest) instruction = 'Start the live trip for turn guidance';

  const label = $('focus-guidance-instruction');
  if (label.textContent !== instruction) label.textContent = instruction;
  $('focus-guidance-distance').textContent = distance;
  const road = $('focus-current-road');
  road.textContent = currentRoadLabelText(currentRoad);
  road.hidden = !currentRoad;
  const icon = $('focus-guidance-symbol');
  icon.textContent = symbol;
  icon.hidden = !symbol;
}

// Road aliases/route references get a dedicated second line in the fixed slot.
function currentRoadLabelText(road){return road?'On '+String(road).replace(/\s*[;·]\s*/, '\n'):'';}
