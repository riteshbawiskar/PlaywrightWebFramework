import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { addProductAndOpenCheckout } from '../flows/shoppingFlows';

Given('the user is on the checkout page with {string} in the cart', async function (this: CustomWorld, productName: string) {
  await addProductAndOpenCheckout(this.dashboardPage, this.cartPage, this.checkoutPage, productName);
});

When('the user types {string} in the country field', async function (this: CustomWorld, text: string) {
  await this.checkoutPage.typeCountry(text);
});

When('the user selects the country {string}', async function (this: CustomWorld, country: string) {
  await this.checkoutPage.selectCountry(country);
});

When('the user places the order', async function (this: CustomWorld) {
  await this.checkoutPage.placeOrder();
});

Then('the country suggestions should include {string}', async function (this: CustomWorld, country: string) {
  const suggestions = await this.checkoutPage.getCountrySuggestions();
  expect(suggestions, `Country suggestions did not include '${country}'`).toContain(country);
});

Then('the order confirmation should contain {string}', async function (this: CustomWorld, expectedText: string) {
  const message = await this.checkoutPage.getConfirmationMessage();
  expect(message.toLowerCase(), 'Order confirmation text did not match').toContain(expectedText.toLowerCase());
});
