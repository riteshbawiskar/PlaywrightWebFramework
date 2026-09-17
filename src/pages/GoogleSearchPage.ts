import { Page } from '@playwright/test';

export class GoogleSearchPage {
  private readonly page: Page;
  private readonly searchBox = 'textarea[name="q"], input[name="q"]';

  constructor(page: Page) {
    this.page = page;
  }

  async open(baseUrl: string): Promise<void> {
    await this.page.goto(baseUrl);
  }

  async search(query: string): Promise<void> {
    const box = this.page.locator(this.searchBox);
    await box.click();
    await box.fill(query);
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  async getSearchBoxValue(): Promise<string> {
    return this.page.locator(this.searchBox).inputValue();
  }
}
