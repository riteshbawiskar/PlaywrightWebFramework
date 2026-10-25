import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { getConfig, getCredentials } from '../utils/configReader';

type PageFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  loggedInDashboard: DashboardPage;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  loggedInDashboard: async ({ page }, use) => {
    const { email, password } = getCredentials();
    const loginPage = new LoginPage(page);
    await loginPage.open(getConfig().baseUrl);
    await loginPage.login(email, password);
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },
});

export { expect };
