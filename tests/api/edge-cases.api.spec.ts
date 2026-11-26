import { test, expect } from '@playwright/test';
import { ApiClient } from '../../src/api/ApiClient';
import { boundaryEmailPayloads, invalidLoginPayloads, invalidTokens } from '../../src/api/payloads';

test.describe('API edge cases', () => {
  test.describe('login rejects bad input with a client error', () => {
    for (const payload of invalidLoginPayloads) {
      test(`login with ${payload.name}`, async ({ request }) => {
        const api = new ApiClient(request);
        const response = await api.postRawLogin(JSON.stringify(payload.body));

        expect(response.status(), 'should be a 4xx client error').toBeGreaterThanOrEqual(400);
        expect(response.status()).toBeLessThan(500);
        const body = await response.json();
        expect(body.token, 'no token must be issued').toBeUndefined();
      });
    }
  });

  test.describe('login handles boundary-length emails', () => {
    for (const payload of boundaryEmailPayloads()) {
      test(`login with ${payload.name}`, async ({ request }) => {
        const api = new ApiClient(request);
        const response = await api.postRawLogin(JSON.stringify(payload.body));

        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.token, 'no token must be issued').toBeUndefined();
      });
    }
  });

  // Known defect: the app returns 500 for malformed JSON instead of 400.
  // test.fail() keeps CI green while the bug exists, and reports a failure once
  // the app is fixed, so the annotation can then be removed.
  test('login with malformed JSON returns 400 (known defect: app returns 500)', async ({ request }) => {
    test.fail(true, 'App returns 500 for malformed JSON. Expected 400.');
    const api = new ApiClient(request);
    const response = await api.postRawLogin('{"userEmail":');
    expect(response.status()).toBe(400);
  });

  test.describe('products rejects missing or invalid tokens', () => {
    for (const token of invalidTokens) {
      test(`products with token "${token || '(empty)'}" is unauthorized`, async ({ request }) => {
        const api = new ApiClient(request);
        const response = await api.getProducts(token);
        expect(response.status()).toBe(401);
      });
    }
  });
});
