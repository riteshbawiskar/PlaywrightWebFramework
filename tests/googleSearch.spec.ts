import { test, expect } from '@playwright/test';
import { GoogleSearchPage } from '../src/pages/GoogleSearchPage';
import { getConfig } from '../src/utils/configReader';

const config = getConfig();

test.describe('Google Search', () => {
  let searchPage: GoogleSearchPage;

  test.beforeEach(async ({ page }) => {
    searchPage = new GoogleSearchPage(page);
    await searchPage.open(config.baseUrl);
  });

  test('Verify Google home page title', async () => {
    const title = await searchPage.getPageTitle();
    expect(title).toContain('Google');
  });

  test('Search for a term on Google', async () => {
    await searchPage.search('Selenium WebDriver');
    const value = await searchPage.getSearchBoxValue();
    expect(value).not.toBe('');
  });

  test('Search box is empty on a fresh page load', async () => {
    const value = await searchPage.getSearchBoxValue();
    expect(value).toBe('');
  });

  test('Search box retains the exact typed query', async () => {
    await searchPage.search('Playwright TypeScript testing');
    const value = await searchPage.getSearchBoxValue();
    expect(value).toBe('Playwright TypeScript testing');
  });

  test('Page title does not change while typing', async () => {
    const titleBefore = await searchPage.getPageTitle();
    await searchPage.search('Cucumber BDD framework');
    const titleAfter = await searchPage.getPageTitle();
    expect(titleAfter).toBe(titleBefore);
  });

  test('Search box accepts special characters', async () => {
    await searchPage.search('Playwright @test annotation!');
    const value = await searchPage.getSearchBoxValue();
    expect(value).toBe('Playwright @test annotation!');
  });

  test('Search box accepts numeric input', async () => {
    await searchPage.search('Playwright 1 63 0');
    const value = await searchPage.getSearchBoxValue();
    expect(value).toBe('Playwright 1 63 0');
  });

  test('Search box overwrites the previous query', async () => {
    await searchPage.search('first query');
    await searchPage.search('second query');
    const value = await searchPage.getSearchBoxValue();
    expect(value).toBe('second query');
  });

  test('Home page title is not empty', async () => {
    const title = await searchPage.getPageTitle();
    expect(title).not.toBe('');
  });

  test('DEMO FAILURE: search box rejects an unexpected value', async () => {
    await searchPage.search('Selenium WebDriver');
    const value = await searchPage.getSearchBoxValue();
    expect(value, 'Demonstration failure: search box value does not equal the hardcoded expectation')
      .toBe('this value will never match');
  });

  test('DEMO FAILURE: home page title is exactly Google', async () => {
    const title = await searchPage.getPageTitle();
    expect(title, 'Demonstration failure: home page title does not equal the hardcoded expectation')
      .toBe('this title will never match');
  });
});
