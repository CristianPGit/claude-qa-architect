@search @edge-case
Feature: Transaction Search - Edge Cases
  As a George banking customer
  I want the search to be robust and reliable
  So that results are always accurate, complete, and resilient to navigation

  Background:
    Given the user is logged in and on the dashboard
    And the user opens the search panel

  @data-integrity
  Scenario: Result rows contain date, merchant name, and amount
    When the user searches for "Fashion"
    Then transaction results containing "Fashion" should be visible
    And each result row should contain a date, merchant name, and amount with currency

  @navigation
  Scenario: Search resets after navigating away and back
    Given the user has searched for "Fashion"
    When the user navigates to the Overview page
    And the user returns to the search panel
    Then the search field should be empty with no stale results

  @debounce
  Scenario: Rapid typing without Enter does not trigger search results
    When the user types "Fashion" quickly without pressing Enter
    And waits briefly for any debounced requests to fire
    Then no transaction tables should be rendered
