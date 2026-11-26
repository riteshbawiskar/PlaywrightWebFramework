# Project 2: AI-Accelerated UI & API Automation

Extends this framework with API tests, a flakiness fix backed by measurements, a CI pipeline, and a Cucumber-only suite of 78 scenarios.

## Current state

| Measure | Value |
|---|---|
| Total scenarios | 78 (42 UI, 36 API) |
| Test runner | Cucumber only |
| Last CI result | Passing on PR #5 |
| Known defect | Malformed JSON returns 500 instead of 400 (tagged `@known-defect`, excluded from normal runs) |

## What was built

| Area | Where | Notes |
|---|---|---|
| API scenarios | [features/api.feature](../../../features/api.feature), [src/steps/api.steps.ts](../../../src/steps/api.steps.ts) | 36 scenarios: login, token shape, routes that should not exist, product data checks, edge-case payloads, invalid tokens. |
| UI scenarios | [features/](../../../features/), [src/steps/ui.steps.ts](../../../src/steps/ui.steps.ts) | 42 scenarios in total: login, products, cart, checkout, orders. |
| API client | [src/api/ApiClient.ts](../../../src/api/ApiClient.ts) | Login, products, and GET calls. Uses Playwright's `request` fixture. |
| Schema checks | [src/api/schemas.ts](../../../src/api/schemas.ts) | Hand-written checks for response shape. No new dependency. |
| Payload generation | [src/api/payloads.ts](../../../src/api/payloads.ts) | Deterministic edge-case payloads and generated boundary-length emails. Same inputs every run. |
| Shared checkout journey | [src/flows/shoppingFlows.ts](../../../src/flows/shoppingFlows.ts) | "Add product, open cart, go to checkout" in one place. |
| Shared test data | [src/data/testData.ts](../../../src/data/testData.ts) | Product names and messages. |
| CI workflow | [.github/workflows/ci.yml](../../../.github/workflows/ci.yml) | Runs the Cucumber suite headless, posts the result to each PR, and uploads the reports. |
| CI report script | [scripts/pr-ci-status.js](../../../scripts/pr-ci-status.js) | Writes the CI results and a before-and-after table into the PR description. |
| Config | [config/config.json](../../../config/config.json) | Added `apiBaseUrl`. `HEADLESS` env var overrides the headless setting. |

Removed in the Cucumber-only change: the Playwright spec files (`tests/`), the Playwright page fixtures, and the flakiness script. The flakiness history below was measured on those files before they were removed.

## Flakiness: baseline and result

This was measured on the Playwright UI suite before it was removed. The same cart-sharing risk applies to the Cucumber suite, which runs one scenario at a time for the same reason.

| Run | Config | Failed runs | Fail rate |
|---|---|---|---|
| Baseline | Default (parallel workers) | 13 of 90 | **14%** |
| Diagnostic | `WORKERS=1` | 0 of 90 | 0% |
| After fix | `workers: 1` | 0 of 90 | **0%** |

Per-test baseline failures:

| Test | Failed of 10 (baseline) |
|---|---|
| Checkout: User places an order | 7 |
| Cart: Added product appears in the cart | 3 |
| Checkout: Country field suggests matching countries | 2 |
| Cart: User can proceed to checkout from the cart | 1 |

**Root cause.** All UI tests log in as one user, and the cart is stored on the server. With parallel workers, one test's item appeared in another test's cart (for example, `["ADIDAS ORIGINAL"]` instead of `"ZARA COAT 3"`), and a completed order emptied the cart while other tests were still using it. Locators were not the problem.

**Fix.** Run the tests one at a time. Trade-off: the suite runs slower. Revisit once each test gets its own user or cart.

**Sample size.** 10 runs per test is a small sample. Treat 0% as "no failures seen in 90 runs," not proof of zero flakiness.

## Authoring time: baseline vs. AI-assisted

Figures are the author's reported average timings for one API test case, measured by hand (manual) and with AI assistance (AI-assisted, including reviewing the AI output).

| Task | Manual (minutes) | With AI (minutes) | Saving |
|---|---|---|---|
| 1 API test case (average) | 50–60 (midpoint 55) | 15–20 (midpoint 17.5) | **68%** (range 60–75%) |
| 5 API test cases | 250–300 (midpoint 275) | 75–100 (midpoint 87.5) | **68%** |

Saving formula: `(manual − AI) ÷ manual × 100`. Midpoint calculation: (55 − 17.5) ÷ 55 = 68%. Worst case: (50 − 20) ÷ 50 = 60%. Best case: (60 − 15) ÷ 60 = 75%.

Method note: the averages are per test case. Keep the raw per-test timings from the measurement session if the mentor asks for them.

## Cucumber repeat check

`npm run bdd` run 10 times in a row, headless, before the API scenarios and UI scenarios were added:

| Runs | Scenario runs | Failed scenarios | Runs with a failure |
|---|---|---|---|
| 10 | 90 | 0 | 0 |

The current suite (78 scenarios) passed in full in CI on PR #4 and PR #5.

## Known defect: malformed JSON returns 500

Sending a malformed JSON body to the login endpoint returns HTTP **500** instead of 400. The scenario is tagged `@known-defect` in [features/api.feature](../../../features/api.feature), so normal runs skip it and stay green. To see the failure:

```bash
INCLUDE_KNOWN_DEFECTS=1 npx cucumber-js --tags @known-defect
```

When the app returns 400, remove the `@known-defect` tag so the scenario runs with the rest.

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
| 8 | Layout-dependent locators | Partly fixed: role locators for cart and checkout buttons. Place Order is an `<a>` link, so it keeps its CSS class |
| 9 | Retries can hide flakiness in CI | Not changed |
| 10 | Flaky label in the flakiness script never set | Fixed (the script has since been removed) |
| 11 | Test data repeated across files | Fixed for TypeScript files: [src/data/testData.ts](../../../src/data/testData.ts) |

## How to run

```bash
npm ci
npx playwright install chromium
# Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env (locally) or as CI secrets
npm test                                                   # all 78 scenarios
HEADLESS=true npm test                                     # headless, as CI runs it
INCLUDE_KNOWN_DEFECTS=1 npx cucumber-js --tags @known-defect   # the known defect
```

## Open items

- **Authoring-time baseline:** recorded from reported averages. Keep the raw per-test timings for the mentor.
- **Schema validation:** hand-written. Decision: keep it, since it adds no dependency. Switch to `zod` or `ajv` only if the mentor asks for a library.
- **Search and price filters:** not tested, because typing in them doesn't change the product list in this app.
- **Cart persistence:** removing an item is checked on the page only. The item came back after a reload in one test run, and I haven't found out why.
