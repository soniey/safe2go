export const DATA_CHANGED = 'roadguard:data-changed';

export function notifyDataChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(DATA_CHANGED));
}
