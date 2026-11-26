import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  private readonly productCards = '.card';
  private readonly productNames = '.card-body b';
  private readonly cartButton = 'button[routerlink*="cart"]';

  // Fails with a clear message (which element, which timeout) instead of returning false.
  async isLoaded(): Promise<boolean> {
    await this.page.waitForURL(/dashboard/);
    await expect(this.page.locator(this.productNames).first(), 'dashboard product list should be visible').toBeVisible();
    return true;
  }

  async getProductNames(): Promise<string[]> {
    await this.page.locator(this.productNames).first().waitFor({ state: 'visible' });
    const names = await this.page.locator(this.productNames).allTextContents();
    return names.map((name) => name.trim());
  }

  async addProductToCart(productName: string): Promise<void> {
    // Match the exact product name, so "ZARA COAT 3" never matches a longer product that contains it.
    const card = this.page
      .locator(this.productCards)
      .filter({ has: this.page.getByText(productName, { exact: true }) })
      .first();
    await card.waitFor({ state: 'visible' });
    // Not exact: the accessible name includes extra text (icon label) around "Add To Cart".
    await card.getByRole('button', { name: 'Add To Cart' }).click();
    // Confirm the add actually happened, so a test cannot pass on items left in the cart by an earlier run.
    await this.waitForToast('Product Added To Cart');
  }

  async openCart(): Promise<void> {
    await this.page.locator(this.cartButton).click();
    await this.page.waitForURL(/cart/);
  }
}
