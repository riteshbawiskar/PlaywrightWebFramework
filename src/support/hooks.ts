import { Before, After, Status } from '@cucumber/cucumber';
import { chromium, firefox, webkit } from '@playwright/test';
import { CustomWorld } from './world';
import { GoogleSearchPage } from '../pages/GoogleSearchPage';
import { getConfig } from '../utils/configReader';

const browserLaunchers = { chromium, firefox, webkit };

Before(async function (this: CustomWorld) {
  const config = getConfig();
  const launcher = browserLaunchers[config.browser];
  this.browser = await launcher.launch({ headless: config.headless });
  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();
  this.page.setDefaultTimeout(config.actionTimeoutMs);
  this.page.setDefaultNavigationTimeout(config.navigationTimeoutMs);
  this.googleSearchPage = new GoogleSearchPage(this.page);
});

After(async function (this: CustomWorld, scenario) {
  if (scenario.result?.status === Status.FAILED) {
    const screenshot = await this.page.screenshot();
    this.attach(screenshot, 'image/png');
  }
  await this.context?.close();
  await this.browser?.close();
});
