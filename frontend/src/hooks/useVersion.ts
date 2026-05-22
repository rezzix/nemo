import { useState, useEffect } from 'react';
import { getPublicOrganization } from '@/api/organization';

let cachedVersion = '';
let cachedMode = 'prod';
let cachedCurrency = 'DH';

export function getCurrency(): string {
  return cachedCurrency;
}

export function useVersion(): { version: string; mode: string; currency: string } {
  const [version, setVersion] = useState(cachedVersion);
  const [mode, setMode] = useState(cachedMode);
  const [currency, setCurrency] = useState(cachedCurrency);

  useEffect(() => {
    if (cachedVersion) {
      setVersion(cachedVersion);
      setMode(cachedMode);
      setCurrency(cachedCurrency);
      return;
    }
    getPublicOrganization().then((res) => {
      if (res) {
        const v = res.version || '';
        const b = res.build || '';
        cachedVersion = v + (b ? `+${b}` : '');
        cachedMode = res.mode || 'prod';
        cachedCurrency = res.currency || 'DH';
        setVersion(cachedVersion);
        setMode(cachedMode);
        setCurrency(cachedCurrency);
      }
    });
  }, []);

  return { version, mode, currency };
}