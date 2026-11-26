# PlaywrightWebFramework

A Playwright + TypeScript automation framework for a sample e-commerce app (`rahulshettyacademy.com`). It covers UI and API tests, and BDD scenarios written in Gherkin.

It has three test layers:

- **API tests** (`tests/api/*.api.spec.ts`): call the app's endpoints directly and check status codes, response shape, and content.
- **Plain Playwright UI tests** (`tests/*.spec.ts`): browser tests written in TypeScript.
- **Cucumber BDD scenarios** (`features/*.feature` + `src/steps/*.steps.ts`): the same journeys written as plain-English sentences.

For a beginner-friendly walkthrough of how the pieces fit together, see [`PlaywrightWebFramework_Explained.txt`](./PlaywrightWebFramework_Explained.txt). For the Project 2 capstone work (API tests, flakiness fix, CI, metrics), see [`docs/capstone/project-2/README.md`](./docs/capstone/project-2/README.md).

## Features

- **Page Object Model.** Each page has a class in `src/pages/` that holds its locators and actions.
- **Role-based locators** where the app has accessible button names (for example "Add To Cart", "Checkout", "Place Order").
- **Shared user journeys** in `src/flows/` so common steps such as "add a product and go to checkout" are written once.
- **Shared test data** in `src/data/testData.ts`.
- **Externalized configuration.** `config/config.json` holds the base URLs, browser, timeouts, and retries. `HEADLESS=true` overrides the headless setting.
- **Serial UI runs.** `workers: 1` in [playwright.config.ts](playwright.config.ts) because all UI tests share one user and one server-side cart. See the reason in that file.
- **Automatic capture on failure.** Playwright saves screenshots, videos, and traces for failed tests. Cucumber scenarios save a screenshot through an `After` hook.
- **Flakiness check.** `npm run flaky` runs tests repeatedly with retries off and reports the fail rate per test.
- **CI workflow** in [.github/workflows/ci.yml](.github/workflows/ci.yml). It runs both suites headless and uploads the reports.

## Tech Stack

| Tool | Purpose |
|---|---|
| TypeScript | Language |
| Playwright Test | Browser automation, API requests, test runner, assertions |
| Cucumber.js | BDD runner (Gherkin `.feature` files and step definitions) |
| cucumber-html-reporter | Converts Cucumber's JSON output into an HTML report |
| ts-node | Lets Cucumber.js load TypeScript step definitions directly |
| dotenv | Loads `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` from `.env` |
| Node.js / npm | Runtime and package management |

## Project Structure

```
config/
└── config.json                    # baseUrl, apiBaseUrl, browser, headless, timeouts, retries

features/                          # Gherkin scenarios (BDD): cart, checkout, login, products

src/
├── api/
│   ├── ApiClient.ts               # Login and products API calls
│   └── schemas.ts                 # Hand-written response shape checks
├── data/
│   └── testData.ts                # Shared product names, messages, and credentials for bad-login tests
├── flows/
│   └── shoppingFlows.ts           # Shared journeys (add product, open checkout)
├── fixtures/
│   └── pageFixtures.ts            # Gives plain Playwright tests their page objects
├── pages/                         # Page Objects: Base, Login, Dashboard, Cart, Checkout
├── steps/                         # Step definitions behind the Gherkin sentences
├── support/
│   ├── world.ts                   # Cucumber World: holds the browser and page per scenario
│   └── hooks.ts                   # Before/After hooks: open and close the browser, screenshot on failure
└── utils/
    └── configReader.ts            # Typed config loader and credential reader

tests/
├── api/products.api.spec.ts       # API tests
├── cart.spec.ts
├── checkout.spec.ts
├── login.spec.ts
└── products.spec.ts

scripts/
├── flakiness-report.js            # Repeated runs with fail rates per test
└── generateCucumberReport.js      # Converts cucumber-report.json to HTML

docs/capstone/project-2/           # Project 2 notes: what was built, metrics, code review
.github/workflows/ci.yml           # CI pipeline
playwright.config.ts               # Playwright runner config
cucumber.js                        # Cucumber runner config
```

## Prerequisites

- Node.js 20+ (CI uses Node 20)
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
| `npm test` | All Playwright tests (API and UI) |
| `npm run test:api` | API tests only |
| `npm run test:headed` | Playwright tests with a visible browser |
| `npm run report` | Opens the last Playwright HTML report |
| `npm run bdd` | Cucumber BDD scenarios |
| `npm run bdd:report` | Builds the Cucumber HTML report from the last run |
| `npm run flaky` | Runs tests N times (default 10) and reports fail rates. Example: `npm run flaky -- 10 tests/login.spec.ts` |

Headless run, as CI does it:

```bash
HEADLESS=true npm test
HEADLESS=true npm run bdd
```

## Test Reports & Artifacts

| Artifact | Location |
|---|---|
| Playwright HTML report | `test-output/playwright-report/index.html` |
| Screenshots, videos, traces (failures only) | `test-output/test-results/<test-name>/` |
| Cucumber JSON report | `test-output/cucumber-reports/cucumber-report.json` |
| Cucumber HTML report | `test-output/cucumber-reports/cucumber-report.html` |
| Flakiness summaries | `test-output/flakiness/` |

`test-output/` is git-ignored. CI uploads it as a build artifact.

## Adding a New Test

**Plain Playwright style:**
1. New page? Add a Page Object class under `src/pages/` following `CartPage.ts`.
2. New test? Add a `test(...)` block to a `.spec.ts` file under `tests/`, using the page objects from the fixtures.
3. New test data? Add it to `src/data/testData.ts`.
4. Repeated journey? Add a function under `src/flows/`.

**API test:**
1. Add a method to `src/api/ApiClient.ts` for the endpoint.
2. Add response checks to `src/api/schemas.ts` if the shape matters.
3. Write the test in `tests/api/`.

**Cucumber BDD style:**
1. New scenario? Add it to a `.feature` file under `features/`, reusing existing step sentences where possible.
2. New step sentence? Add a matching `Given`, `When`, or `Then` in a `*.steps.ts` file under `src/steps/`, using the page objects on `CustomWorld`.

## Known Limitations

- **UI tests run one at a time** because they share one user's cart. The suite is slower than it would be with separate users.
- **Schema checks are hand-written**, with no schema library.
- **Flakiness numbers** come from 10 repeats per test. That is a small sample.
