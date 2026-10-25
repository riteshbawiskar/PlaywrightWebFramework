import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

When('the user opens the cart', async function (this: CustomWorld) {
  await this.dashboardPage.openCart();
});

When('the user proceeds to checkout', async function (this: CustomWorld) {
  await this.cartPage.proceedToCheckout();
});

Then('the cart should contain {string}', async function (this: CustomWorld, productName: string) {
  const items = await this.cartPage.getCartItemNames();
  expect(items, `Cart does not contain '${productName}'`).toContain(productName);
});

Then('the checkout page should be displayed', async function (this: CustomWorld) {
  expect(await this.checkoutPage.isLoaded(), 'Checkout page is not displayed').toBe(true);
});
