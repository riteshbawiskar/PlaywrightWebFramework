import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  private readonly cartItemNames = '.cartSection h3';
  async getCartItemNames(): Promise<string[]> {
    await this.page.locator(this.cartItemNames).first().waitFor({ state: 'visible' });
    const names = await this.page.locator(this.cartItemNames).allTextContents();
    return names.map((name) => name.trim());
  }

  async proceedToCheckout(): Promise<void> {
    // The Checkout button only appears once the cart has loaded. Wait for an item
    // first, so a slow cart load on CI does not burn the button's timeout.
    await this.page.locator(this.cartItemNames).first().waitFor({ state: 'visible' });
    const checkoutButton = this.page.getByRole('button', { name: 'Checkout' });
    await checkoutButton.waitFor({ state: 'visible' });
    await checkoutButton.click();
    await this.page.waitForURL(/dashboard\/order/);
  }
}
