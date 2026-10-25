import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

When('the user adds {string} to the cart', async function (this: CustomWorld, productName: string) {
  await this.dashboardPage.addProductToCart(productName);
});

Then('at least one product should be listed', async function (this: CustomWorld) {
  const products = await this.dashboardPage.getProductNames();
  expect(products.length, 'No products were listed on the dashboard').toBeGreaterThan(0);
});
