import config from '../../config/config.json';

export interface FrameworkConfig {
  baseUrl: string;
  browser: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  actionTimeoutMs: number;
  navigationTimeoutMs: number;
  retries: number;
}

export function getConfig(): FrameworkConfig {
  return config as FrameworkConfig;
}
