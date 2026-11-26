# PlaywrightWebFramework

A Cucumber (BDD) test framework that uses Playwright for browser automation and API requests. It tests a sample e-commerce app (`rahulshettyacademy.com`) with 78 scenarios: 42 UI and 36 API.

Every test is a Gherkin scenario in `features/*.feature`. Each sentence is matched to a step definition in `src/steps/*.steps.ts`, which calls page objects (for the browser) or the API client (for the endpoints).

For a beginner-friendly walkthrough of how the pieces fit together, see [`PlaywrightWebFramework_Explained.txt`](./PlaywrightWebFramework_Explained.txt). For the Project 2 capstone work (API tests, flakiness fix, CI, metrics), see [`docs/capstone/project-2/README.md`](./docs/capstone/project-2/README.md).

## Features

- **Gherkin scenarios** for login, dashboard, cart, checkout, orders, and API behaviour.
- **Page Object Model.** Each page has a class in `src/pages/` that holds its locators and actions.
- **API client** in `src/api/`, with hand-written response checks and deterministic edge-case payloads.
- **Shared user journeys** in `src/flows/`, so "add a product and go to checkout" is written once.
- **Shared test data** in `src/data/testData.ts`.
- **Externalized configuration.** `config/config.json` holds the base URLs, browser, timeouts, and retries. `HEADLESS=true` overrides the headless setting.
- **Serial runs.** Scenarios run one at a time, because they share one test user and one server-side cart.
- **Automatic capture on failure.** A Cucumber `After` hook saves a screenshot for each failed scenario.
- **Known defects are tagged.** `@known-defect` scenarios are excluded from normal runs. See the Known defect section below.
- **CI workflow** in [.github/workflows/ci.yml](.github/workflows/ci.yml). It runs the suite headless, posts the results to each pull request, and uploads the reports.

## Tech Stack

| Tool | Purpose |
|---|---|
| TypeScript | Language |
| Cucumber.js | BDD runner (Gherkin `.feature` files and step definitions) |
| Playwright | Browser automation and API requests (used as a library, not as a test runner) |
| cucumber-html-reporter | Converts Cucumber's JSON output into an HTML report |
| ts-node | Lets Cucumber.js load TypeScript step definitions directly |
| dotenv | Loads `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` from `.env` |
| Node.js / npm | Runtime and package management |

## Project Structure

```
config/
└── config.json                    # baseUrl, apiBaseUrl, browser, headless, timeouts, retries

features/                          # Gherkin scenarios
├── api.feature                    # Login, products, route, and token behaviour (API)
├── cart.feature
├── checkout.feature
├── login.feature
├── orders.feature
└── products.feature

src/
├── api/
│   ├── ApiClient.ts               # Login, products, and GET calls
│   ├── payloads.ts                # Deterministic edge-case payloads
│   └── schemas.ts                 # Hand-written response shape checks
├── data/
│   └── testData.ts                # Shared product names and messages
├── flows/
│   └── shoppingFlows.ts           # Shared journey: add product, open checkout
├── pages/                         # Page Objects: Base, Login, Dashboard, Cart, Checkout
├── steps/                         # Step definitions behind the Gherkin sentences
│   ├── api.steps.ts
│   ├── ui.steps.ts
│   └── ...                        # Login, cart, checkout, product, and common steps
├── support/
│   ├── world.ts                   # Cucumber World: browser, page, and API state per scenario
│   └── hooks.ts                   # Before/After hooks: open and close the browser, screenshot on failure
└── utils/
    └── configReader.ts            # Typed config loader and credential reader

scripts/
├── generateCucumberReport.js      # Converts cucumber-report.json to HTML
└── pr-ci-status.js                # Writes the CI results into a pull request description

docs/capstone/project-2/           # Project 2 notes: what was built, metrics, code review
.github/workflows/ci.yml           # CI pipeline
cucumber.js                        # Cucumber runner config (paths, formats, tag filter)
playwright.config.ts               # Playwright settings (not used as a test runner)
```

## Prerequisites

- Node.js 22 or newer (Cucumber 13 requires Node 22, 24, or 26+; CI uses Node 22)
- npm

## Setup

```bash
npm ci
npx playwright install chromium
```

Create a `.env` file in the project root (copy `.env.example`) with the test user's credentials:

```
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=your-test-password
```

`.env` is git-ignored. Never commit real credentials.

## Configuration

`config/config.json`:

```json
{
  "baseUrl": "https://rahulshettyacademy.com/client/#/auth/login",
  "apiBaseUrl": "https://rahulshettyacademy.com/api/ecom",
  "browser": "chromium",
  "headless": false,
  "actionTimeoutMs": 10000,
  "navigationTimeoutMs": 30000,
  "retries": 1
}
```

Set `HEADLESS=true` in the environment to run without a visible browser window. CI does this.

## Running the Tests

| Command | What it runs |
|---|---|
| `npm test` | All scenarios (same as `npm run bdd`) |
| `npm run bdd` | All scenarios, with progress output |
| `npm run bdd:report` | Builds the Cucumber HTML report from the last run |
| `INCLUDE_KNOWN_DEFECTS=1 npx cucumber-js --tags @known-defect` | The known-defect scenario, which fails on purpose |

Headless run, as CI does it:

```bash
HEADLESS=true npm test
```

## Test Reports & Artifacts

| Artifact | Location |
|---|---|
| Cucumber JSON report | `test-output/cucumber-reports/cucumber-report.json` |
| Cucumber HTML report | `test-output/cucumber-reports/cucumber-report.html` |
| Screenshot on failure | Attached to the failed scenario in the Cucumber report |

`test-output/` is git-ignored. CI uploads it as a build artifact.

## Adding a New Scenario

**UI scenario:**
1. New sentence? Add a step in `src/steps/ui.steps.ts`, or a new file under `src/steps/`, using the page objects on `CustomWorld`.
2. Add the scenario to the matching file in `features/`, reusing existing steps where possible.
3. New page? Add a Page Object class under `src/pages/` following `CartPage.ts`.

**API scenario:**
1. Add a method to `src/api/ApiClient.ts` for the endpoint.
2. Add response checks to `src/api/schemas.ts` if the shape matters.
3. Add the scenario to `features/api.feature` and a step in `src/steps/api.steps.ts`.

## Known Limitations

- **Scenarios run one at a time** because they share one user's cart. The suite is slower than it would be with separate users.
- **Schema checks are hand-written**, with no schema library.
- **Search and price filters on the dashboard** are not tested: typing in them doesn't change the product list in this app.
- **Known defect:** malformed JSON returns 500 instead of 400. See below.

## Known defect

The login endpoint returns HTTP 500 for malformed JSON, where it should return 400. The scenario is tagged `@known-defect` in `features/api.feature`. It's excluded from normal runs, so the suite stays green while the bug exists. Run it on purpose to see the failure:

```bash
INCLUDE_KNOWN_DEFECTS=1 npx cucumber-js --tags @known-defect
```

When the app is fixed, remove the `@known-defect` tag so the scenario runs with the rest.
