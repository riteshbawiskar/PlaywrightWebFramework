# Project 2: AI-Accelerated UI & API Automation

Extends this Playwright + TypeScript framework with API tests, a flakiness fix backed by measurements, and a CI pipeline.

## What was built

| Area | Where | Notes |
|---|---|---|
| API client | [src/api/ApiClient.ts](../../../src/api/ApiClient.ts) | Wraps login and products calls. Uses Playwright's built-in `request` fixture. |
| Schema checks | [src/api/schemas.ts](../../../src/api/schemas.ts) | Hand-written checks for response shape. No new dependency. |
| API tests | [tests/api/products.api.spec.ts](../../../tests/api/products.api.spec.ts) | 5 tests: login success and failure, products with and without a token, schema and content checks. |
| Flakiness script | [scripts/flakiness-report.js](../../../scripts/flakiness-report.js) | Runs tests N times with retries off and reports the fail rate per test. |
| CI workflow | [.github/workflows/ci.yml](../../../.github/workflows/ci.yml) | Headless run of Playwright and Cucumber suites, reports uploaded as artifacts. |
| Config | [config/config.json](../../../config/config.json) | Added `apiBaseUrl`. `HEADLESS` env var overrides the headless setting. |

## Flakiness: baseline and result

Measured with `node scripts/flakiness-report.js 10 tests/login.spec.ts tests/products.spec.ts tests/cart.spec.ts tests/checkout.spec.ts`, retries off, headless.

| Run | Config | Failed runs | Fail rate |
|---|---|---|---|
| Baseline | Default (parallel workers) | 13 of 90 | **14%** |
| Diagnostic | `WORKERS=1` | 0 of 90 | 0% |
| After fix | `workers: 1` in [playwright.config.ts](../../../playwright.config.ts) | 0 of 90 | **0%** |

Per-test baseline failures:

| Test | Failed of 10 (baseline) |
|---|---|
| Checkout: User places an order | 7 |
| Cart: Added product appears in the cart | 3 |
| Checkout: Country field suggests matching countries | 2 |
| Cart: User can proceed to checkout from the cart | 1 |

**Root cause.** All UI tests log in as one user, and the cart is stored on the server. With parallel workers, one test's item appeared in another test's cart (for example, `["ADIDAS ORIGINAL"]` instead of `"ZARA COAT 3"`), and a completed order emptied the cart while other tests were still using it. Locators were not the problem.

**Fix.** `workers: 1` in the Playwright config. Trade-off: the suite runs slower. Revisit once each test gets its own user or cart.

**Sample size.** 10 runs per test is a small sample. Treat 0% as "no failures seen in 90 runs," not proof of zero flakiness.

## Authoring time: baseline vs. AI-assisted

Figures are the author's reported average timings for one API test case, measured by hand (manual) and with AI assistance (AI-assisted, including reviewing the AI output).

| Task | Manual (minutes) | With AI (minutes) | Saving |
|---|---|---|---|
| 1 API test case (average) | 50–60 (midpoint 55) | 15–20 (midpoint 17.5) | **68%** (range 60–75%) |
| 5 API test cases | 250–300 (midpoint 275) | 75–100 (midpoint 87.5) | **68%** |

Saving formula: `(manual − AI) ÷ manual × 100`. Midpoint calculation: (55 − 17.5) ÷ 55 = 68%. Worst case: (50 − 20) ÷ 50 = 60%. Best case: (60 − 15) ÷ 60 = 75%.

Method note: the averages are per test case. Keep the raw per-test timings from the measurement session if the mentor asks for them.

## AI code review

An independent review agent reviewed the automation code (read-only). Its 11 findings were checked against the code before any change.

| # | Finding | Outcome |
|---|---|---|
| 1 | CI skipped the Cucumber suite when Playwright failed | Fixed: `if: always()` on the Cucumber step |
| 2 | Add-to-cart never confirmed success | Fixed: waits for the "Product Added To Cart" toast |
| 3 | `isLoaded()` hid failures behind `try/catch` | Fixed: uses `expect(...)` with a clear message |
| 4 | Login visibility checks did not wait | Fixed: waits up to the action timeout |
| 5 | After hook could leak browsers on failure | Fixed: guarded and closes in `finally` |
| 6 | Repeated login and no status check before token use | Partly fixed: `loginAndGetToken()` added. UI flow helpers deferred |
| 7 | Country typing appended to old text | Fixed: clears the field first |
| 8 | Layout-dependent locators | Deferred: needs live button names confirmed first |
| 9 | Retries can hide flakiness in CI | Not changed: Playwright's CI output already reports "flaky" |
| 10 | Flaky label in the flakiness script never set | Fixed: flaky = passed and failed across repeats |
| 11 | Test data repeated across files | Fixed for TypeScript files: [src/data/testData.ts](../../../src/data/testData.ts). Feature files keep their own literals |

After the changes: type-check passes, Playwright 14/14, Cucumber 9/9 scenarios, and flakiness 0 failures in 140 runs.

## How to run

```bash
npm ci
npx playwright install chromium
# Set TEST_USER_EMAIL and TEST_USER_PASSWORD (in .env locally, or as CI secrets)
npm run test:api          # API tests only
npm test                  # all Playwright tests (UI and API)
HEADLESS=true npm test    # headless, as CI runs it
node scripts/flakiness-report.js 10 tests/login.spec.ts   # flakiness check
```

## Open items

- Authoring-time baseline: recorded from reported averages. Keep the raw per-test timings for the mentor.
- CI runs only once the repo is pushed to GitHub with the two secrets set (`TEST_USER_EMAIL`, `TEST_USER_PASSWORD`).
- Schema validation is hand-written. Decision: keep it, since it adds no dependency. Switch to `zod` or `ajv` only if the mentor asks for a library.
- Place Order is an `<a>` link on the live app, so it uses the CSS class `.action__submit` instead of a role locator.
