import { Before, After, Status } from '@cucumber/cucumber';
import { chromium, firefox, webkit } from '@playwright/test';
import { CustomWorld } from './world';
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
  this.initPages();
});

After(async function (this: CustomWorld, scenario) {
  try {
    // this.page is undefined if Before failed, so check it first.
    if (scenario.result?.status === Status.FAILED && this.page) {
      const screenshot = await this.page.screenshot();
      await this.attach(screenshot, 'image/png');
    }
  } finally {
    // Always close, even if the screenshot failed, so browsers are not leaked.
    await this.context?.close();
    await this.browser?.close();
  }
});
