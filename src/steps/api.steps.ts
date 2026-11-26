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

When('the client logs in with valid credentials and an extra field', async function (this: CustomWorld) {
  const { email, password } = getCredentials();
  const body = { userEmail: email, userPassword: password, extra: 1 };
  this.apiResponse = await (await api(this)).postRawLogin(JSON.stringify(body));
});

When('the client logs in with valid email and the password in uppercase', async function (this: CustomWorld) {
  const { email, password } = getCredentials();
  this.apiResponse = await (await api(this)).login(email, password.toUpperCase());
});

When('the client sends a GET request to the login endpoint', async function (this: CustomWorld) {
  this.apiResponse = await (await api(this)).get('/auth/login');
});

When('the client sends a GET request to the products endpoint', async function (this: CustomWorld) {
  this.apiResponse = await (await api(this)).get('/product/get-all-products');
});

When('the client sends a request to an unknown endpoint', async function (this: CustomWorld) {
  this.apiResponse = await (await api(this)).get('/this-endpoint-does-not-exist');
});

When('the client logs in and requests the products with an extra body field', async function (this: CustomWorld) {
  const client = await api(this);
  const { email, password } = getCredentials();
  this.apiToken = await client.loginAndGetToken(email, password);
  this.apiResponse = await client.getProducts(this.apiToken, { unknown: 1 });
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

Then('the response token should have three parts', async function (this: CustomWorld) {
  const body = (await this.apiResponse!.json()) as LoginResponse;
  expect(body.token.split('.'), 'a JWT has header, payload, and signature').toHaveLength(3);
});

Then('the response user id should be a 24-character hex id', async function (this: CustomWorld) {
  const body = (await this.apiResponse!.json()) as LoginResponse;
  expect(body.userId).toMatch(/^[a-f0-9]{24}$/);
});

Then('the response should be JSON', async function (this: CustomWorld) {
  expect(this.apiResponse!.headers()['content-type']).toContain('application/json');
});

Then('every product should have a unique id', async function (this: CustomWorld) {
  const body = (await this.apiResponse!.json()) as ProductsResponse;
  const ids = body.data.map((p) => p._id);
  expect(new Set(ids).size, 'duplicate product ids found').toBe(ids.length);
});

Then('every product price should be a whole number', async function (this: CustomWorld) {
  const body = (await this.apiResponse!.json()) as ProductsResponse;
  for (const product of body.data) {
    expect(Number.isInteger(product.productPrice), `product ${product._id} price ${product.productPrice}`).toBe(true);
  }
});

Then('every product should have a category and an image URL', async function (this: CustomWorld) {
  const body = (await this.apiResponse!.json()) as ProductsResponse;
  for (const product of body.data) {
    expect(product.productCategory.trim().length, `product ${product._id} needs a category`).toBeGreaterThan(0);
    expect(product.productImage, `product ${product._id} needs an image URL`).toMatch(/^https?:\/\//);
  }
});
