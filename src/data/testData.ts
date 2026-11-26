// Shared test data. Change a product name or message here, not in every spec.
// Gherkin feature files cannot import TypeScript, so they keep their own literals.

export const products = {
  zaraCoat: 'ZARA COAT 3',
  adidasOriginal: 'ADIDAS ORIGINAL',
} as const;

export const invalidUser = {
  email: 'invalid.user@example.com',
  password: 'WrongPass@123',
} as const;

export const messages = {
  incorrectCredentials: 'Incorrect email or password.',
  productAddedToCart: 'Product Added To Cart',
  orderConfirmation: 'Thankyou for the order.',
} as const;

export const checkout = {
  countryQuery: 'ind',
  country: 'India',
} as const;
