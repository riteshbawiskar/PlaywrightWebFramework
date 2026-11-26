import 'dotenv/config';
import config from '../../config/config.json';

export interface FrameworkConfig {
  baseUrl: string;
  apiBaseUrl: string;
  browser: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  actionTimeoutMs: number;
  navigationTimeoutMs: number;
  retries: number;
}

export interface Credentials {
  email: string;
  password: string;
}

// HEADLESS=true|false in the environment overrides config.json.
// CI sets HEADLESS=true because runners have no screen.
export function getConfig(): FrameworkConfig {
  const headlessEnv = process.env.HEADLESS;
  const headless =
    headlessEnv === undefined ? config.headless : headlessEnv.toLowerCase() === 'true';
  return { ...(config as FrameworkConfig), headless };
}

// Credentials are read from environment variables so they are never committed.
// Set TEST_USER_EMAIL and TEST_USER_PASSWORD before running the tests.
export function getCredentials(): Credentials {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  if (!email || !password) {
    throw new Error('Set TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables before running the tests.');
  }
  return { email, password };
}
