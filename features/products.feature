Feature: Products

  Background:
    Given the user is logged in

  Scenario: Dashboard lists products after login
    Then the user should be on the dashboard
    And at least one product should be listed

  Scenario: Dashboard lists "iphone 13 pro"
    Then the product "iphone 13 pro" should be listed

  Scenario: Dashboard lists "ZARA COAT 3"
    Then the product "ZARA COAT 3" should be listed

  Scenario: Adding a product shows a success message
    When the user adds "ZARA COAT 3" to the cart
    Then the message "Product Added To Cart" should be displayed

  Scenario: Dashboard shows the navigation items
    Then the navigation should show "HOME"
    And the navigation should show "ORDERS"
    And the navigation should show "Cart"
    And the navigation should show "Sign Out"

  Scenario: Dashboard shows the search box
    Then the dashboard search box should be visible

  Scenario: Dashboard lists "ADIDAS ORIGINAL"
    Then the product "ADIDAS ORIGINAL" should be listed

  Scenario: "ZARA COAT 3" card shows the price "$ 11500"
    Then the product "ZARA COAT 3" should show the price "$ 11500"

  Scenario: "ADIDAS ORIGINAL" card shows the price "$ 11500"
    Then the product "ADIDAS ORIGINAL" should show the price "$ 11500"

  Scenario: "ZARA COAT 3" card has a View button
    Then the product "ZARA COAT 3" should have a "View" button

  Scenario: "ZARA COAT 3" card has an Add To Cart button
    Then the product "ZARA COAT 3" should have a "Add To Cart" button

  Scenario: View opens the details of "ZARA COAT 3"
    When the user opens the details of "ZARA COAT 3"
    Then the product details should show "ZARA COAT 3"

  Scenario: Product details page has a Continue Shopping button
    When the user opens the details of "ZARA COAT 3"
    Then the product details should show "Continue Shopping"
