// Runs Playwright tests N times with retries disabled and reports, per test,
// how many runs passed and failed. Retries are off so a test that needs a retry
// is counted as flaky instead of silently passing.
//
// Usage:
//   node scripts/flakiness-report.js [runs=10] [test files or folders...]
// Example:
//   node scripts/flakiness-report.js 10 tests/login.spec.ts tests/products.spec.ts
//
// Output: a table in the terminal and a JSON file in test-output/flakiness/.

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const runs = parseInt(process.argv[2] || '10', 10);
const targets = process.argv.slice(3);

if (Number.isNaN(runs) || runs < 1) {
  console.error('First argument must be a positive number of runs.');
  process.exit(1);
}

const outDir = path.join(process.cwd(), 'test-output', 'flakiness');
fs.mkdirSync(outDir, { recursive: true });
const jsonFile = path.join(outDir, `run-${Date.now()}.json`);

// WORKERS=1 runs one test at a time. Useful to check whether failures come from
// tests interfering with each other through shared state.
const workerArgs = process.env.WORKERS ? [`--workers=${process.env.WORKERS}`] : [];
const args = ['playwright', 'test', ...targets, `--repeat-each=${runs}`, '--retries=0', ...workerArgs, '--reporter=json'];
console.log(`Running: npx ${args.join(' ')}`);

const result = spawnSync('npx', args, {
  stdio: ['ignore', 'pipe', 'inherit'],
  env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: jsonFile, HEADLESS: process.env.HEADLESS || 'true' },
  maxBuffer: 50 * 1024 * 1024,
});

// Playwright exits non-zero when a test fails, which is expected here.
if (!fs.existsSync(jsonFile)) {
  console.error('No JSON report was produced. Check the Playwright output above.');
  process.exit(result.status || 1);
}

const report = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
const stats = new Map();

function walk(suite, parentTitle) {
  const title = [parentTitle, suite.title].filter(Boolean).join(' › ');
  for (const spec of suite.specs || []) {
    const key = [title, spec.title].filter(Boolean).join(' › ');
    if (!stats.has(key)) {
      stats.set(key, { passed: 0, failed: 0 });
    }
    const entry = stats.get(key);
    for (const test of spec.tests) {
      for (const run of test.results) {
        if (run.status === 'passed') entry.passed++;
        else if (run.status !== 'skipped') entry.failed++;
      }
    }
  }
  for (const child of suite.suites || []) {
    walk(child, title);
  }
}

for (const suite of report.suites || []) {
  walk(suite, '');
}

let totalRuns = 0;
let totalFailed = 0;
const rows = [];
for (const [name, s] of stats) {
  const total = s.passed + s.failed;
  const failPct = total === 0 ? 0 : Math.round((s.failed / total) * 100);
  totalRuns += total;
  totalFailed += s.failed;
  // Flaky = the same test both passed and failed across the repeated runs.
  const flaky = s.passed > 0 && s.failed > 0;
  rows.push({ test: name, runs: total, passed: s.passed, failed: s.failed, failPct, flaky });
}

console.log('\nFlakiness report');
console.table(rows.map(({ test, runs: r, passed, failed, failPct, flaky }) => ({
  test,
  runs: r,
  passed,
  failed,
  'fail %': `${failPct}%`,
  flaky: flaky ? 'YES' : 'no',
})));

const overallPct = totalRuns === 0 ? 0 : Math.round((totalFailed / totalRuns) * 100);
console.log(`Overall: ${totalFailed} failed out of ${totalRuns} runs (${overallPct}%)`);

const summary = { generatedAt: new Date().toISOString(), runsPerTest: runs, targets, overall: { totalRuns, totalFailed, overallPct }, tests: rows };
const summaryFile = path.join(outDir, `summary-${Date.now()}.json`);
fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
console.log(`Summary saved to ${summaryFile}`);
