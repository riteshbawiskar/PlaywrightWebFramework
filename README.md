# PlaywrightWebFramework

A Cucumber (BDD) test framework that uses Playwright for browser automation and API requests. It tests a sample e-commerce app (`rahulshettyacademy.com`) with 78 scenarios: 42 UI and 36 API.

Every test is a Gherkin scenario in `src/features/*.feature`. Each sentence is matched to a step definition in `src/steps/*.steps.ts`, which calls page objects (for the browser) or the API client (for the endpoints).

For a beginner-friendly walkthrough of how the pieces fit together, see [`PlaywrightWebFramework_Explained.txt`](./PlaywrightWebFramework_Explained.txt). For the Project 2 capstone work (API tests, flakiness fix, CI, metrics), see [`docs/capstone/project-2/README.md`](./docs/capstone/project-2/README.md).

**Why each feature exists.** [`docs/features/`](./docs/features/README.md) has one page per feature. Each page explains the problem it solves, how it works (with a flowchart), and what changed after it was added.

## Features

- **Gherkin scenarios** for login, dashboard, cart, checkout, orders, and API behaviour.
- **Page Object Model.** Each page has a class in `src/pages/` that holds its locators and actions.
- **API client** in `src/api/`, with hand-written response checks and deterministic edge-case payloads.
- **Shared user journeys** in `src/flows/`, so "add a product and go to checkout" is written once.
- **Shared test data** in `src/data/testData.ts`.
- **Generated test data.** Faker builds registration details with fake, reserved-domain emails. See [docs/features/generated-test-data.md](docs/features/generated-test-data.md).
- **Externalized configuration.** `config/config.json` holds the base URLs, browser, timeouts, and retries. `HEADLESS=true` overrides the headless setting.
- **Parallel runs.** Scenarios run in parallel, one worker per test account in `src/test-data/users.json`. Each worker has its own cart, so workers do not interfere.
- **Automatic capture on failure.** A Cucumber `After` hook saves a screenshot for each failed scenario.
- **Known defects are tagged.** `@known-defect` scenarios are excluded from normal runs. See the Known defect section below.
- **Flake check.** `npm run flake` reruns the suite and names the scenarios that pass only some of the time. See [docs/features/flake-check.md](docs/features/flake-check.md).
- **CI workflow** in [.github/workflows/ci.yml](.github/workflows/ci.yml). It runs the suite headless with 4 parallel workers, posts the results to each pull request, and uploads the reports. See [docs/features/ci-pipeline.md](docs/features/ci-pipeline.md).

## Tech Stack

| Tool | Purpose |
|---|---|
| TypeScript | Language |
| Cucumber.js | BDD runner (Gherkin `.feature` files and step definitions) |
| Playwright | Browser automation and API requests (used as a library, not as a test runner) |
| cucumber-html-reporter | Converts Cucumber's JSON output into an HTML report |
| ts-node | Lets Cucumber.js load TypeScript step definitions directly |
| dotenv | Loads `TEST_USER_PASSWORD` from `.env` |
| Node.js / npm | Runtime and package management |

## Project Structure

```
config/
└── config.json                    # baseUrl, apiBaseUrl, browser, headless, timeouts, retries

src/features/                      # Gherkin scenarios
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
├── test-data/
│   ├── registrationData.ts        # Faker-generated registration details (reserved emails only)
│   └── users.json                 # Worker test accounts (no passwords)
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
├── flake-check.js                 # Reruns the suite and reports unstable scenarios
├── generateCucumberReport.js      # Converts cucumber-report.json to HTML
└── pr-ci-status.js                # Writes the CI results into a pull request description

docs/
├── features/                      # One page per feature: why, how, what changed
└── capstone/project-2/            # Project 2 notes: what was built, metrics, code review
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

Create a `.env` file in the project root (copy `.env.example`) with the password shared by the test accounts:

```
TEST_USER_PASSWORD=your-test-password
```

`.env` is git-ignored. Never commit real credentials. The account emails are in `src/test-data/users.json`, which holds no passwords and is safe to commit. In CI the password comes from the `TEST_USER_PASSWORD` secret.

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
| `npm run flake` | Runs the suite 5 times and reports scenarios that pass only some of the time. Writes `test-output/flake/flake-report.md`. Pass a number to change the run count, for example `node scripts/flake-check.js 10` |
| `INCLUDE_KNOWN_DEFECTS=1 npx cucumber-js --tags @known-defect` | The known-defect scenario, which fails on purpose |
| `node scripts/ai-usage.js run "<task>" "<prompt>"` | Runs one Claude Code call and records its tokens and cost in `docs/ai-usage/usage-log.csv`. See [docs/features/ai-usage-log.md](docs/features/ai-usage-log.md) |
| `node scripts/ai-usage.js summary` | Totals for every recorded AI call |
| `GH_TOKEN=$(gh auth token -u riteshbawiskar) node scripts/auto-fix.js <pr>` | Fixes the failing tests on a pull request with Claude, on your machine, then pushes. See [docs/features/auto-fix-local.md](docs/features/auto-fix-local.md) |

Headless run, as CI does it:

```bash
HEADLESS=true npm test
```

Parallel workers default to 4, one per account in `src/test-data/users.json`. Set `PARALLEL` to change it, for example `PARALLEL=1` for a serial run. The count cannot exceed the number of accounts; the run stops with a message if it does.

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
2. Add the scenario to the matching file in `src/features/`, reusing existing steps where possible.
3. New page? Add a Page Object class under `src/pages/` following `CartPage.ts`.

**API scenario:**
1. Add a method to `src/api/ApiClient.ts` for the endpoint.
2. Add response checks to `src/api/schemas.ts` if the shape matters.
3. Add the scenario to `src/features/api.feature` and a step in `src/steps/api.steps.ts`.

## Known Limitations

- **Each parallel worker needs its own account.** Adding workers means adding accounts to `src/test-data/users.json` (same password), or the run stops.
- **Scenarios on one worker run in sequence,** so they share that worker's cart. Scenarios that need an empty cart or an order must set that up themselves.
- **Schema checks are hand-written**, with no schema library.
- **Search and price filters on the dashboard** are not tested: typing in them doesn't change the product list in this app.
- **Known defect:** malformed JSON returns 500 instead of 400. See below.

## Known defect

The login endpoint returns HTTP 500 for malformed JSON, where it should return 400. The scenario is tagged `@known-defect` in `src/features/api.feature`. It's excluded from normal runs, so the suite stays green while the bug exists. Run it on purpose to see the failure:

```bash
INCLUDE_KNOWN_DEFECTS=1 npx cucumber-js --tags @known-defect
```

When the app is fixed, remove the `@known-defect` tag so the scenario runs with the rest.
