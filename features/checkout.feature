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
