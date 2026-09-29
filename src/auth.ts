/*
  DUMMY AUTH — client-side only, for the prototype.
  The credentials below ship inside the JS bundle, so this only keeps casual
  visitors out; it is NOT real security. The module apps are also still
  reachable directly by their own URLs.
  TODO(backend): replace with a real auth provider (server-verified session or
  token) and protect each module app behind the same login.
*/
export const OWNER_NAME = 'Malik';

const OWNER_USERNAME = 'malik';
const OWNER_PASSWORD = 'powerant2026';

const SESSION_KEY = 'powerant-portal-session';

export function checkCredentials(username: string, password: string): boolean {
  return username.trim().toLowerCase() === OWNER_USERNAME && password === OWNER_PASSWORD;
}

// sessionStorage: stays signed in across refreshes, signs out when the tab closes.
// Wrapped in try/catch because storage can be blocked (private mode, strict settings).
export function hasSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function startSession(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // Storage unavailable — user stays signed in until refresh.
  }
}

export function endSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing to clear.
  }
}
