import { faker } from '@faker-js/faker';

// Generated registration details for API tests. Every value is fake:
// - emails use reserved example domains only (RFC 2606), so they can never reach a real mailbox;
// - names, mobile numbers, and passwords are random and are never real personal data.
//
// The seed makes each run produce the same values, so a failing run can be repeated.
// Set FAKER_SEED to try a different set.
faker.seed(Number(process.env.FAKER_SEED ?? 20260101));

export interface RegistrationDetails {
  firstName: string;
  lastName: string;
  userEmail: string;
  userPassword: string;
  userMobile: string;
  userOccupation: string;
  userGender: string;
}

// The app only accepts these answers for occupation and gender in our tests.
const OCCUPATION = 'Engineer';
const GENDER = 'Male';

// The registration endpoint requires a first name of 3 to 20 characters.
function nameWithinLimits(generate: () => string): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const name = generate().replace(/[^A-Za-z]/g, '');
    if (name.length >= 3 && name.length <= 20) return name;
  }
  throw new Error('Could not generate a name within 3 to 20 characters');
}

// Reserved domains that can never be a real mailbox (RFC 2606 and RFC 6761).
const RESERVED_EMAIL = /@(example\.(com|org|net)|[^@]+\.(test|invalid|example))$/i;

export function isReservedEmail(email: string): boolean {
  return RESERVED_EMAIL.test(email);
}

// Builds a registration with fake details. Overrides are checked, so a test cannot
// slip a real email address into the generated data.
export function buildRegistration(overrides: Partial<RegistrationDetails> = {}): RegistrationDetails {
  const firstName = nameWithinLimits(() => faker.person.firstName());
  const lastName = nameWithinLimits(() => faker.person.lastName());
  const localPart = `${firstName}.${lastName}.${faker.string.alphanumeric(6)}`.toLowerCase();

  const details: RegistrationDetails = {
    firstName,
    lastName,
    userEmail: `${localPart}@example.com`,
    userPassword: `Test@${faker.string.alphanumeric(8)}`,
    userMobile: `9${faker.string.numeric(9)}`,
    userOccupation: OCCUPATION,
    userGender: GENDER,
    ...overrides,
  };

  if (!isReservedEmail(details.userEmail)) {
    throw new Error(`Refusing to use a non-reserved email address in test data: ${details.userEmail}`);
  }
  return details;
}

// A password of exactly `length` characters, with a letter, a digit, and a symbol so that
// only the length rule can fail.
export function passwordOfLength(length: number): string {
  const base = `Aa1@${faker.string.alphanumeric(Math.max(length, 4))}`;
  return base.slice(0, length);
}
