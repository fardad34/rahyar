'use strict';

function cityBoundaryRings(relation) {
  const paths = (relation.members || []).filter(member =>
    member.type === 'way' && ['outer', 'inner', ''].includes(member.role || '') &&
    member.geometry?.length > 1 && member.geometry.every(point => Number.isFinite(point?.lon) && Number.isFinite(point?.lat))
  ).map(member => member.geometry.map(point => [point.lon, point.lat]));
  const rings = [];
  const equal = (a, b) => a[0] === b[0] && a[1] === b[1];
  while (paths.length) {
    const path = paths.pop();
    while (!equal(path[0], path.at(-1))) {
      const last = path.at(-1);
      const i = paths.findIndex(part => equal(last, part[0]) || equal(last, part.at(-1)));
      if (i < 0) return [];
      const [part] = paths.splice(i, 1);
      if (!equal(last, part[0])) part.reverse();
      for (let j = 1; j < part.length; j++) path.push(part[j]);
    }
    if (path.length > 3) rings.push(path);
  }
  return rings;
}

function cityBoundaryContains(rings, [x, y]) {
  let inside = false;
  for (const ring of rings) {
    for (let i = 1; i < ring.length; i++) {
      const [ax, ay] = ring[i - 1], [bx, by] = ring[i];
      if ((ay > y) !== (by > y) && x < ax + (bx - ax) * (y - ay) / (by - ay)) inside = !inside;
    }
  }
  return inside;
}

function routeCitySamples(line) {
  const samples = [line[0]];
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i], count = Math.ceil(hav(a, b) / 300);
    for (let j = 1; j <= count; j++) {
      const fraction = j / count;
      samples.push([a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction]);
    }
  }
  return samples;
}

function cityBoundaryMatch(city, relations, samples, locate) {
  let hasBoundary = false;
  let best = null;
  for (const relation of relations) {
    if (!cityBoundaryContains(relation.rings, city.coord)) continue;
    hasBoundary = true;
    const [minX, minY, maxX, maxY] = relation.bounds;
    for (const point of samples) {
      if (point[0] < minX || point[0] > maxX || point[1] < minY || point[1] > maxY) continue;
      const distance = hav(city.coord, point);
      if ((!best || distance < best.distance) && cityBoundaryContains(relation.rings, point)) best = {point, distance};
    }
  }
  return {hasBoundary, hit: best ? locate(best.point) : null};
}

function indexCityBoundaries(elements, index) {
  for (const relation of elements) {
    if (relation.type !== 'relation') continue;
    const names = [...new Set([relation.tags?.name, relation.tags?.['name:en']]
      .filter(Boolean)
      .flatMap(name => [name, name.replace(/^(?:city|town|township|village|municipality) of /i, '')])
      .map(searchKey))];
    if (!names.length || !relation.bounds) continue;
    const rings = cityBoundaryRings(relation);
    if (!rings.length) continue;
    const {minlon, minlat, maxlon, maxlat} = relation.bounds;
    const entry = {id:relation.id,rings,bounds:[minlon,minlat,maxlon,maxlat]};
    for (const name of names) {
      if (!index.has(name)) index.set(name, []);
      const entries = index.get(name);
      if (!entries.some(item => item.id === entry.id)) entries.push(entry);
    }
  }
}

const municipalBoundaryCatalogs = new Map();

function loadMunicipalBoundaries(file) {
  if (!municipalBoundaryCatalogs.has(file)) {
    const pending = getJSON(file).then(data => {
      const index = new Map();
      for (const {geometry, properties} of data.features || []) {
        const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat();
        const bounds = [Infinity, Infinity, -Infinity, -Infinity];
        for (const ring of rings) for (const [x, y] of ring) {
          bounds[0] = Math.min(bounds[0], x);
          bounds[1] = Math.min(bounds[1], y);
          bounds[2] = Math.max(bounds[2], x);
          bounds[3] = Math.max(bounds[3], y);
        }
        const name = properties.name.replace(/^(?:(?:city|town|township|village|municipality|district) of )+/i, '');
        const key = searchKey(name);
        if (!index.has(key)) index.set(key, []);
        index.get(key).push({id: file + ':' + (properties.id || properties.name), rings, bounds});
      }
      return index;
    }).catch(error => {
      municipalBoundaryCatalogs.delete(file);
      throw error;
    });
    municipalBoundaryCatalogs.set(file, pending);
  }
  return municipalBoundaryCatalogs.get(file);
}
