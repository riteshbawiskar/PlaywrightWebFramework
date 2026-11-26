Feature: Checkout

  Background:
    Given the user is logged in

  Scenario: Country field suggests matching countries
    Given the user is on the checkout page with "ZARA COAT 3" in the cart
    When the user types "ind" in the country field
    Then the country suggestions should include "India"

  Scenario: Country suggestions include Indonesia
    Given the user is on the checkout page with "ZARA COAT 3" in the cart
    When the user types "ind" in the country field
    Then the country suggestions should include "Indonesia"

  Scenario: User places an order
    Given the user is on the checkout page with "ZARA COAT 3" in the cart
    When the user selects the country "India"
    And the user places the order
    Then the order confirmation should contain "Thankyou for the order."

  Scenario: Country suggestions include United States for "uni"
    Given the user is on the checkout page with "ZARA COAT 3" in the cart
    When the user types "uni" in the country field
    Then the country suggestions should include "United States"

  Scenario: Country search is not case-sensitive
    Given the user is on the checkout page with "ZARA COAT 3" in the cart
    When the user types "IND" in the country field
    Then the country suggestions should include "India"

  Scenario: No suggestions appear for a country that does not exist
    Given the user is on the checkout page with "ZARA COAT 3" in the cart
    When the user types the text "zzzz" with no matching country
    Then the country suggestions should be empty

  Scenario: Checkout works for the iPhone
    Given the user is on the checkout page with "iphone 13 pro" in the cart
    Then the checkout page should be displayed
