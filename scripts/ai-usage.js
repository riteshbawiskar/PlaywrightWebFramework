#!/usr/bin/env node
// Runs one Claude Code call and records its token use and cost in a CSV file.
//
// Usage:
//   node scripts/ai-usage.js run "Fix login locator" "Explain this failing log: ..."
//   node scripts/ai-usage.js summary
//
// The model defaults to claude-haiku-5-5. Set AI_MODEL to use another one.
// Each call's numbers come from Claude Code's own JSON output, not from estimates.
// The prompt text is not stored, because it can contain test logs or other private data.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const logFile = path.join(root, 'docs', 'ai-usage', 'usage-log.csv');
const HEADER = [
  'timestamp',
  'task',
  'model',
  'input_tokens',
  'output_tokens',
  'cache_read_tokens',
  'cache_creation_tokens',
  'cost_usd',
  'duration_ms',
  'is_error',
];

// CSV cell escaping: quote a cell when it holds a comma, quote, or line break.
function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

function run(task, prompt) {
  if (!task || !prompt) {
    console.error('Usage: node scripts/ai-usage.js run "<task label>" "<prompt>"');
    process.exit(1);
  }
  const model = process.env.AI_MODEL || 'claude-haiku-5-5';

  const call = spawnSync('claude', ['-p', prompt, '--model', model, '--output-format', 'json'], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (call.error || call.status !== 0) {
    console.error(`Claude Code call failed: ${call.error?.message ?? `exit code ${call.status}`}`);
    process.exit(1);
  }

  let result;
  try {
    result = JSON.parse(call.stdout);
  } catch {
    console.error('Claude Code did not return JSON. Nothing was recorded.');
    process.exit(1);
  }

  // A failed call (for example, an unavailable model) is recorded too, so the log
  // does not hide failures.
  const usage = result.usage ?? {};
  const row = [
    new Date().toISOString(),
    task,
    model,
    usage.input_tokens ?? 0,
    usage.output_tokens ?? 0,
    usage.cache_read_input_tokens ?? 0,
    usage.cache_creation_input_tokens ?? 0,
    result.total_cost_usd ?? 0,
    result.duration_ms ?? 0,
    result.is_error ? 'yes' : 'no',
  ];

  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, HEADER.join(',') + '\n');
  }
  fs.appendFileSync(logFile, row.map(csvCell).join(',') + '\n');

  console.log(`Recorded: ${task}`);
  console.log(`  model ${model}: ${row[3]} input, ${row[4]} output tokens, cost $${Number(row[7]).toFixed(4)}`);
  if (result.is_error) {
    console.log(`  The call returned an error: ${result.result}`);
    process.exit(1);
  }
}

function summary() {
  if (!fs.existsSync(logFile)) {
    console.log('No usage recorded yet.');
    return;
  }
  const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
  const rows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(HEADER.map((name, i) => [name, cells[i] ?? '']));
  });

  const ok = rows.filter((r) => r.is_error === 'no');
  const sum = (key) => ok.reduce((total, r) => total + Number(r[key] || 0), 0);
  const cost = sum('cost_usd');
  console.log(`Calls: ${rows.length} (${rows.length - ok.length} failed)`);
  console.log(`Input tokens: ${sum('input_tokens')}  Output tokens: ${sum('output_tokens')}`);
  console.log(`Cache read: ${sum('cache_read_tokens')}  Cache written: ${sum('cache_creation_tokens')}`);
  console.log(`Total cost: $${cost.toFixed(4)}`);
  if (ok.length) {
    console.log(`Average cost per successful call: $${(cost / ok.length).toFixed(4)}`);
  }
}

const [command, ...args] = process.argv.slice(2);
if (command === 'run') run(args[0], args[1]);
else if (command === 'summary') summary();
else {
  console.error('Usage: node scripts/ai-usage.js run "<task>" "<prompt>" | summary');
  process.exit(1);
}
