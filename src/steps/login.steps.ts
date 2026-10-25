import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { getConfig, getCredentials } from '../utils/configReader';

Given('the user is on the login page', async function (this: CustomWorld) {
  await this.loginPage.open(getConfig().baseUrl);
});

Given('the user is logged in', async function (this: CustomWorld) {
  const { email, password } = getCredentials();
  await this.loginPage.open(getConfig().baseUrl);
  await this.loginPage.login(email, password);
  expect(await this.dashboardPage.isLoaded(), 'Dashboard did not load after login').toBe(true);
});

When('the user logs in with valid credentials', async function (this: CustomWorld) {
  const { email, password } = getCredentials();
  await this.loginPage.login(email, password);
});

When('the user logs in with email {string} and password {string}', async function (this: CustomWorld, email: string, password: string) {
  await this.loginPage.login(email, password);
});

Then('the user should be on the dashboard', async function (this: CustomWorld) {
  expect(await this.dashboardPage.isLoaded(), 'User is not on the dashboard').toBe(true);
});

Then('the email field should be visible', async function (this: CustomWorld) {
  expect(await this.loginPage.isEmailFieldVisible(), 'Email field is not visible').toBe(true);
});

Then('the password field should be visible', async function (this: CustomWorld) {
  expect(await this.loginPage.isPasswordFieldVisible(), 'Password field is not visible').toBe(true);
});
