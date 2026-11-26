import { When, Then } from '@cucumber/cucumber';
import { expect, request as playwrightRequest } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { ApiClient, LoginResponse, ProductsResponse } from '../api/ApiClient';
import { validateProductsResponse } from '../api/schemas';
import { boundaryEmailPayloads, invalidLoginPayloads } from '../api/payloads';
import { getCredentials } from '../utils/configReader';

// One request context per scenario. The After hook in src/support/hooks.ts disposes it.
async function api(world: CustomWorld): Promise<ApiClient> {
  if (!world.apiContext) {
    world.apiContext = await playwrightRequest.newContext();
  }
  return new ApiClient(world.apiContext);
}

function findPayload(name: string) {
  const payload = invalidLoginPayloads.find((p) => p.name === name);
  if (!payload) {
    throw new Error(`No login payload named "${name}" in src/api/payloads.ts`);
  }
  return payload;
}

// --- When: send requests ---

When('the client logs in with valid credentials', async function (this: CustomWorld) {
  const { email, password } = getCredentials();
  this.apiResponse = await (await api(this)).login(email, password);
});

When('the client logs in with email {string} and password {string}', async function (this: CustomWorld, email: string, password: string) {
  this.apiResponse = await (await api(this)).login(email, password);
});

When('the client logs in and requests the products', async function (this: CustomWorld) {
  const client = await api(this);
  const { email, password } = getCredentials();
  this.apiToken = await client.loginAndGetToken(email, password);
  this.apiResponse = await client.getProducts(this.apiToken);
});

When('the client requests the products without a token', async function (this: CustomWorld) {
  this.apiResponse = await (await api(this)).getProducts();
});

When('the client requests the products with the token {string}', async function (this: CustomWorld, token: string) {
  // "(empty)" in the feature file means an empty token, which the client sends as no header.
  const value = token === '(empty)' ? '' : token;
  this.apiResponse = await (await api(this)).getProducts(value);
});

When('the client sends the login payload {string}', async function (this: CustomWorld, caseName: string) {
  const payload = findPayload(caseName);
  this.apiResponse = await (await api(this)).postRawLogin(JSON.stringify(payload.body));
});

When('the client logs in with an email of {int} characters and a wrong password', async function (this: CustomWorld, length: number) {
  const payload = boundaryEmailPayloads([length])[0];
  this.apiResponse = await (await api(this)).postRawLogin(JSON.stringify(payload.body));
});

When('the client sends malformed JSON to the login endpoint', async function (this: CustomWorld) {
  this.apiResponse = await (await api(this)).postRawLogin('{"userEmail":');
});

// --- Then: check the last response ---

Then('the response status should be {int}', async function (this: CustomWorld, status: number) {
  expect(this.apiResponse, 'no response was recorded').toBeDefined();
  expect(this.apiResponse!.status(), 'HTTP status').toBe(status);
});

Then('the response should be a client error', async function (this: CustomWorld) {
  const status = this.apiResponse!.status();
  expect(status, 'HTTP status should be a 4xx client error').toBeGreaterThanOrEqual(400);
  expect(status).toBeLessThan(500);
});

Then('the response should contain a token', async function (this: CustomWorld) {
  const body = (await this.apiResponse!.json()) as LoginResponse;
  expect(body.token, 'login response should include a token').toBeTruthy();
});

Then('the response should not contain a token', async function (this: CustomWorld) {
  const body = await this.apiResponse!.json();
  expect(body.token, 'no token must be issued').toBeUndefined();
});

Then('the response message should be {string}', async function (this: CustomWorld, message: string) {
  const body = await this.apiResponse!.json();
  expect(body.message).toBe(message);
});

Then('the response should contain a valid product list', async function (this: CustomWorld) {
  const body = (await this.apiResponse!.json()) as ProductsResponse;
  expect(validateProductsResponse(body), 'product list failed schema checks').toEqual([]);
});

Then('the response should contain at least one product', async function (this: CustomWorld) {
  const body = (await this.apiResponse!.json()) as ProductsResponse;
  expect(body.data.length).toBeGreaterThan(0);
});

Then('every product should have a name and a positive price', async function (this: CustomWorld) {
  const body = (await this.apiResponse!.json()) as ProductsResponse;
  for (const product of body.data) {
    expect(product.productName.trim().length, `product ${product._id} needs a name`).toBeGreaterThan(0);
    expect(product.productPrice, `product ${product._id} needs a positive price`).toBeGreaterThan(0);
  }
});
