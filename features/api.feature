Feature: Products API

  Scenario: Login with valid credentials returns a token
    When the client logs in with valid credentials
    Then the response status should be 200
    And the response should contain a token

  Scenario: Login with invalid credentials is rejected
    When the client logs in with email "invalid.user@example.com" and password "WrongPass@123"
    Then the response status should be 400
    And the response message should be "Incorrect email or password."
    And the response should not contain a token

  Scenario: Products request without a token is unauthorized
    When the client requests the products without a token
    Then the response status should be 401

  Scenario: Products request with a token returns a valid product list
    When the client logs in and requests the products
    Then the response status should be 200
    And the response should contain a valid product list

  Scenario: Product list is not empty and every product has a name and price
    When the client logs in and requests the products
    Then the response should contain at least one product
    And every product should have a name and a positive price

  Scenario Outline: Login rejects invalid input "<case>"
    When the client sends the login payload "<case>"
    Then the response should be a client error
    And the response should not contain a token

    Examples:
      | case                         |
      | empty email and password     |
      | password missing             |
      | empty body                   |
      | email sent as a number       |
      | SQL-style text in email      |
      | script tag in email          |

  Scenario Outline: Login rejects an email of <length> characters
    When the client logs in with an email of <length> characters and a wrong password
    Then the response status should be 400
    And the response should not contain a token

    Examples:
      | length |
      | 1      |
      | 64     |
      | 254    |
      | 255    |
      | 256    |

  # Known defect: the app returns 500 for malformed JSON instead of 400.
  # Excluded from runs by the tag filter in cucumber.js. Run it with --tags @known-defect to see the failure.
  @known-defect
  Scenario: Login with malformed JSON returns 400
    When the client sends malformed JSON to the login endpoint
    Then the response status should be 400

  Scenario Outline: Products request with an invalid token "<token>" is unauthorized
    When the client requests the products with the token "<token>"
    Then the response status should be 401

    Examples:
      | token                    |
      | (empty)                  |
      | abc                      |
      | Bearer not-a-real-token  |
