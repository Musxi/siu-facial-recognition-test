import { useState, useEffect } from 'react';
import { AppConfig } from '../types';

const DEFAULT_CONFIG: AppConfig = {
  appName: "68344042-4",
  appVersion: "v2.0",
  logoText: "68",
  logoColor: "cyan",
  defaultLang: "zh"
};

export const useConfig = () => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/config.json')
      .then(res => {
        if (!res.ok) throw new Error("Failed to load config");
        return res.json();
      })
      .then(data => {
        setConfig(prev => ({ ...prev, ...data }));
        setLoaded(true);
        // Update document title dynamically
        document.title = data.appName || document.title;
      })
      .catch(err => {
        console.warn("Config load failed, using defaults", err);
        setLoaded(true);
      });
  }, []);

  return { config, loaded };
};