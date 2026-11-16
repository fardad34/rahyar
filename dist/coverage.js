'use strict';

const supportedGeocodingCountries = Object.freeze({
  CA: 'CAN',
  US: 'USA',
  VA: 'VAT',
  JE: 'JEY',
  GG: 'GGY',
  IM: 'IMN',
  GB: 'GBR',
  UA: 'UKR',
  CH: 'CHE',
  SE: 'SWE',
  ES: 'ESP',
  SK: 'SVK',
  SI: 'SVN',
  RS: 'SRB',
  SM: 'SMR',
  RO: 'ROU',
  PT: 'PRT',
  PL: 'POL',
  NO: 'NOR',
  NL: 'NLD',
  ME: 'MNE',
  MD: 'MDA',
  MC: 'MCO',
  MT: 'MLT',
  MK: 'MKD',
  LU: 'LUX',
  LT: 'LTU',
  LI: 'LIE',
  LV: 'LVA',
  XK: 'XKX',
  IT: 'ITA',
  IE: 'IRL',
  IS: 'ISL',
  HU: 'HUN',
  GR: 'GRC',
  DE: 'DEU',
  FR: 'FRA',
  AX: 'ALA',
  FI: 'FIN',
  EE: 'EST',
  FO: 'FRO',
  DK: 'DNK',
  CZ: 'CZE',
  CY: 'CYP',
  HR: 'HRV',
  BG: 'BGR',
  BA: 'BIH',
  BE: 'BEL',
  BY: 'BLR',
  AT: 'AUT',
  AD: 'AND',
  AL: 'ALB',
});
const countryNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], {type:'region'}) : null;

function supportsCountry(code) {
  return Object.hasOwn(supportedGeocodingCountries, code);
}

function countryName(code) {
  return supportsCountry(code) ? (countryNames?.of(code) || code) : '';
}

function usesMiles(country) {
  return country === 'US' || country === 'GB';
}
