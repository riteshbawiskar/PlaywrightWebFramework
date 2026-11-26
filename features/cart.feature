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

  Scenario: Cart item shows "In Stock"
    Given the cart is empty
    When the user adds "ZARA COAT 3" to the cart
    And the user opens the cart
    Then the cart should show "In Stock"

  Scenario: Cart subtotal shows the price of one item
    Given the cart is empty
    When the user adds "ZARA COAT 3" to the cart
    And the user opens the cart
    Then the cart should show "Subtotal"
    And the cart should show "11500"

  Scenario: Cart badge shows 1 after adding one product
    Given the cart is empty
    When the user adds "ZARA COAT 3" to the cart
    Then the cart badge should show "Cart 1"

  Scenario: Removing the only item empties the cart
    Given the cart is empty
    When the user adds "ZARA COAT 3" to the cart
    And the user opens the cart
    And the user removes every item from the cart
    Then the cart should have no items

  Scenario: Cart item has a Buy Now button
    Given the cart is empty
    When the user adds "ZARA COAT 3" to the cart
    And the user opens the cart
    Then the cart item should have a "Buy Now" button

  Scenario: Continue Shopping returns to the dashboard
    Given the cart is empty
    When the user opens the cart
    And the user clicks Continue Shopping
    Then the user should be on the dashboard

  Scenario: iPhone item in the cart shows "In Stock"
    Given the cart is empty
    When the user adds "iphone 13 pro" to the cart
    And the user opens the cart
    Then the cart should show "In Stock"
