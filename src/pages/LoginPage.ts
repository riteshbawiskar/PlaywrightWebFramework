import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly emailInput = '#userEmail';
  private readonly passwordInput = '#userPassword';
  private readonly loginButton = '#login';

  async open(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async login(email: string, password: string): Promise<void> {
    await this.page.locator(this.emailInput).fill(email);
    await this.page.locator(this.passwordInput).fill(password);
    await this.page.locator(this.loginButton).click();
  }

  async isEmailFieldVisible(): Promise<boolean> {
    return this.page.locator(this.emailInput).isVisible();
  }

  async isPasswordFieldVisible(): Promise<boolean> {
    return this.page.locator(this.passwordInput).isVisible();
  }
}
