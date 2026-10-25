import { test, expect } from '../src/fixtures/pageFixtures';

test.describe('Products', () => {
  test('Dashboard lists products after login', async ({ loggedInDashboard }) => {
    expect(await loggedInDashboard.isLoaded()).toBe(true);
    expect((await loggedInDashboard.getProductNames()).length).toBeGreaterThan(0);
  });

  test('Adding a product shows a success message', async ({ loggedInDashboard, loginPage }) => {
    await loggedInDashboard.addProductToCart('ZARA COAT 3');
    await loginPage.waitForToast('Product Added To Cart');
  });
});
