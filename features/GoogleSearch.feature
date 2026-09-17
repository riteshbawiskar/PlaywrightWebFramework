Feature: Google Search

  Scenario: Verify Google home page title
    Given the user navigates to the Google home page
    Then the page title should contain "Google"

  Scenario: Search for a term on Google
    Given the user navigates to the Google home page
    When the user searches for "Selenium WebDriver"
    Then the search box should not be empty

  Scenario: Search box rejects an unexpected value
    Given the user navigates to the Google home page
    When the user searches for "Selenium WebDriver"
    Then the search box value should equal "this value will never match"

  Scenario: Search box is empty on a fresh page load
    Given the user navigates to the Google home page
    Then the search box should be empty

  Scenario: Search box retains the exact typed query
    Given the user navigates to the Google home page
    When the user searches for "Appium mobile testing"
    Then the search box value should equal "Appium mobile testing"

  Scenario: Page title does not change while typing
    Given the user navigates to the Google home page
    When the user searches for "Cucumber BDD framework"
    Then the page title should still contain "Google"

  Scenario: Search box accepts special characters
    Given the user navigates to the Google home page
    When the user searches for "TestNG @Test annotation!"
    Then the search box value should equal "TestNG @Test annotation!"

  Scenario: Search box accepts numeric input
    Given the user navigates to the Google home page
    When the user searches for "Selenium 4 25 0"
    Then the search box value should equal "Selenium 4 25 0"

  Scenario: Home page title is exactly Google
    Given the user navigates to the Google home page
    Then the page title should equal "this title will never match"

  Scenario: Search box overwrites the previous query
    Given the user navigates to the Google home page
    When the user searches for "first query"
    And the user searches for "second query"
    Then the search box value should equal "second query"

  Scenario: Home page title is not empty
    Given the user navigates to the Google home page
    Then the page title should not be empty
