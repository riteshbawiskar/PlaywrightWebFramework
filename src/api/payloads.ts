// Payloads for edge-case API tests. Everything here is deterministic, so a failing
// case is the same on every run and can be reproduced exactly.

export interface PayloadCase {
  name: string;
  body: Record<string, unknown>;
}

// Hand-picked edge cases: empty, missing, wrong type, and hostile-looking input.
export const invalidLoginPayloads: PayloadCase[] = [
  { name: 'empty email and password', body: { userEmail: '', userPassword: '' } },
  { name: 'password missing', body: { userEmail: 'user@example.com' } },
  { name: 'email missing', body: { userPassword: 'x' } },
  { name: 'password empty', body: { userEmail: 'invalid.user@example.com', userPassword: '' } },
  { name: 'empty body', body: {} },
  { name: 'email sent as a number', body: { userEmail: 12345, userPassword: 'x' } },
  { name: 'SQL-style text in email', body: { userEmail: "a' OR 1=1 --", userPassword: 'x' } },
  { name: 'script tag in email', body: { userEmail: '<script>alert(1)</script>@example.com', userPassword: 'x' } },
];

// Generates boundary-length emails (around common length limits) with a valid shape.
// The password is always wrong, so every case should be rejected with a 4xx.
export function boundaryEmailPayloads(lengths: number[] = [1, 64, 254, 255, 256]): PayloadCase[] {
  return lengths.map((length) => {
    const domain = '@example.com';
    const localPart = 'a'.repeat(Math.max(1, length - domain.length));
    return {
      name: `email of length ${length}`,
      body: { userEmail: `${localPart}${domain}`, userPassword: 'WrongPass@123' },
    };
  });
}

// Token values that are present but not valid.
export const invalidTokens: string[] = ['', 'abc', 'Bearer not-a-real-token'];
