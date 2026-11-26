module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: ['src/support/**/*.ts', 'src/steps/**/*.ts'],
    format: [
      'summary',
      'progress-bar',
      'json:test-output/cucumber-reports/cucumber-report.json',
    ],
    paths: ['features/**/*.feature'],
    // @known-defect scenarios document a bug and are excluded from normal runs.
    // To run them on demand: INCLUDE_KNOWN_DEFECTS=1 npx cucumber-js --tags @known-defect
    tags: process.env.INCLUDE_KNOWN_DEFECTS ? '' : 'not @known-defect',
    publishQuiet: true,
  },
};
