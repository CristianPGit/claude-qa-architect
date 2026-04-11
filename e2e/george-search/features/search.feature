@search
Feature: Transaction Search
  As a George banking customer
  I want to search my transaction history by keyword
  So that I can quickly find specific payments

  Background:
    Given the user is logged in and on the dashboard
    And the user opens the search panel

  @ui
  Scenario: Search panel opens and keyword input is visible
    Then the keyword input field should be visible

  @happy-path
  Scenario: Search "Fashion" returns matching transaction results
    When the user searches for "Fashion"
    Then transaction results containing "Fashion" should be visible

  @happy-path
  Scenario: Search is case-insensitive
    When the user searches for "fashion"
    Then transaction results containing "Fashion" should be visible

  @negative
  Scenario: No matching keyword shows empty state
    When the user searches for "XYZNOTEXIST99999"
    Then no results should be displayed
