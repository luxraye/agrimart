// District centroid coordinates — used for all Open-Meteo / MODIS lookups.
// Political geography: static by design.

export const DISTRICT_COORDS = {
  gaborone:  { lat: -24.6282, lng: 25.9231, label: "Gaborone / South East" },
  kweneng:   { lat: -24.4000, lng: 25.5000, label: "Kweneng" },
  central:   { lat: -22.5000, lng: 26.8000, label: "Central" },
  kgalagadi: { lat: -25.0000, lng: 21.5000, label: "Kgalagadi" },
  ngamiland: { lat: -19.9833, lng: 22.9000, label: "Ngamiland / North West" },
  chobe:     { lat: -17.8500, lng: 25.1500, label: "Chobe" },
  northeast: { lat: -21.1667, lng: 27.5167, label: "North East" },
  southern:  { lat: -24.9667, lng: 25.3333, label: "Southern" },
};

export const DISTRICT_KEYS = Object.keys(DISTRICT_COORDS);
