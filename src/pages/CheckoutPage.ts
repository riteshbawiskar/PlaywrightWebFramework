import { BasePage } from './BasePage';

export class CheckoutPage extends BasePage {
  private readonly countryInput = 'input[placeholder*="Country"]';
  private readonly countrySuggestions = '.ta-results button';
  private readonly placeOrderButton = '.action__submit';
  private readonly confirmationMessage = '.hero-primary';

  async isLoaded(): Promise<boolean> {
    try {
      await this.page.locator(this.placeOrderButton).waitFor({ state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  async typeCountry(text: string): Promise<void> {
    await this.page.locator(this.countryInput).pressSequentially(text);
    await this.page.locator(this.countrySuggestions).first().waitFor({ state: 'visible' });
  }

  async getCountrySuggestions(): Promise<string[]> {
    const names = await this.page.locator(this.countrySuggestions).allTextContents();
    return names.map((name) => name.trim());
  }

  async selectCountry(country: string): Promise<void> {
    await this.typeCountry(country);
    await this.page.locator(this.countrySuggestions).filter({ hasText: country }).first().click();
  }

  async placeOrder(): Promise<void> {
    await this.page.locator(this.placeOrderButton).click();
  }

  async getConfirmationMessage(): Promise<string> {
    await this.page.locator(this.confirmationMessage).waitFor({ state: 'visible' });
    return ((await this.page.locator(this.confirmationMessage).textContent()) ?? '').trim();
  }
}
