const STORAGE_KEY = 'safe2go.mapFilters.v1';

export function loadMapFilters(hazardTypes, riskLevels, storage) {
  try {
    const saved = JSON.parse((storage ?? window.localStorage).getItem(STORAGE_KEY));
    return {
      hazardType: hazardTypes.includes(saved?.hazardType) ? saved.hazardType : 'ALL',
      riskLevel: riskLevels.includes(saved?.riskLevel) ? saved.riskLevel : 'ALL',
    };
  } catch {
    return { hazardType: 'ALL', riskLevel: 'ALL' };
  }
}

export function saveMapFilters(filters, storage) {
  try {
    (storage ?? window.localStorage).setItem(STORAGE_KEY, JSON.stringify(filters));
    return true;
  } catch {
    // Browsers may block persistence; the map still works for this session.
    return false;
  }
}
