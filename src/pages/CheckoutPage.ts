import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutPage extends BasePage {
  private readonly countryInput = 'input[placeholder*="Country"]';
  private readonly countrySuggestions = '.ta-results button';
  private readonly confirmationMessage = '.hero-primary';

  // The app renders Place Order as an <a> link, not a <button>, so no button role
  // exists for it. The class is the most stable handle available.
  private placeOrderButton() {
    return this.page.locator('.action__submit');
  }

  // Fails with a clear message instead of returning false.
  async isLoaded(): Promise<boolean> {
    await expect(this.placeOrderButton(), 'checkout Place Order button should be visible').toBeVisible();
    return true;
  }

  async typeCountry(text: string): Promise<void> {
    // Clear first: pressSequentially appends, which left stale text in the box on a second lookup.
    const input = this.page.locator(this.countryInput);
    await input.fill('');
    await input.pressSequentially(text);
    await this.page.locator(this.countrySuggestions).first().waitFor({ state: 'visible' });
  }

  async getCountrySuggestions(): Promise<string[]> {
    const names = await this.page.locator(this.countrySuggestions).allTextContents();
    return names.map((name) => name.trim());
  }

  async selectCountry(country: string): Promise<void> {
    await this.typeCountry(country);
    // Exact match. A partial match picks the wrong country: "India" also matches
    // "British Indian Ocean Territory", which appears first in the list.
    await this.page.locator(this.countrySuggestions).getByText(country, { exact: true }).first().click();
  }

  async placeOrder(): Promise<void> {
    await this.placeOrderButton().click();
  }

  async getConfirmationMessage(): Promise<string> {
    await this.page.locator(this.confirmationMessage).waitFor({ state: 'visible' });
    return ((await this.page.locator(this.confirmationMessage).textContent()) ?? '').trim();
  }
}
