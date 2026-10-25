import 'dotenv/config';
import config from '../../config/config.json';

export interface FrameworkConfig {
  baseUrl: string;
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

export function getConfig(): FrameworkConfig {
  return config as FrameworkConfig;
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
