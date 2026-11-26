import { expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

// Shared user journey: add one product, open the cart, and go to checkout.
// Used by the checkout tests, the cart tests, and the Cucumber steps, so a
// change to this journey is made in one place.
export async function addProductAndOpenCheckout(
  dashboard: DashboardPage,
  cart: CartPage,
  checkout: CheckoutPage,
  productName: string,
): Promise<void> {
  await dashboard.addProductToCart(productName);
  await dashboard.openCart();
  await cart.proceedToCheckout();
  expect(await checkout.isLoaded(), 'Checkout page did not load').toBe(true);
}
