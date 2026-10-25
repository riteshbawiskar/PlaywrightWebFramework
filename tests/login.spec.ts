import { test, expect } from '../src/fixtures/pageFixtures';
import { getConfig, getCredentials } from '../src/utils/configReader';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open(getConfig().baseUrl);
  });

  test('Login page shows the email and password fields', async ({ loginPage }) => {
    expect(await loginPage.isEmailFieldVisible()).toBe(true);
    expect(await loginPage.isPasswordFieldVisible()).toBe(true);
  });

  test('Successful login with valid credentials', async ({ loginPage, dashboardPage }) => {
    const { email, password } = getCredentials();
    await loginPage.login(email, password);
    expect(await dashboardPage.isLoaded()).toBe(true);
  });

  test('Login fails with invalid credentials', async ({ loginPage }) => {
    await loginPage.login('invalid.user@example.com', 'WrongPass@123');
    await loginPage.waitForToast('Incorrect email or password.');
  });
});
