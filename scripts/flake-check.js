#!/usr/bin/env node
// Runs the Cucumber suite several times and reports scenarios that do not pass every time.
//
// Usage:
//   npm run flake            # 5 runs
//   node scripts/flake-check.js 10   # 10 runs
//
// Output: test-output/flake/flake-report.md and flake-summary.json.
// Exit code 1 if any scenario failed in any run, so this can gate a pipeline later.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const runs = Number(process.argv[2] ?? 5);
if (!Number.isInteger(runs) || runs < 2) {
  console.error('The run count must be a whole number, 2 or more.');
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'test-output', 'flake');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// Step results that count as a failed scenario. Anything else (passed, skipped) does not.
const FAILING_STATUSES = new Set(['failed', 'undefined', 'ambiguous', 'pending']);

// One entry per scenario, keyed by feature file and line, so Scenario Outline rows stay separate.
const scenarios = new Map();

for (let i = 1; i <= runs; i++) {
  const reportFile = path.join(outDir, `run-${i}.json`);
  console.log(`\nRun ${i} of ${runs}`);

  spawnSync('npx', ['cucumber-js', '--format', `json:${reportFile}`, '--format', 'progress'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, HEADLESS: 'true' },
  });

  if (!fs.existsSync(reportFile)) {
    console.error(`Run ${i} wrote no report, so the comparison cannot continue.`);
    process.exit(1);
  }

  const features = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
  for (const feature of features) {
    for (const scenario of feature.elements ?? []) {
      if (scenario.type !== 'scenario') continue;
      const key = `${feature.uri}:${scenario.line}`;
      const statuses = (scenario.steps ?? []).map((step) => step.result?.status ?? 'undefined');
      const failed = statuses.some((status) => FAILING_STATUSES.has(status));

      if (!scenarios.has(key)) {
        scenarios.set(key, {
          feature: feature.name,
          name: scenario.name,
          passes: 0,
          fails: 0,
        });
      }
      const entry = scenarios.get(key);
      if (failed) entry.fails += 1;
      else entry.passes += 1;
    }
  }
}

// Classify each scenario.
const rows = [...scenarios.values()].map((s) => {
  const total = s.passes + s.fails;
  let verdict = 'stable pass';
  if (s.fails === total) verdict = 'always fails';
  else if (s.fails > 0) verdict = 'FLAKY';
  return { ...s, total, verdict };
});

const scenarioRuns = rows.reduce((sum, r) => sum + r.total, 0);
const failedScenarioRuns = rows.reduce((sum, r) => sum + r.fails, 0);
const flaky = rows.filter((r) => r.verdict === 'FLAKY');
const alwaysFailing = rows.filter((r) => r.verdict === 'always fails');
const failRate = scenarioRuns === 0 ? 0 : (failedScenarioRuns / scenarioRuns) * 100;

const summary = {
  runs,
  scenarios: rows.length,
  scenarioRuns,
  failedScenarioRuns,
  failRatePercent: Number(failRate.toFixed(1)),
  flakyScenarios: flaky.length,
  alwaysFailingScenarios: alwaysFailing.length,
  results: rows,
};
fs.writeFileSync(path.join(outDir, 'flake-summary.json'), JSON.stringify(summary, null, 2));

const lines = [
  '# Flake check',
  '',
  `Runs: ${runs}. Scenarios: ${rows.length}. Scenario runs: ${scenarioRuns}.`,
  '',
  `| Measure | Value |`,
  `|---|---|`,
  `| Failed scenario runs | ${failedScenarioRuns} of ${scenarioRuns} (${failRate.toFixed(1)}%) |`,
  `| Flaky scenarios (passed some runs, failed others) | ${flaky.length} |`,
  `| Scenarios that failed every run | ${alwaysFailing.length} |`,
  '',
];
if (flaky.length || alwaysFailing.length) {
  lines.push('| Verdict | Feature | Scenario | Passed | Failed |', '|---|---|---|---|---|');
  for (const r of [...alwaysFailing, ...flaky]) {
    lines.push(`| ${r.verdict} | ${r.feature} | ${r.name} | ${r.passes} | ${r.fails} |`);
  }
} else {
  lines.push('No scenario failed in any run.');
}
fs.writeFileSync(path.join(outDir, 'flake-report.md'), lines.join('\n') + '\n');

console.log(`\nFlake check: ${failedScenarioRuns} failed of ${scenarioRuns} scenario runs (${failRate.toFixed(1)}%).`);
console.log(`Flaky: ${flaky.length}. Always failing: ${alwaysFailing.length}.`);
console.log(`Report: ${path.join(outDir, 'flake-report.md')}`);

process.exit(failedScenarioRuns > 0 ? 1 : 0);
