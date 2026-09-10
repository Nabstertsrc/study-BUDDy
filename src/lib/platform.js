/** True when running inside Electron or Capacitor native shell (not a normal browser tab). */
export function isNativeShell() {
  if (typeof window === 'undefined') return false;
  if (window.electron) return true;
  try {
    if (window.Capacitor?.isNativePlatform?.()) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export const EULA_STORAGE_KEY = 'eula_accepted_v1';

export function hasAcceptedEula() {
  try {
    return localStorage.getItem(EULA_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function acceptEula() {
  localStorage.setItem(EULA_STORAGE_KEY, 'true');
}
