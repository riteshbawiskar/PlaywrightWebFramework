Feature: Orders

  Background:
    Given the user is logged in

  Scenario: Orders page opens from the navigation
    When the user opens the orders page
    Then the orders page should show "Your Orders"

  Scenario: Orders table has the expected columns
    When the user opens the orders page
    Then the orders table should have the column "Order Id"
    And the orders table should have the column "Product Image"
    And the orders table should have the column "Name"
    And the orders table should have the column "Price"
    And the orders table should have the column "Ordered Date"

  Scenario: A placed order appears in Your Orders
    When the user adds "ZARA COAT 3" to the cart
    And the user opens the cart
    And the user proceeds to checkout
    And the user selects the country "India"
    And the user places the order
    And the user opens the orders page
    Then the orders should include "ZARA COAT 3"
