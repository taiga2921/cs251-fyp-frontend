import { useEffect, useState } from 'react';

const AUTH_USER_KEY = 'auth_user';

function readStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Minimal auth hook (user payload from login); extend later with JWT/API sync. */
export function useAuthController() {
  const [currentUser, setCurrentUser] = useState(() => readStoredUser());

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === AUTH_USER_KEY || event.key === null) {
        setCurrentUser(readStoredUser());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { currentUser };
}
