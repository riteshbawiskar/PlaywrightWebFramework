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
    publishQuiet: true,
  },
};
