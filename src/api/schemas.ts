// Hand-written schema checks for API responses. They return a list of problems
// instead of throwing, so a test can report every mismatch at once.
// No external schema library is used, so no new dependency is added.

export function validateLoginResponse(body: unknown): string[] {
  const errors: string[] = [];
  if (!isObject(body)) {
    return ['body is not an object'];
  }
  if (typeof body.token !== 'string' || body.token.length === 0) {
    errors.push('token must be a non-empty string');
  }
  if (typeof body.userId !== 'string' || body.userId.length === 0) {
    errors.push('userId must be a non-empty string');
  }
  return errors;
}

export function validateProductsResponse(body: unknown): string[] {
  const errors: string[] = [];
  if (!isObject(body)) {
    return ['body is not an object'];
  }
  if (!Array.isArray(body.data)) {
    errors.push('data must be an array');
    return errors;
  }
  if (typeof body.count !== 'number' || body.count !== body.data.length) {
    errors.push(`count (${String(body.count)}) must equal data length (${body.data.length})`);
  }
  body.data.forEach((item, index) => {
    for (const problem of validateProduct(item)) {
      errors.push(`data[${index}]: ${problem}`);
    }
  });
  return errors;
}

function validateProduct(item: unknown): string[] {
  const errors: string[] = [];
  if (!isObject(item)) {
    return ['item is not an object'];
  }
  if (typeof item._id !== 'string' || item._id.length === 0) {
    errors.push('_id must be a non-empty string');
  }
  if (typeof item.productName !== 'string' || item.productName.trim().length === 0) {
    errors.push('productName must be a non-empty string');
  }
  if (typeof item.productPrice !== 'number' || item.productPrice <= 0) {
    errors.push('productPrice must be a positive number');
  }
  if (typeof item.productCategory !== 'string') {
    errors.push('productCategory must be a string');
  }
  if (typeof item.productStatus !== 'boolean') {
    errors.push('productStatus must be a boolean');
  }
  return errors;
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
