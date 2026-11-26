import { test, expect } from '../src/fixtures/pageFixtures';
import { checkout, messages, products } from '../src/data/testData';
import { addProductAndOpenCheckout } from '../src/flows/shoppingFlows';

test.describe('Checkout', () => {
  test.beforeEach(async ({ loggedInDashboard, cartPage, checkoutPage }) => {
    await addProductAndOpenCheckout(loggedInDashboard, cartPage, checkoutPage, products.zaraCoat);
  });

  test('Country field suggests matching countries', async ({ checkoutPage }) => {
    await checkoutPage.typeCountry(checkout.countryQuery);
    expect(await checkoutPage.getCountrySuggestions()).toContain(checkout.country);
  });

  test('User places an order', async ({ checkoutPage }) => {
    await checkoutPage.selectCountry(checkout.country);
    await checkoutPage.placeOrder();
    expect((await checkoutPage.getConfirmationMessage()).toLowerCase())
      .toContain(messages.orderConfirmation.toLowerCase());
  });
});
