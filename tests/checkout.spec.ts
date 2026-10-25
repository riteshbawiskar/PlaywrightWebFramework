import { test, expect } from '../src/fixtures/pageFixtures';

test.describe('Checkout', () => {
  test.beforeEach(async ({ loggedInDashboard, cartPage, checkoutPage }) => {
    await loggedInDashboard.addProductToCart('ZARA COAT 3');
    await loggedInDashboard.openCart();
    await cartPage.proceedToCheckout();
    expect(await checkoutPage.isLoaded()).toBe(true);
  });

  test('Country field suggests matching countries', async ({ checkoutPage }) => {
    await checkoutPage.typeCountry('ind');
    expect(await checkoutPage.getCountrySuggestions()).toContain('India');
  });

  test('User places an order', async ({ checkoutPage }) => {
    await checkoutPage.selectCountry('India');
    await checkoutPage.placeOrder();
    expect((await checkoutPage.getConfirmationMessage()).toLowerCase())
      .toContain('thankyou for the order.');
  });
});
