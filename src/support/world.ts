import { setWorldConstructor, setDefaultTimeout, World, IWorldOptions } from '@cucumber/cucumber';
import { APIRequestContext, APIResponse, Browser, BrowserContext, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  loginPage!: LoginPage;
  dashboardPage!: DashboardPage;
  cartPage!: CartPage;
  checkoutPage!: CheckoutPage;

  // API scenarios: a request context per scenario, plus the last response and token.
  apiContext?: APIRequestContext;
  apiResponse?: APIResponse;
  apiToken?: string;

  constructor(options: IWorldOptions) {
    super(options);
  }

  initPages(): void {
    this.loginPage = new LoginPage(this.page);
    this.dashboardPage = new DashboardPage(this.page);
    this.cartPage = new CartPage(this.page);
    this.checkoutPage = new CheckoutPage(this.page);
  }
}

setWorldConstructor(CustomWorld);

// Browser steps can take longer than Cucumber's default 5 second limit.
setDefaultTimeout(60 * 1000);
