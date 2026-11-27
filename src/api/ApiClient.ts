import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { getConfig } from '../utils/configReader';

export interface LoginResponse {
  token: string;
  userId: string;
  message: string;
}

export interface Product {
  _id: string;
  productName: string;
  productCategory: string;
  productSubCategory: string;
  productPrice: number;
  productDescription: string;
  productImage: string;
  productRating: string;
  productTotalOrders: string;
  productStatus: boolean;
  productFor: string;
  productAddedBy: string;
  __v: number;
}

export interface ProductsResponse {
  data: Product[];
  count: number;
  message: string;
}

// Thin wrapper around Playwright's APIRequestContext. Tests call these methods
// instead of building URLs and headers by hand, so an endpoint change is one edit.
export class ApiClient {
  private readonly baseUrl = getConfig().apiBaseUrl;

  constructor(private readonly request: APIRequestContext) {}

  async login(email: string, password: string): Promise<APIResponse> {
    return this.request.post(`${this.baseUrl}/auth/login`, {
      data: { userEmail: email, userPassword: password },
    });
  }

  // Sends a registration. Tests that use it must send data the server will reject
  // (see the registration scenarios), so no real account is created.
  async register(details: object): Promise<APIResponse> {
    return this.request.post(`${this.baseUrl}/auth/register`, { data: details });
  }

  // Logs in and returns the token. Fails here, with the status in the message, if login
  // does not succeed, instead of letting a later call fail with a misleading 401.
  async loginAndGetToken(email: string, password: string): Promise<string> {
    const response = await this.login(email, password);
    expect(response.status(), 'login should return 200').toBe(200);
    const body = (await response.json()) as LoginResponse;
    expect(body.token, 'login response should include a token').toBeTruthy();
    return body.token;
  }

  // Sends a raw string body, for testing malformed JSON that an object cannot express.
  async postRawLogin(rawBody: string): Promise<APIResponse> {
    return this.request.post(`${this.baseUrl}/auth/login`, {
      headers: { 'Content-Type': 'application/json' },
      data: rawBody,
    });
  }

  // The products endpoint takes a POST. The body is empty unless a test passes one.
  async getProducts(token?: string, body: Record<string, unknown> = {}): Promise<APIResponse> {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = token;
    }
    return this.request.post(`${this.baseUrl}/product/get-all-products`, {
      headers,
      data: body,
    });
  }

  // GET on an API path, for checking routes that should not exist.
  async get(path: string): Promise<APIResponse> {
    return this.request.get(`${this.baseUrl}${path}`);
  }
}
