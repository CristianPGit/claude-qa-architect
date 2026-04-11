@login @smoke
Feature: Login
  As a George banking customer
  I want to log into my account
  So that I can access my banking dashboard

  Scenario: Successful login with valid credentials
    Given I am on the George login page
    When I log in with valid credentials
    Then I should be on the dashboard
