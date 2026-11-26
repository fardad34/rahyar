'use strict';
// Canonical data lives once in JSON. Loading is shared, demand-driven and retryable.
(() => {
  let pending = null;
  window.loadFacilityCatalog = () => {
    if (window.RAHYAR_FACILITY_CATALOG) return Promise.resolve(window.RAHYAR_FACILITY_CATALOG);
    if (!pending)
      pending = fetch('facility-catalog.json?v=15')
        .then((r) => {
          if (!r.ok) throw Error('Facility inventory unavailable');
          return r.json();
        })
        .then((data) => {
          if (!Array.isArray(data.facilities)) throw Error('Invalid facility inventory');
          window.RAHYAR_FACILITY_CATALOG = data;
          return data;
        })
        .catch((error) => {
          pending = null;
          throw error;
        });
    return pending;
  };
})();
