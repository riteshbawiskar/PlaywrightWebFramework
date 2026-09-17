import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page } from '@playwright/test';
import { GoogleSearchPage } from '../pages/GoogleSearchPage';

export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  googleSearchPage!: GoogleSearchPage;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(CustomWorld);
