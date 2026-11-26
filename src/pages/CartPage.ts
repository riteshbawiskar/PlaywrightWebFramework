import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  private readonly cartItemNames = '.cartSection h3';
  async getCartItemNames(): Promise<string[]> {
    await this.page.locator(this.cartItemNames).first().waitFor({ state: 'visible' });
    const names = await this.page.locator(this.cartItemNames).allTextContents();
    return names.map((name) => name.trim());
  }

  async proceedToCheckout(): Promise<void> {
    const checkoutButton = this.page.getByRole('button', { name: 'Checkout' });
    await checkoutButton.waitFor({ state: 'visible' });
    await checkoutButton.click();
    await this.page.waitForURL(/dashboard\/order/);
  }
}
