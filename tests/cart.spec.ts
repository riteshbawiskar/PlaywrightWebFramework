import { test, expect } from '../src/fixtures/pageFixtures';

test.describe('Cart', () => {
  test('Added product appears in the cart', async ({ loggedInDashboard, cartPage }) => {
    await loggedInDashboard.addProductToCart('ZARA COAT 3');
    await loggedInDashboard.openCart();
    expect(await cartPage.getCartItemNames()).toContain('ZARA COAT 3');
  });

  test('User can proceed to checkout from the cart', async ({ loggedInDashboard, cartPage, checkoutPage }) => {
    await loggedInDashboard.addProductToCart('ADIDAS ORIGINAL');
    await loggedInDashboard.openCart();
    await cartPage.proceedToCheckout();
    expect(await checkoutPage.isLoaded()).toBe(true);
  });
});
