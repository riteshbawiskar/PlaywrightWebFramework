import { test, expect } from '../src/fixtures/pageFixtures';
import { products } from '../src/data/testData';
import { addProductAndOpenCheckout } from '../src/flows/shoppingFlows';

test.describe('Cart', () => {
  test('Added product appears in the cart', async ({ loggedInDashboard, cartPage }) => {
    await loggedInDashboard.addProductToCart(products.zaraCoat);
    await loggedInDashboard.openCart();
    expect(await cartPage.getCartItemNames()).toContain(products.zaraCoat);
  });

  test('User can proceed to checkout from the cart', async ({ loggedInDashboard, cartPage, checkoutPage }) => {
    await addProductAndOpenCheckout(loggedInDashboard, cartPage, checkoutPage, products.adidasOriginal);
  });
});
