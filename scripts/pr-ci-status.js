// Writes the latest CI test result for a pull request into its description.
// Only the test suites are reported (Playwright and Cucumber), with pass, fail,
// and skip counts and duration. The section sits between two marker lines and is
// replaced on every run, so the description always shows the current result.
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

const pr = gh('pr', 'view', prNumber, '--json', 'number,url,body,headRefName,headRefOid');

const runs = gh(
  'run', 'list',
  '--branch', pr.headRefName,
  '--json', 'databaseId,event,status,conclusion,headSha,url,createdAt,displayTitle',
  '--limit', '20',
);

// Prefer the pull_request run for the exact head commit. Fall back to any run for that commit.
const forHead = runs.filter((r) => r.headSha === pr.headRefOid);
const run = forHead.find((r) => r.event === 'pull_request') || forHead[0];

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

function durationOf(step) {
  // gh returns camelCase timestamps (startedAt / completedAt).
  if (!step || !step.startedAt || !step.completedAt) return '—';
  const seconds = Math.round((new Date(step.completedAt) - new Date(step.startedAt)) / 1000);
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}m ${s}s`;
}

function sectionFor(run) {
  if (!run) {
    return [START, '### CI test results', '', `No CI run for commit \`${commit}\` yet. Last checked: ${stamp}.`, END].join('\n');
  }
  if (run.status !== 'completed') {
    return [
      START, '### CI test results', '',
      `Run [#${run.databaseId}](${run.url}) is **${run.status}** for commit \`${commit}\`. Last checked: ${stamp}.`,
      END,
    ].join('\n');
  }

  const jobsData = gh('run', 'view', String(run.databaseId), '--json', 'jobs');
  const steps = (jobsData.jobs || []).flatMap((job) => job.steps || []);
  const logText = ghText('run', 'view', String(run.databaseId), '--log');

  const rows = SUITES.map((suite) => {
    const step = steps.find((s) => s.name === suite.step);
    const counts = step ? suite.parse(stepMessages(logText, suite.step)) : null;
    const result = step ? (step.conclusion === 'success' ? '✅ pass' : `❌ ${step.conclusion}`) : '— not run';
    if (!counts) {
      return `| ${suite.label} | ${result} | — | — | — | ${durationOf(step)} |`;
    }
    return `| ${suite.label} | ${result} | ${counts.passed} | ${counts.failed} | ${counts.skipped} | ${durationOf(step)} |`;
  });

  const verdict = run.conclusion === 'success' ? '**PASS**' : `**${String(run.conclusion).toUpperCase()}**`;
  return [
    START,
    '### CI test results',
    '',
    `Run [#${run.databaseId}](${run.url}) on commit \`${run.headSha.slice(0, 7)}\`. Overall: ${verdict}. Checked: ${stamp}.`,
    '',
    '| Suite | Result | Passed | Failed | Skipped | Duration |',
    '|---|---|---|---|---|---|',
    ...rows,
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
