#!/usr/bin/env node
// Fixes failing ci-run tests on a pull request, on your own machine, with your Claude Code login.
//
// Usage (the GitHub token must be the personal account that owns this repository):
//   GH_TOKEN=$(gh auth token -u riteshbawiskar) node scripts/auto-fix.js <pr-number>
//   Add --no-push to commit locally without pushing (for a dry run).
//
// What it does:
//   1. Finds the failed ci-run on the pull request's current commit.
//   2. Checks out the pull request branch and reads the end of the failing log.
//   3. Asks Claude Code to fix test code, then re-runs the suite itself to confirm.
//   4. Keeps only changes in src/steps, src/pages, src/api, src/flows, src/utils.
//      Anything else Claude changed is reverted. Files you created are never deleted.
//   5. Commits as "auto-fix: attempt N" and pushes, which starts a new ci-run.
//   6. Stops after three auto-fix commits in a row on the branch.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const prNumber = args.find((a) => /^\d+$/.test(a));
const noPush = args.includes('--no-push');

const MAX_ATTEMPTS = 3;
const MODEL = process.env.AI_MODEL || 'claude-sonnet-5-5';
const ALLOWED = /^src\/(steps|pages|api|flows|utils)\//;
const workDir = path.join(root, 'test-output', 'auto-fix');
const usageFile = path.join(root, 'docs', 'ai-usage', 'usage-log.csv');

function run(cmd, cmdArgs, options = {}) {
  const result = spawnSync(cmd, cmdArgs, { cwd: root, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024, ...options });
  return { ok: result.status === 0, status: result.status, out: (result.stdout ?? '').trim(), err: (result.stderr ?? '').trim() };
}

function die(message) {
  console.error(`\nauto-fix stopped: ${message}`);
  process.exit(1);
}

function git(...gitArgs) {
  return run('git', gitArgs);
}

function gh(...ghArgs) {
  return run('gh', ghArgs);
}

// Records one call in the usage log, the same file scripts/ai-usage.js writes.
function recordUsage(task, result) {
  const header = 'timestamp,task,model,input_tokens,output_tokens,cache_read_tokens,cache_creation_tokens,cost_usd,duration_ms,is_error';
  const usage = result.usage ?? {};
  const cells = [
    new Date().toISOString(),
    task,
    MODEL,
    usage.input_tokens ?? 0,
    usage.output_tokens ?? 0,
    usage.cache_read_input_tokens ?? 0,
    usage.cache_creation_input_tokens ?? 0,
    result.total_cost_usd ?? 0,
    result.duration_ms ?? 0,
    result.is_error ? 'yes' : 'no',
  ].map((c) => {
    const text = String(c);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  });
  fs.mkdirSync(path.dirname(usageFile), { recursive: true });
  if (!fs.existsSync(usageFile)) fs.writeFileSync(usageFile, header + '\n');
  fs.appendFileSync(usageFile, cells.join(',') + '\n');
}

// ---- 1. Preconditions ----------------------------------------------------------------
if (!prNumber) die('give the pull request number, for example: node scripts/auto-fix.js 12');
if (!process.env.GH_TOKEN) {
  die('set GH_TOKEN to the personal account token: GH_TOKEN=$(gh auth token -u riteshbawiskar) node scripts/auto-fix.js ' + prNumber);
}
if (git('status', '--porcelain', '--untracked-files=no').out) {
  die('you have uncommitted changes to tracked files. Commit or stash them first.');
}

// ---- 2. Find the failed run on the current head ---------------------------------------
const pr = JSON.parse(gh('pr', 'view', prNumber, '--json', 'state,headRefName,headRefOid').out || '{}');
if (!pr.headRefName) die(`could not read pull request #${prNumber}`);
if (pr.state !== 'OPEN') die(`pull request #${prNumber} is ${pr.state}, not open`);

const runs = JSON.parse(
  gh('run', 'list', '--branch', pr.headRefName, '--workflow', 'ci-run', '--json', 'databaseId,conclusion,headSha', '--limit', '10').out || '[]',
);
const failed = runs.find((r) => r.headSha === pr.headRefOid && r.conclusion === 'failure');
if (!failed) die(`no failed ci-run on the current head ${pr.headRefOid.slice(0, 7)} of #${prNumber}`);
console.log(`Failed run ${failed.databaseId} on ${pr.headRefName} @ ${pr.headRefOid.slice(0, 7)}`);

// ---- 3. Check out the branch and count attempts --------------------------------------
const original = git('rev-parse', '--abbrev-ref', 'HEAD').out;
git('fetch', 'origin', pr.headRefName);
const hasLocal = git('show-ref', '--verify', '--quiet', `refs/heads/${pr.headRefName}`).ok;
if (hasLocal) {
  if (!git('checkout', pr.headRefName).ok) die(`could not switch to ${pr.headRefName}`);
  if (!git('merge', '--ff-only', `origin/${pr.headRefName}`).ok) die(`${pr.headRefName} has diverged from origin. Resolve it by hand.`);
} else if (!git('checkout', '-b', pr.headRefName, '--track', `origin/${pr.headRefName}`).ok) {
  die(`could not create ${pr.headRefName} from origin`);
}

const recent = git('log', '-n', '10', '--format=%s').out.split('\n');
let attempts = 0;
for (const subject of recent) {
  if (subject.startsWith('auto-fix:')) attempts += 1;
  else break;
}
if (attempts >= MAX_ATTEMPTS) {
  die(`${attempts} auto-fix commits already in a row on ${pr.headRefName}. Fix it by hand.`);
}
const attempt = attempts + 1;
console.log(`Attempt ${attempt} of ${MAX_ATTEMPTS}`);

// ---- 4. Save the failing log and ask Claude -------------------------------------------
fs.mkdirSync(workDir, { recursive: true });
const logText = gh('run', 'view', String(failed.databaseId), '--log-failed').out;
const logPath = path.join(workDir, `failure-${failed.databaseId}.log`);
fs.writeFileSync(logPath, logText.slice(-60000));

const prompt = [
  `A pull request CI run failed. The end of its log is in the file ${logPath}. Read it first.`,
  '',
  'Your job:',
  '1. Find the failing scenario and step in the log.',
  '2. Fix the cause in the test code: step definitions (src/steps), page objects (src/pages), API client (src/api), flows (src/flows), or utilities (src/utils).',
  '3. Run the suite with: npm run bdd. Repeat until it passes, or stop after three tries and explain why.',
  '',
  'Rules:',
  '- Never skip, tag out, delete, or weaken a scenario or an assertion. Do not edit src/features or src/test-data.',
  '- Never edit .github, cucumber.js, package.json, config, or anything under .claude.',
  '- If the failure is a real application bug, do not hide it in the test. Say so.',
  '- Do not commit or push. Keep each change small and explain it in one line.',
].join('\n');

console.log(`Asking Claude (${MODEL}). This can take a few minutes.`);
const claude = run(
  'claude',
  [
    '-p',
    prompt,
    '--model',
    MODEL,
    '--output-format',
    'json',
    '--permission-mode',
    'acceptEdits',
    '--allowedTools',
    'Read',
    'Edit',
    'Write',
    'Glob',
    'Grep',
    'Bash(npm run bdd)',
    'Bash(npx cucumber-js:*)',
    'Bash(git diff:*)',
    'Bash(git status:*)',
  ],
  { env: { ...process.env, HEADLESS: 'true', PARALLEL: '4' }, timeout: 20 * 60 * 1000 },
);
let claudeResult;
try {
  claudeResult = JSON.parse(claude.out);
} catch {
  die(`Claude Code did not return JSON. ${claude.err}`);
}
recordUsage(`auto-fix PR #${prNumber} attempt ${attempt}`, claudeResult);
console.log(`Claude used $${Number(claudeResult.total_cost_usd ?? 0).toFixed(4)} on this attempt.`);
if (claudeResult.is_error) die(`Claude returned an error: ${claudeResult.result}`);

// ---- 5. Keep only allowed changes -----------------------------------------------------
const trackedChanged = git('diff', '--name-only').out.split('\n').filter(Boolean);
const newFiles = git('ls-files', '--others', '--exclude-standard', '--', 'src').out.split('\n').filter(Boolean);
// The usage log is written by this script, so its change is kept and committed with the fix.
const USAGE_LOG = 'docs/ai-usage/usage-log.csv';
for (const file of trackedChanged) {
  if (!ALLOWED.test(file) && file !== USAGE_LOG) {
    console.log(`Reverting change outside the allowed folders: ${file}`);
    git('checkout', '--', file);
  }
}
const toCommit = [
  ...trackedChanged.filter((f) => ALLOWED.test(f) || f === USAGE_LOG),
  ...newFiles.filter((f) => ALLOWED.test(f)),
];
for (const file of newFiles) {
  if (!ALLOWED.test(file)) console.log(`Not committing new file outside the allowed folders: ${file}`);
}
if (toCommit.filter((f) => f !== USAGE_LOG).length === 0) {
  die('Claude made no changes in the allowed folders. Nothing to push.');
}

// ---- 6. Confirm the suite passes with the changes ------------------------------------
console.log('Running the suite to confirm the fix...');
const suite = run('npx', ['cucumber-js', '--format', 'summary'], {
  env: { ...process.env, HEADLESS: 'true', PARALLEL: '4' },
  timeout: 20 * 60 * 1000,
});
if (!suite.ok) {
  console.error(suite.out.split('\n').slice(-15).join('\n'));
  die(`the suite still fails after Claude's changes. Changes are left uncommitted on ${pr.headRefName}.`);
}

// ---- 7. Commit, push, and return to where you were -----------------------------------
git('add', '--', ...toCommit);
const commit = git('commit', '-m', `auto-fix: attempt ${attempt} for failed run ${failed.databaseId}`, '-m', 'Changes written by Claude Code from the failing ci-run log. Review before merging.');
if (!commit.ok) die(`commit failed: ${commit.err}`);

if (noPush) {
  console.log('--no-push: committed locally, not pushed.');
} else {
  const push = git('push', 'origin', `HEAD:${pr.headRefName}`);
  if (!push.ok) die(`push failed: ${push.err}`);
  console.log(`Pushed attempt ${attempt} to ${pr.headRefName}. CI will run again on the new commit.`);
}

if (original && original !== 'HEAD' && original !== pr.headRefName) git('checkout', original);
console.log(`Done. Back on ${original || 'the previous branch'}.`);
