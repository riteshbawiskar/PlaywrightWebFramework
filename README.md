# PlaywrightWebFramework

A Playwright + TypeScript web UI automation framework. Built as a standalone counterpart to `WebAutomationFramework` (the Java/Selenium/Cucumber project) — same test coverage, different tool, for direct comparison.

There are **two testing styles**, side by side, mirroring the Java project exactly:

- Plain Playwright tests (`tests/*.spec.ts`)
- Cucumber BDD scenarios in Gherkin (`features/*.feature` + `src/steps/*.steps.ts`)

For a plain-English, beginner-friendly walkthrough of how everything fits together (with flowcharts and a "why" explanation for every component), see [`PlaywrightWebFramework_Explained.txt`](./PlaywrightWebFramework_Explained.txt).

## Features

- **Page Object Model** — `src/pages/GoogleSearchPage.ts`
- **Externalized configuration** — `config/config.json` (base URL, browser, headless, timeouts, retries)
- **Automatic retry on failure** — configurable via `config.json` → `retries`
- **Built-in parallel execution** — Playwright runs tests in parallel by default
- **Automatic screenshot, video, and trace capture on failure** — no custom code needed, Playwright does this natively (plain tests); Cucumber scenarios capture a screenshot via an `After` hook and attach it to the Cucumber report
- **HTML reports** — one for plain Playwright tests, one for Cucumber scenarios

## Tech Stack

| Tool | Purpose |
|---|---|
| TypeScript | Language |
| Playwright Test | Browser automation + test runner + assertions (plain tests) |
| Cucumber.js | BDD runner (Gherkin `.feature` files + step definitions) |
| cucumber-html-reporter | Converts Cucumber's JSON output into an HTML report |
| ts-node | Lets Cucumber.js load TypeScript step definitions directly |
| Node.js / npm | Runtime & package management |

## Project Structure

```
config/
└── config.json                    # baseUrl, browser, headless, timeouts, retries

features/
└── GoogleSearch.feature           # Gherkin scenarios (BDD)

src/
├── pages/
│   └── GoogleSearchPage.ts        # Page Object for the Google home page (shared by both styles)
├── utils/
│   └── configReader.ts            # Typed loader for config.json
├── steps/
│   └── googleSearch.steps.ts      # Step definitions behind the Gherkin sentences
└── support/
    ├── world.ts                   # Cucumber's "World" - holds the browser/page per scenario
    └── hooks.ts                   # Before/After hooks: open/close browser, screenshot on failure

tests/
└── googleSearch.spec.ts           # Plain Playwright test scenarios

scripts/
└── generateCucumberReport.js      # Converts cucumber-report.json -> HTML

playwright.config.ts               # Playwright runner config (parallelism, reporters, retries)
cucumber.js                        # Cucumber.js runner config (step/support file globs, output format)
tsconfig.json
```

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
npx playwright install chromium
```

## Configuration

Edit `config/config.json`:

```json
{
  "baseUrl": "https://www.google.com",
  "browser": "chromium",
  "headless": false,
  "actionTimeoutMs": 10000,
  "navigationTimeoutMs": 30000,
  "retries": 1
}
```

## Running the Tests

### Plain Playwright tests

```bash
npm test
```

Run with the browser visible:

```bash
npm run test:headed
```

Open the last HTML report:

```bash
npm run report
```

### Cucumber BDD scenarios

```bash
npm run bdd
```

Generate the HTML report after a run:

```bash
npm run bdd:report
```

## Test Reports & Artifacts

| Artifact | Location |
|---|---|
| Playwright HTML report | `test-output/playwright-report/index.html` |
| Screenshots / videos / traces (failures only, plain tests) | `test-output/test-results/<test-name>/` |
| Cucumber JSON report | `test-output/cucumber-reports/cucumber-report.json` |
| Cucumber HTML report | `test-output/cucumber-reports/cucumber-report.html` (screenshots on failure embedded inside) |

## Current Test Coverage

Both `tests/googleSearch.spec.ts` (plain Playwright) and `features/GoogleSearch.feature` (Cucumber) cover the same 11 scenarios, mirroring the Java framework's Google Search suite: 9 passing checks (home page title, search box behavior with various inputs, query overwrite, etc.) plus 2 intentional "demo failure" scenarios, clearly labeled in their assertion messages, used to verify failure reporting/screenshots/retries work end-to-end.

## Adding a New Test

**Plain Playwright style:**
1. New page? Add a Page Object class under `src/pages/`, following `GoogleSearchPage.ts`.
2. New test? Add a `test(...)` block to a `.spec.ts` file under `tests/`, using the relevant Page Object.

**Cucumber BDD style:**
1. New page? Same Page Object as above — it's shared between both styles.
2. New scenario? Add it to a `.feature` file under `features/`, using existing step sentences where possible.
3. New step sentence? Add a matching `Given`/`When`/`Then` in a `*.steps.ts` file under `src/steps/`, using `this.googleSearchPage` (or a new page object) via the shared `CustomWorld`.
