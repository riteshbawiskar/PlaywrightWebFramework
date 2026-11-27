Feature: Products API

  Scenario: Login with valid credentials returns a token
    When the client logs in with valid credentials
    Then the response status should be 200
    And the response should contain a token

  Scenario: Login token has the three parts of a JWT
    When the client logs in with valid credentials
    Then the response token should have three parts

  Scenario: Login response includes a 24-character user id
    When the client logs in with valid credentials
    Then the response user id should be a 24-character hex id

  Scenario: Login response message is "Login Successfully"
    When the client logs in with valid credentials
    Then the response message should be "Login Successfully"

  Scenario: Login response is JSON
    When the client logs in with valid credentials
    Then the response should be JSON

  Scenario: Login succeeds when an extra field is sent
    When the client logs in with valid credentials and an extra field
    Then the response status should be 200
    And the response should contain a token

  Scenario: Login with invalid credentials is rejected
    When the client logs in with email "invalid.user@example.com" and password "WrongPass@123"
    Then the response status should be 400
    And the response message should be "Incorrect email or password."
    And the response should not contain a token

  Scenario: Login with spaces around a valid-looking email is rejected
    When the client logs in with email " invalid.user@example.com " and password "WrongPass@123"
    Then the response status should be 400
    And the response message should be "Incorrect email or password."

  Scenario: Login with the valid email and an uppercase password is rejected
    When the client logs in with valid email and the password in uppercase
    Then the response status should be 400
    And the response should not contain a token

  Scenario Outline: Login rejects invalid input "<case>"
    When the client sends the login payload "<case>"
    Then the response should be a client error
    And the response should not contain a token

    Examples:
      | case                         |
      | empty email and password     |
      | password missing             |
      | email missing                |
      | password empty               |
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
  # Excluded from runs by the tag filter in cucumber.js. Run it with INCLUDE_KNOWN_DEFECTS=1 and --tags @known-defect.
  @known-defect
  Scenario: Login with malformed JSON returns 400
    When the client sends malformed JSON to the login endpoint
    Then the response status should be 400

  Scenario: GET on the login endpoint is not found
    When the client sends a GET request to the login endpoint
    Then the response status should be 404

  Scenario: GET on the products endpoint is not found
    When the client sends a GET request to the products endpoint
    Then the response status should be 404

  Scenario: An unknown endpoint is not found
    When the client sends a request to an unknown endpoint
    Then the response status should be 404

  Scenario: Products request without a token is unauthorized
    When the client requests the products without a token
    Then the response status should be 401

  Scenario Outline: Products request with an invalid token "<token>" is unauthorized
    When the client requests the products with the token "<token>"
    Then the response status should be 401

    Examples:
      | token                    |
      | (empty)                  |
      | abc                      |
      | Bearer not-a-real-token  |

  Scenario: Products request with a token returns a valid product list
    When the client logs in and requests the products
    Then the response status should be 200
    And the response should contain a valid product list

  Scenario: Products response is JSON
    When the client logs in and requests the products
    Then the response should be JSON

  Scenario: Products request with an extra body field still succeeds
    When the client logs in and requests the products with an extra body field
    Then the response status should be 200
    And the response should contain a valid product list

  Scenario: Product list is not empty and every product has a name and a positive price
    When the client logs in and requests the products
    Then the response should contain at least one product
    And every product should have a name and a positive price

  Scenario: Every product has a unique id
    When the client logs in and requests the products
    Then every product should have a unique id

  Scenario: Every product price is a whole number
    When the client logs in and requests the products
    Then every product price should be a whole number

  Scenario: Every product has a category and an image URL
    When the client logs in and requests the products
    Then every product should have a category and an image URL

  # Registration scenarios send generated data that the server rejects, so no account is created.
  Scenario: Registration with a password under 8 characters is rejected
    When the client registers with a password of 5 characters
    Then the response status should be 422
    And the response error should be "Password must be 8 Character Long!"

  Scenario: Registration without a first name is rejected
    When the client registers without a first name
    Then the response status should be 422
    And the response error should be "First Name is required!"

  Scenario: Registration with a first name of 2 characters is rejected
    When the client registers with a first name of 2 characters
    Then the response status should be 422
    And the response error should be "First Name must be 3 to 20 characters long!"

  Scenario: Generated registration details use only reserved example email domains
    Given the client has generated registration details
    Then the generated email should use a reserved example domain
