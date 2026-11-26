import 'dotenv/config';
import config from '../../config/config.json';
import testUsers from '../test-data/users.json';

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

// Returns the test account for the current parallel worker.
// Cucumber sets CUCUMBER_WORKER_ID (0, 1, 2, ...) for each worker. A serial run has no
// worker id, so it uses account 0. Each worker has its own account, so carts and orders
// never collide between workers. Accounts are listed in src/test-data/users.json.
// The password is shared by all accounts and comes from TEST_USER_PASSWORD (never committed).
export function getCredentials(): Credentials {
  const password = process.env.TEST_USER_PASSWORD;
  if (!password) {
    throw new Error('Set TEST_USER_PASSWORD in .env (locally) or as a CI secret before running the tests.');
  }

  const accounts = testUsers.users;
  const workerId = Number(process.env.CUCUMBER_WORKER_ID ?? 0);
  const totalWorkers = Number(process.env.CUCUMBER_TOTAL_WORKERS ?? 1);
  if (totalWorkers > accounts.length) {
    throw new Error(
      `The run uses ${totalWorkers} workers but src/test-data/users.json has ${accounts.length} accounts. ` +
        'Add accounts or set PARALLEL to a smaller number.',
    );
  }
  return { email: accounts[workerId].email, password };
}
