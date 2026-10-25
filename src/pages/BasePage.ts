import { Page, expect } from '@playwright/test';

export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Toast notifications are used by the app for success and error messages.
  protected readonly toast = '#toast-container';

  // Waits for a toast containing the expected text. Toasts animate in and an
  // older one (such as "Login Successfully") can still be showing, so wait for
  // the specific message instead of reading whatever is there.
  async waitForToast(message: string): Promise<void> {
    await expect(this.page.locator(this.toast)).toContainText(message);
  }
}
