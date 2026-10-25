import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  private readonly cartItemNames = '.cartSection h3';
  private readonly checkoutButton = '.totalRow button';

  async getCartItemNames(): Promise<string[]> {
    await this.page.locator(this.cartItemNames).first().waitFor({ state: 'visible' });
    const names = await this.page.locator(this.cartItemNames).allTextContents();
    return names.map((name) => name.trim());
  }

  async proceedToCheckout(): Promise<void> {
    await this.page.locator(this.checkoutButton).waitFor({ state: 'visible' });
    await this.page.locator(this.checkoutButton).click();
    await this.page.waitForURL(/dashboard\/order/);
  }
}
