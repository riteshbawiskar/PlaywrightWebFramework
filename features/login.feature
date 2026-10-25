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
