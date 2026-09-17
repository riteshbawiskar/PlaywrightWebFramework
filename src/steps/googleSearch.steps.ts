import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { getConfig } from '../utils/configReader';

Given('the user navigates to the Google home page', async function (this: CustomWorld) {
  await this.googleSearchPage.open(getConfig().baseUrl);
});

When('the user searches for {string}', async function (this: CustomWorld, searchTerm: string) {
  await this.googleSearchPage.search(searchTerm);
});

Then('the page title should contain {string}', async function (this: CustomWorld, expectedTitle: string) {
  const title = await this.googleSearchPage.getPageTitle();
  expect(title, `Page title did not contain '${expectedTitle}'`).toContain(expectedTitle);
});

Then('the search box should not be empty', async function (this: CustomWorld) {
  const value = await this.googleSearchPage.getSearchBoxValue();
  expect(value, 'Search box was empty').not.toBe('');
});

Then('the search box should be empty', async function (this: CustomWorld) {
  const value = await this.googleSearchPage.getSearchBoxValue();
  expect(value, 'Search box should be empty before any search is performed').toBe('');
});

Then('the search box value should equal {string}', async function (this: CustomWorld, expectedValue: string) {
  const value = await this.googleSearchPage.getSearchBoxValue();
  expect(value, 'Search box value did not equal the expected value').toBe(expectedValue);
});

Then('the page title should still contain {string}', async function (this: CustomWorld, expectedTitle: string) {
  const title = await this.googleSearchPage.getPageTitle();
  expect(title, 'Page title should remain unchanged while typing in the search box').toContain(expectedTitle);
});

Then('the page title should equal {string}', async function (this: CustomWorld, expectedTitle: string) {
  const title = await this.googleSearchPage.getPageTitle();
  expect(title, 'Page title did not equal the expected value').toBe(expectedTitle);
});

Then('the page title should not be empty', async function (this: CustomWorld) {
  const title = await this.googleSearchPage.getPageTitle();
  expect(title, 'Home page title should not be empty').not.toBe('');
});
