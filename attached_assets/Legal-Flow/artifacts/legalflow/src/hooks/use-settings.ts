import { useCallback, useEffect, useState } from 'react';
import { getSettings, saveSettings } from '@/lib/storage';
import type { AppSettings } from '@/types';

export interface UseSettingsReturn {
  settings: AppSettings;
  updateSettings: (settings: AppSettings) => void;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<AppSettings>(getSettings);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const updateSettings = useCallback((next: AppSettings) => {
    saveSettings(next);
    setSettings(next);
  }, []);

  return { settings, updateSettings };
}
