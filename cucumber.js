module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: ['src/support/**/*.ts', 'src/steps/**/*.ts'],
    format: [
      'summary',
      'progress-bar',
      'json:test-output/cucumber-reports/cucumber-report.json',
    ],
    paths: ['src/features/**/*.feature'],
    // @known-defect scenarios document a bug and are excluded from normal runs.
    // To run them on demand: INCLUDE_KNOWN_DEFECTS=1 npx cucumber-js --tags @known-defect
    tags: process.env.INCLUDE_KNOWN_DEFECTS ? '' : 'not @known-defect',
    // Number of parallel workers. Each worker uses its own account from
    // src/test-data/users.json, so the count must not exceed the number of accounts.
    // PARALLEL=1 runs everything in one process (serial).
    parallel: Number(process.env.PARALLEL ?? 4),
    publishQuiet: true,
  },
};
