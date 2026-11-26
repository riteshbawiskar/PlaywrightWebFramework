Feature: Cart

  Background:
    Given the user is logged in

  Scenario: Added product appears in the cart
    When the user adds "ZARA COAT 3" to the cart
    And the user opens the cart
    Then the cart should contain "ZARA COAT 3"

  Scenario: User can proceed to checkout from the cart
    When the user adds "ADIDAS ORIGINAL" to the cart
    And the user opens the cart
    And the user proceeds to checkout
    Then the checkout page should be displayed

  Scenario: Added iPhone appears in the cart
    When the user adds "iphone 13 pro" to the cart
    And the user opens the cart
    Then the cart should contain "iphone 13 pro"

  Scenario: Cart shows two added products together
    When the user adds "ZARA COAT 3" to the cart
    And the user adds "ADIDAS ORIGINAL" to the cart
    And the user opens the cart
    Then the cart should contain "ZARA COAT 3"
    And the cart should contain "ADIDAS ORIGINAL"
