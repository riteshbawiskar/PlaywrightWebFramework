import { Given, When, Then } from '@cucumber/cucumber';
import { expect, Page } from '@playwright/test';
import { CustomWorld } from '../support/world';

// Finds a product card by its exact product name.
function productCard(page: Page, productName: string) {
  return page.locator('.card').filter({ has: page.getByText(productName, { exact: true }) }).first();
}

// Removes every item from the cart page, one at a time. Each removal waits for the
// server's confirmation (DELETE .../remove-from-cart/...), so a later reload cannot cancel it.
async function removeAllCartItems(page: Page): Promise<void> {
  const items = page.locator('.cartSection h3');
  let count = await items.count();
  while (count > 0) {
    const confirmed = page.waitForResponse(
      (r) => r.request().method() === 'DELETE' && r.url().includes('/remove-from-cart/'),
    );
    await page.locator('.cartSection button.btn-danger').last().click();
    await confirmed;
    count -= 1;
    await expect(items, 'cart item should be removed').toHaveCount(count);
  }
}

// ---- Login page ----

Then('the page title should be {string}', async function (this: CustomWorld, title: string) {
  await expect(this.page, 'page title').toHaveTitle(title);
});

Then('the email field should show the placeholder {string}', async function (this: CustomWorld, placeholder: string) {
  await expect(this.page.locator('#userEmail')).toHaveAttribute('placeholder', placeholder);
});

Then('the login page should have a {string} link', async function (this: CustomWorld, linkText: string) {
  await expect(this.page.getByRole('link', { name: linkText, exact: true }).first()).toBeVisible();
});

Then('the login button should be visible', async function (this: CustomWorld) {
  await expect(this.page.locator('#login')).toBeVisible();
});

// ---- Dashboard and product cards ----

Then('the navigation should show {string}', async function (this: CustomWorld, item: string) {
  await expect(this.page.getByRole('button', { name: item }).first()).toBeVisible();
});

Then('the dashboard search box should be visible', async function (this: CustomWorld) {
  await expect(this.page.locator('input[placeholder="search"]:visible').first()).toBeVisible();
});

Then('the product {string} should show the price {string}', async function (this: CustomWorld, productName: string, price: string) {
  await expect(productCard(this.page, productName), `${productName} card`).toContainText(price);
});

Then('the product {string} should have a {string} button', async function (this: CustomWorld, productName: string, label: string) {
  // Not exact: button names include icon text, so "Add To Cart" is matched within the full name.
  await expect(productCard(this.page, productName).getByRole('button', { name: label })).toBeVisible();
});

When('the user opens the details of {string}', async function (this: CustomWorld, productName: string) {
  await productCard(this.page, productName).getByRole('button', { name: 'View', exact: true }).click();
  await this.page.waitForURL(/product-details/);
});

Then('the product details should show {string}', async function (this: CustomWorld, text: string) {
  await expect(this.page.getByText(text).filter({ visible: true }).first()).toBeVisible();
});

// ---- Cart ----

Given('the cart is empty', async function (this: CustomWorld) {
  await this.page.locator('button[routerlink*="cart"]').click();
  await this.page.waitForURL(/cart/);
  await removeAllCartItems(this.page);
  await this.page.getByRole('button', { name: 'Continue Shopping' }).click();
  await this.page.waitForURL(/dashboard\/dash/);
  await this.dashboardPage.isLoaded();
});

When('the user removes every item from the cart', async function (this: CustomWorld) {
  await removeAllCartItems(this.page);
});

When('the user clicks Continue Shopping', async function (this: CustomWorld) {
  await this.page.getByRole('button', { name: 'Continue Shopping' }).click();
  await this.page.waitForURL(/dashboard/);
});

Then('the cart badge should show {string}', async function (this: CustomWorld, text: string) {
  await expect(this.page.locator('button[routerlink*="cart"]'), 'cart badge').toContainText(text);
});

Then('the cart should show {string}', async function (this: CustomWorld, text: string) {
  // The page can hold a hidden copy of the same text, so match only the visible one.
  await expect(this.page.getByText(text).filter({ visible: true }).first(), `cart should show "${text}"`).toBeVisible();
});

Then('the cart should have no items', async function (this: CustomWorld) {
  await expect(this.page.locator('.cartSection h3'), 'cart should have no items').toHaveCount(0);
});

Then('the cart item should have a {string} button', async function (this: CustomWorld, label: string) {
  await expect(this.page.locator('.cartSection').getByRole('button', { name: label }).first()).toBeVisible();
});

// ---- Checkout ----

When('the user types the text {string} with no matching country', async function (this: CustomWorld, text: string) {
  const input = this.page.locator('input[placeholder*="Country"]');
  await input.fill('');
  await input.pressSequentially(text);
  // Suggestions for a non-matching query appear as an empty list, so there is no element to wait for.
  // The app shows its suggestions within about two seconds in testing.
  await this.page.waitForTimeout(1500);
});

Then('the country suggestions should be empty', async function (this: CustomWorld) {
  expect(await this.checkoutPage.getCountrySuggestions(), 'no suggestions for a non-matching country').toEqual([]);
});

// ---- Orders ----

When('the user opens the orders page', async function (this: CustomWorld) {
  await this.page.getByRole('button', { name: 'ORDERS' }).click();
  await this.page.waitForURL(/myorders/);
});

Then('the orders page should show {string}', async function (this: CustomWorld, text: string) {
  await expect(this.page.getByText(text).first()).toBeVisible();
});

Then('the orders table should have the column {string}', async function (this: CustomWorld, column: string) {
  await expect(this.page.locator('table').first()).toContainText(column);
});

Then('the orders should include {string}', async function (this: CustomWorld, productName: string) {
  await expect(this.page.locator('table').first(), `orders should list ${productName}`).toContainText(productName);
});
