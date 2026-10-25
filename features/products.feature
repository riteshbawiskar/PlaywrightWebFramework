Feature: Products

  Background:
    Given the user is logged in

  Scenario: Dashboard lists products after login
    Then the user should be on the dashboard
    And at least one product should be listed

  Scenario: Adding a product shows a success message
    When the user adds "ZARA COAT 3" to the cart
    Then the message "Product Added To Cart" should be displayed
