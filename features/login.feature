Feature: Login

  Scenario: Login page shows the email and password fields
    Given the user is on the login page
    Then the email field should be visible
    And the password field should be visible

  Scenario: Successful login with valid credentials
    Given the user is on the login page
    When the user logs in with valid credentials
    Then the user should be on the dashboard

  Scenario: Login fails with invalid credentials
    Given the user is on the login page
    When the user logs in with email "invalid.user@example.com" and password "WrongPass@123"
    Then the message "Incorrect email or password." should be displayed

  Scenario: Login page has the expected title
    Given the user is on the login page
    Then the page title should be "Let's Shop"

  Scenario: Email field shows the placeholder "email@example.com"
    Given the user is on the login page
    Then the email field should show the placeholder "email@example.com"

  Scenario: Login page offers a Register link
    Given the user is on the login page
    Then the login page should have a "Register" link

  Scenario: Login page offers a Forgot password link
    Given the user is on the login page
    Then the login page should have a "Forgot password?" link

  Scenario: Login button is visible
    Given the user is on the login page
    Then the login button should be visible
