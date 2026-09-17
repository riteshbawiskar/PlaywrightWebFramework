const reporter = require('cucumber-html-reporter');

reporter.generate({
  theme: 'bootstrap',
  jsonFile: 'test-output/cucumber-reports/cucumber-report.json',
  output: 'test-output/cucumber-reports/cucumber-report.html',
  reportSuiteAsScenarios: true,
  launchReport: false,
  ignoreBadJsonFile: true,
});
