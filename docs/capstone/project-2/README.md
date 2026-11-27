# Project 2: AI-Accelerated UI & API Automation

Extends this framework with API tests, a flakiness fix backed by measurements, a CI pipeline, parallel runs, a flake check, generated test data, and a guarded auto-fix. The suite is Cucumber only.

## Current state

| Measure | Value |
|---|---|
| Total scenarios | 82 (42 UI, 40 API) |
| Test runner | Cucumber only, 4 parallel workers by default |
| Test accounts | 4 worker accounts in `src/test-data/users.json`, one per worker |
| Last CI result on `main` | Passing (PR #12 and PR #13, both merged) |
| Known defect | Malformed JSON returns 500 instead of 400 (tagged `@known-defect`, excluded from normal runs) |

## What was built

| Area | Where | Notes |
|---|---|---|
| UI scenarios | [src/features/](../../../src/features/), [src/steps/ui.steps.ts](../../../src/steps/ui.steps.ts) | 42 scenarios: login, products, cart, checkout, orders. |
| API scenarios | [src/features/api.feature](../../../src/features/api.feature), [src/steps/api.steps.ts](../../../src/steps/api.steps.ts) | 40 scenarios: login, token shape, unknown routes, product data checks, edge-case payloads, invalid tokens, and 4 registration checks. |
| API client | [src/api/ApiClient.ts](../../../src/api/ApiClient.ts) | Login, products, registration, and GET calls. Uses Playwright's `request` fixture. |
| Schema checks | [src/api/schemas.ts](../../../src/api/schemas.ts) | Hand-written checks for response shape. No new dependency. |
| Payload generation | [src/api/payloads.ts](../../../src/api/payloads.ts) | Deterministic edge-case payloads and generated boundary-length emails. Same inputs every run. |
| Generated test data | [src/test-data/registrationData.ts](../../../src/test-data/registrationData.ts) | Faker 10.6.0 (pinned). Seeded, with emails limited to reserved example domains. |
| Parallel workers | [cucumber.js](../../../cucumber.js), [src/utils/configReader.ts](../../../src/utils/configReader.ts) | Each worker logs in as its own account, so carts do not collide. |
| Shared checkout journey | [src/flows/shoppingFlows.ts](../../../src/flows/shoppingFlows.ts) | "Add product, open cart, go to checkout" in one place. |
| Shared test data | [src/data/testData.ts](../../../src/data/testData.ts) | Product names, messages, and the checkout country. |
| CI workflow | [.github/workflows/ci.yml](../../../.github/workflows/ci.yml) | Runs the suite headless with 4 workers, posts the result to each PR, uploads the reports. |
| CI report script | [scripts/pr-ci-status.js](../../../scripts/pr-ci-status.js) | Writes the CI results and a before-and-after table into the PR description. |
| Flake check | [scripts/flake-check.js](../../../scripts/flake-check.js) | `npm run flake` runs the suite several times and names the unstable scenarios. |
| Guarded auto-fix | [scripts/auto-fix.js](../../../scripts/auto-fix.js) | Fixes a PR's failing tests with Claude Code on the developer's machine. Pushes only if the suite passes. |
| AI usage log | [scripts/ai-usage.js](../../../scripts/ai-usage.js), [docs/ai-usage/usage-log.csv](../../ai-usage/usage-log.csv) | Records tokens and cost for each scripted Claude call. |
| Feature guide | [docs/features/](../../features/README.md) | One page per feature: why it was added, how it works, what changed. |

## Parallel runs and what they changed

Scenarios run on 4 workers. Each worker logs in as its own account, so one worker's cart cannot leak into another's.

| Measure | Serial (1 worker) | Parallel (4 workers) |
|---|---|---|
| Full suite, local | about 97 s | about 28 s (3 runs: 27.9–28.9 s) |
| Full suite, CI (PR #8) | 4 m 03 s on `main` | 1 m 15 s |

Scenarios on the same worker still run one after another, so they can share that worker's cart. The cart and order scenarios set up their own state.

## Flake check

`npm run flake` runs the suite 5 times and classifies each scenario as stable, flaky, or always failing.

| Measure | Value |
|---|---|
| Runs | 5, on the current code |
| Scenario runs | 390 |
| Failed scenario runs | 0 |

Limit: the flaky classification has not yet been tested on a real flaky scenario. The result above shows only that the check runs and counts correctly.

## Guarded auto-fix

`node scripts/auto-fix.js <pr>` takes the failed `ci-run` on a pull request, asks Claude Code to fix the test code, re-runs the suite, and pushes only if it passes.

Tested end to end on a deliberately broken test PR (#14):
1. CI failed on the planted error.
2. The script ran Claude (`claude-sonnet-5-5`, cost $0.23). It reverted the error in `src/steps/ui.steps.ts`.
3. The suite passed on the pushed fix, and CI went green (`test` 1 m 37 s).

Guards: at most three auto-fix commits in a row, changes allowed only in five folders, and untracked files are never deleted. The script runs only when a person starts it. It does not run in CI, because that would need an AI key stored in the repository.

## Flakiness: history

This was measured on the Playwright UI suite before it was removed. Those specs ran in parallel with one shared user, and the results are kept here as the baseline.

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

**Root cause.** All UI tests logged in as one user, and the cart is stored on the server. With parallel workers, one test's item appeared in another test's cart, and a completed order emptied a cart that other tests were still using. Locators were not the problem.

**Fix.** Each worker now has its own account. This is the parallel setup above.

**Sample size.** 10 runs per test is a small sample. Treat 0% as "no failures seen in 90 runs," not proof of zero flakiness.

## Authoring time: baseline vs. AI-assisted

Figures are the author's reported average timings for one API test case, measured by hand (manual) and with AI assistance (AI-assisted, including reviewing the AI output). These are reported averages, not measured timings.

| Task | Manual (minutes) | With AI (minutes) | Saving |
|---|---|---|---|
| 1 API test case (average) | 50–60 (midpoint 55) | 15–20 (midpoint 17.5) | **68%** (range 60–75%) |
| 5 API test cases | 250–300 (midpoint 275) | 75–100 (midpoint 87.5) | **68%** |

Saving formula: `(manual − AI) ÷ manual × 100`. Midpoint calculation: (55 − 17.5) ÷ 55 = 68%. Worst case: (50 − 20) ÷ 50 = 60%. Best case: (60 − 15) ÷ 60 = 75%.

The per-scenario AI times in `docs/capstone/project-2/authoring-timings.xlsx` for the UI rows are estimates, labelled as such in the file. That spreadsheet is not committed to the repository yet.

## Cucumber repeat check (history)

`npm run bdd` run 10 times in a row, headless, when the suite had 78 scenarios and was still serial:

| Runs | Scenario runs | Failed scenarios | Runs with a failure |
|---|---|---|---|
| 10 | 90 | 0 | 0 |

## Execution timings: one full run (history)

One headless run of the 78-scenario suite, serial, with the time for each scenario taken from the Cucumber report. These are measured execution times, not authoring times.

| Measure | Value |
|---|---|
| Scenarios | 78, all passed (403 steps) |
| Wall-clock run time | 1m 22.8s |
| Sum of scenario times | 82.7s |

Per feature (times are scenario execution time):

| Type | Feature | Scenarios | Total | Average | Slowest |
|---|---|---|---|---|---|
| API | Products API | 36 | 8.7s | 0.2s | 0.8s |
| UI | Login | 8 | 4.6s | 0.6s | 1.2s |
| UI | Products | 13 | 15.4s | 1.2s | 1.9s |
| UI | Cart | 11 | 28.6s | 2.6s | 4.8s |
| UI | Checkout | 7 | 21.1s | 3.0s | 3.7s |
| UI | Orders | 3 | 4.3s | 1.4s | 3.1s |

## Known defect: malformed JSON returns 500

Sending a malformed JSON body to the login endpoint returns HTTP **500** instead of 400. The scenario is tagged `@known-defect` in [src/features/api.feature](../../../src/features/api.feature), so normal runs skip it and stay green. To see the failure:

```bash
INCLUDE_KNOWN_DEFECTS=1 npx cucumber-js --tags @known-defect
```

When the app returns 400, remove the `@known-defect` tag so the scenario runs with the rest.

## AI code review (history)

An independent review agent reviewed the automation code (read-only) when the suite had 78 scenarios. Its 11 findings were checked against the code before any change.

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
# Set TEST_USER_PASSWORD in .env (locally) or as a CI secret. Accounts are in src/test-data/users.json.
npm test                                                       # all 82 scenarios, 4 workers
PARALLEL=1 npm test                                            # serial run
HEADLESS=true npm test                                         # headless, as CI runs it
npm run flake                                                  # rerun the suite 5 times, report unstable scenarios
node scripts/ai-usage.js summary                               # totals for recorded AI calls
INCLUDE_KNOWN_DEFECTS=1 npx cucumber-js --tags @known-defect   # the known defect
```

## Open items

- **Cart removal:** a removal sometimes does not persist on the server. It appeared once and is not fixed.
- **Flake check:** not yet tested on a real flaky scenario.
- **Authoring-time baseline:** recorded from reported averages. The manual timings need to be measured for the mentor.
- **Auto-fix:** runs only when a person starts it on their machine. It is not automatic.
- **Usage log:** only calls routed through `scripts/ai-usage.js` and the auto-fix script are recorded.
- **Valid registration:** not tested, because it would create a real account on every run.
- **Video demo:** not recorded yet.
- **Search and price filters:** not tested, because typing in them doesn't change the product list in this app.
