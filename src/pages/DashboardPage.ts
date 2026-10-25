import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  private readonly productCards = '.card';
  private readonly productNames = '.card-body b';
  private readonly cartButton = 'button[routerlink*="cart"]';

  async isLoaded(): Promise<boolean> {
    await this.page.waitForURL(/dashboard/);
    try {
      await this.page.locator(this.productNames).first().waitFor({ state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  async getProductNames(): Promise<string[]> {
    await this.page.locator(this.productNames).first().waitFor({ state: 'visible' });
    const names = await this.page.locator(this.productNames).allTextContents();
    return names.map((name) => name.trim());
  }

  async addProductToCart(productName: string): Promise<void> {
    const card = this.page.locator(this.productCards).filter({ hasText: productName }).first();
    await card.waitFor({ state: 'visible' });
    // The "Add To Cart" button is the last button inside the product card.
    await card.locator('button').last().click();
  }

  async openCart(): Promise<void> {
    await this.page.locator(this.cartButton).click();
    await this.page.waitForURL(/cart/);
  }
}
