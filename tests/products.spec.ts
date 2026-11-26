import { test, expect } from '../src/fixtures/pageFixtures';
import { messages, products } from '../src/data/testData';

test.describe('Products', () => {
  test('Dashboard lists products after login', async ({ loggedInDashboard }) => {
    expect(await loggedInDashboard.isLoaded()).toBe(true);
    expect((await loggedInDashboard.getProductNames()).length).toBeGreaterThan(0);
  });

  test('Adding a product shows a success message', async ({ loggedInDashboard, loginPage }) => {
    await loggedInDashboard.addProductToCart(products.zaraCoat);
    await loginPage.waitForToast(messages.productAddedToCart);
  });
});
