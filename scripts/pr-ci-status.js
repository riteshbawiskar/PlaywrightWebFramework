// Writes the latest CI result for a pull request into its description.
// The section sits between two marker lines and is replaced on every run,
// so the description always shows the current result, never a stale one.
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

function sectionFor(run) {
  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const header = `### CI status`;
  if (!run) {
    return [START, header, '', `No CI run for commit \`${pr.headRefOid.slice(0, 7)}\` yet. Last checked: ${stamp}.`, END].join('\n');
  }
  if (run.status !== 'completed') {
    return [
      START, header, '',
      `Run [#${run.databaseId}](${run.url}) is **${run.status}** for commit \`${pr.headRefOid.slice(0, 7)}\`. Last checked: ${stamp}.`,
      END,
    ].join('\n');
  }

  const jobsData = gh('run', 'view', String(run.databaseId), '--json', 'jobs');
  const rows = [];
  for (const job of jobsData.jobs || []) {
    for (const step of job.steps || []) {
      if (step.conclusion === 'skipped' || !step.name) continue;
      rows.push(`| ${step.name} | ${step.conclusion} |`);
    }
  }

  const verdict = run.conclusion === 'success' ? '**PASS**' : `**${run.conclusion.toUpperCase()}**`;
  return [
    START, header, '',
    `Latest run: [#${run.databaseId}](${run.url}) on commit \`${run.headSha.slice(0, 7)}\`. Result: ${verdict}. Checked: ${stamp}.`,
    '',
    '| Step | Result |',
    '|---|---|',
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
  console.log(`Updated CI status on ${pr.url}`);
} finally {
  fs.unlinkSync(tmp);
}
