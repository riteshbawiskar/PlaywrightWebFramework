import { test, expect } from '@playwright/test';
import { ApiClient, LoginResponse, ProductsResponse } from '../../src/api/ApiClient';
import { validateLoginResponse, validateProductsResponse } from '../../src/api/schemas';
import { getCredentials } from '../../src/utils/configReader';
import { invalidUser, messages } from '../../src/data/testData';

test.describe('Products API', () => {
  test('login with valid credentials returns a token', async ({ request }) => {
    const api = new ApiClient(request);
    const { email, password } = getCredentials();

    const response = await api.login(email, password);
    expect(response.status()).toBe(200);

    const body = (await response.json()) as LoginResponse;
    expect(validateLoginResponse(body)).toEqual([]);
  });

  test('login with invalid credentials is rejected', async ({ request }) => {
    const api = new ApiClient(request);

    const response = await api.login(invalidUser.email, invalidUser.password);
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.message).toBe(messages.incorrectCredentials);
  });

  test('products request without a token is unauthorized', async ({ request }) => {
    const api = new ApiClient(request);

    const response = await api.getProducts();
    expect(response.status()).toBe(401);
  });

  test('products request with a token returns a valid product list', async ({ request }) => {
    const api = new ApiClient(request);
    const { email, password } = getCredentials();
    const token = await api.loginAndGetToken(email, password);

    const response = await api.getProducts(token);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = (await response.json()) as ProductsResponse;
    expect(validateProductsResponse(body)).toEqual([]);
  });

  test('product list is not empty and every product has a name and price', async ({ request }) => {
    const api = new ApiClient(request);
    const { email, password } = getCredentials();
    const token = await api.loginAndGetToken(email, password);

    const body = (await (await api.getProducts(token)).json()) as ProductsResponse;
    expect(body.data.length).toBeGreaterThan(0);
    for (const product of body.data) {
      expect(product.productName.trim().length).toBeGreaterThan(0);
      expect(product.productPrice).toBeGreaterThan(0);
    }
  });
});
