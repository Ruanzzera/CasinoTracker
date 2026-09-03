import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'privacy-mode';
const EVENT = 'privacy-mode-change';

export const PRIVACY_MASK = 'R$ ••••';

function read(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function usePrivacy() {
  const [hidden, setHidden] = useState<boolean>(read);

  useEffect(() => {
    const handler = () => setHidden(read());
    window.addEventListener(EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const toggle = useCallback(() => {
    const next = !read();
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const maskValue = useCallback(
    (formatted: string) => (hidden ? PRIVACY_MASK : formatted),
    [hidden]
  );

  return { hidden, toggle, maskValue };
}
