# Feature guide

One page per feature in this framework. Each page answers four questions:

1. **Why** we added it: the problem it solves.
2. **Purpose:** what it does and how it works, with a flowchart.
3. **What changed** after we added it: the measurable effect, and what was not solved.
4. **Where** the code lives.

| Feature | Why it exists | Page |
|---|---|---|
| Cucumber BDD scenarios | Readable test cases that a manager or tester can check | [bdd-cucumber.md](bdd-cucumber.md) |
| Page Objects and shared flows | One place to change a locator or a journey | [page-objects-and-flows.md](page-objects-and-flows.md) |
| API tests | Check the backend directly, without the browser | [api-tests.md](api-tests.md) |
| Known-defect tag | Record a real bug without turning the build red | [known-defect-tag.md](known-defect-tag.md) |
| Parallel workers and test accounts | Run scenarios at the same time without sharing a cart | [parallel-workers.md](parallel-workers.md) |
| Flake check | Measure which scenarios are unstable, instead of guessing | [flake-check.md](flake-check.md) |
| CI pipeline (`ci-run`) | Run the suite on every push and pull request | [ci-pipeline.md](ci-pipeline.md) |
| PR results table | Show the latest results in the pull request itself | [pr-results-table.md](pr-results-table.md) |
| AI usage and cost log | Put a token and dollar cost next to each AI-assisted task | [ai-usage-log.md](ai-usage-log.md) |
| Generated test data (Faker) | Test rules with fake, PII-safe data that can be repeated | [generated-test-data.md](generated-test-data.md) |

Start with the README in the repository root for setup and commands.
