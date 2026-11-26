// Writes the latest CI test results for a pull request into its description.
// Reports the test suites (Playwright and Cucumber) and a before-and-after summary
// against the latest completed run on main. The section sits between two marker
// lines and is replaced on every run, so the description always shows the current result.
//
// Requires the GitHub CLI (gh), logged in to the account that owns the repo.
//
// Usage:
//   node scripts/pr-ci-status.js <pr-number>             update the PR description
//   node scripts/pr-ci-status.js <pr-number> --dry-run   print the section, change nothing

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const START = '<!-- ci-status:start -->';
const END = '<!-- ci-status:end -->';
const BASE_BRANCH = 'main';

// Test suites to report. `step` must match the workflow step name in ci.yml exactly.
const SUITES = [
  { label: 'Playwright (UI + API)', step: 'Run Playwright tests (UI and API)', parse: parsePlaywright },
  { label: 'Cucumber (BDD)', step: 'Run Cucumber BDD scenarios', parse: parseCucumber },
];

const args = process.argv.slice(2);
const prNumber = args.find((a) => /^\d+$/.test(a));
const dryRun = args.includes('--dry-run');

if (!prNumber) {
  console.error('Usage: node scripts/pr-ci-status.js <pr-number> [--dry-run]');
  process.exit(1);
}

function gh(...cliArgs) {
  return JSON.parse(execFileSync('gh', cliArgs, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }));
}

function ghText(...cliArgs) {
  return execFileSync('gh', cliArgs, { encoding: 'utf8', maxBuffer: 200 * 1024 * 1024 });
}

const pr = gh('pr', 'view', prNumber, '--json', 'number,url,body,headRefName,headRefOid,title');

const runFields = 'databaseId,event,status,conclusion,headSha,url,createdAt,displayTitle';
const prRuns = gh('run', 'list', '--branch', pr.headRefName, '--json', runFields, '--limit', '20');

// Prefer the pull_request run for the exact head commit. Fall back to any run for that commit.
const forHead = prRuns.filter((r) => r.headSha === pr.headRefOid);
// In CI, the workflow passes its own run id, so the report always describes the run that started it.
const inCi = Boolean(process.env.RUN_ID);
const run = inCi
  ? gh('run', 'view', process.env.RUN_ID, '--json', 'databaseId,status,conclusion,headSha,url,event')
  : forHead.find((r) => r.event === 'pull_request') || forHead[0];

// Baseline: the latest completed run on the base branch, which is the code this PR builds on.
const baseRuns = gh('run', 'list', '--branch', BASE_BRANCH, '--json', runFields, '--limit', '20');
const baseRun = baseRuns.find((r) => r.status === 'completed' && r.headSha !== pr.headRefOid);

const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
const commit = pr.headRefOid.slice(0, 7);

// Strips ANSI colour codes that gh log output can contain.
function clean(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

// Returns the log messages that belong to one workflow step.
// gh log lines look like: "<job>\t<step>\t<timestamp> <message>".
function stepMessages(logText, stepName) {
  return clean(logText)
    .split('\n')
    .map((line) => line.split('\t'))
    .filter((parts) => parts[1] === stepName)
    .map((parts) => parts.slice(2).join('\t').replace(/^\S+\s/, ''));
}

// Playwright prints a summary such as "14 passed (21s)" with optional "1 failed", "1 skipped".
function parsePlaywright(messages) {
  const count = (label) => {
    const hit = messages.map((m) => m.match(new RegExp(`^\\s*(\\d+) ${label}\\b`))).find(Boolean);
    return hit ? Number(hit[1]) : 0;
  };
  return { passed: count('passed'), failed: count('failed'), skipped: count('skipped') };
}

// Cucumber prints "9 scenarios (6 passed, 3 failed)". Skipped scenarios appear as "N skipped".
function parseCucumber(messages) {
  const line = messages.map((m) => m.match(/(\d+) scenarios \((.*)\)/)).find(Boolean);
  if (!line) return null;
  const parts = line[2];
  const count = (label) => {
    const hit = parts.match(new RegExp(`(\\d+) ${label}`));
    return hit ? Number(hit[1]) : 0;
  };
  return { passed: count('passed'), failed: count('failed'), skipped: count('skipped') };
}

function durationMs(step) {
  // gh returns camelCase timestamps (startedAt / completedAt).
  if (!step || !step.startedAt || !step.completedAt) return null;
  return new Date(step.completedAt) - new Date(step.startedAt);
}

function formatDuration(ms) {
  if (ms === null) return '—';
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;
}

// Reads one completed run: per-suite counts, durations, and the overall conclusion.
function readRun(runInfo) {
  const jobsData = gh('run', 'view', String(runInfo.databaseId), '--json', 'jobs');
  const steps = (jobsData.jobs || []).flatMap((job) => job.steps || []);
  const logText = ghText('run', 'view', String(runInfo.databaseId), '--log');

  const suites = SUITES.map((suite) => {
    const step = steps.find((s) => s.name === suite.step);
    const counts = step ? suite.parse(stepMessages(logText, suite.step)) : null;
    return { suite, step, counts, ms: durationMs(step) };
  });

  const totals = suites.reduce(
    (acc, s) => {
      if (s.counts) {
        acc.passed += s.counts.passed;
        acc.failed += s.counts.failed;
        acc.skipped += s.counts.skipped;
      }
      if (s.ms !== null) acc.ms += s.ms;
      return acc;
    },
    { passed: 0, failed: 0, skipped: 0, ms: 0 },
  );
  totals.total = totals.passed + totals.failed + totals.skipped;

  // The overall conclusion comes from the "test" job. In CI the workflow run is still
  // in progress while this report job runs, so the run's own conclusion is not final yet.
  const testJob = (jobsData.jobs || []).find((j) => j.name === 'test');
  const conclusion = testJob && testJob.conclusion ? testJob.conclusion : runInfo.conclusion;

  return { info: { ...runInfo, conclusion }, suites, totals };
}

function pct(part, total) {
  return total === 0 ? '—' : `${((part / total) * 100).toFixed(1)}%`;
}

function suiteRow(s) {
  const result = s.step ? (s.step.conclusion === 'success' ? '✅ pass' : `❌ ${s.step.conclusion}`) : '— not run';
  if (!s.counts) {
    return `| ${s.suite.label} | ${result} | — | — | — | ${formatDuration(s.ms)} |`;
  }
  return `| ${s.suite.label} | ${result} | ${s.counts.passed} | ${s.counts.failed} | ${s.counts.skipped} | ${formatDuration(s.ms)} |`;
}

function summaryRows(current, base) {
  const newAdditions = base ? Math.max(0, current.totals.total - base.totals.total) : null;
  const rowFor = (label, r, added) => {
    const t = r.totals;
    const verdict = r.info.conclusion === 'success' ? '✅ PASS' : `❌ ${String(r.info.conclusion).toUpperCase()}`;
    return `| ${label} | ${t.total} | ${added} | ${t.passed} | ${t.failed} | ${t.skipped} | ${pct(t.passed, t.total)} | ${pct(t.failed, t.total)} | ${formatDuration(t.ms)} | ${verdict} |`;
  };
  const rows = [];
  if (base) {
    rows.push(rowFor(`Before: main (${base.info.headSha.slice(0, 7)})`, base, '—'));
  } else {
    rows.push('| Before: main | — | — | — | — | — | — | — | — | No completed run on main |');
  }
  rows.push(rowFor(`This PR: #${pr.number} ${pr.title} (${commit})`, current, newAdditions === null ? '—' : newAdditions));
  return rows;
}

function sectionFor(run) {
  if (!run) {
    return [START, '### CI test results', '', `No CI run for commit \`${commit}\` yet. Last checked: ${stamp}.`, END].join('\n');
  }
  // The run is finished when the test job is done. In CI the report job runs inside
  // the same run, so the run's own status is not final yet.
  const jobsNow = gh('run', 'view', String(run.databaseId), '--json', 'jobs').jobs || [];
  const testNow = jobsNow.find((j) => j.name === 'test');
  const finished = inCi ? Boolean(testNow && testNow.status === 'completed') : run.status === 'completed';
  if (!finished) {
    const state = inCi && testNow ? testNow.status : run.status;
    return [
      START, '### CI test results', '',
      `**ci-run** [#${run.databaseId}](${run.url}) is **${state}** for commit \`${commit}\`. Last updated: ${stamp}.`,
      END,
    ].join('\n');
  }

  const current = readRun(run);
  const base = baseRun ? readRun(baseRun) : null;
  const verdict = current.info.conclusion === 'success' ? '**PASS**' : `**${String(current.info.conclusion).toUpperCase()}**`;

  return [
    START,
    '### CI test results',
    '',
    `**ci-run** [#${run.databaseId}](${run.url}) on commit \`${run.headSha.slice(0, 7)}\`. Overall: ${verdict}. Last updated: ${stamp}.`,
    '',
    '#### Suites',
    '',
    '| Suite | Result | Passed | Failed | Skipped | Duration |',
    '|---|---|---|---|---|---|',
    ...current.suites.map(suiteRow),
    '',
    '#### Before and after this PR',
    '',
    '| Run | Total test cases | New additions | Passed | Failed | Skipped | Pass % | Fail % | Total duration | Result |',
    '|---|---|---|---|---|---|---|---|---|---|',
    ...summaryRows(current, base),
    END,
  ].join('\n');
}

const section = sectionFor(run);

// Replace the existing section if there is one; otherwise append it.
const body = pr.body || '';
const pattern = new RegExp(`${START}[\\s\\S]*?${END}`);
const newBody = pattern.test(body)
  ? body.replace(pattern, section)
  : `${body.trimEnd()}\n\n${section}\n`;

if (dryRun) {
  console.log(section);
  process.exit(0);
}

const tmp = path.join(os.tmpdir(), `pr-${prNumber}-body-${Date.now()}.md`);
fs.writeFileSync(tmp, newBody);
try {
  execFileSync('gh', ['pr', 'edit', prNumber, '--body-file', tmp], { stdio: 'inherit' });
  console.log(`Updated CI test results on ${pr.url}`);
} finally {
  fs.unlinkSync(tmp);
}
