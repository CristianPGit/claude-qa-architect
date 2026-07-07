# QA Architect — Project Runbook

> The **runbook layer** of QA memory: stable facts about *this* repo and the hard safety rules.
> QA Architect reads this before every run but **does not edit it during normal QA work** —
> it's written once at setup (`/qa-setup`) and changed deliberately by a human when the
> architecture or safety posture actually changes. Commit it so the whole team shares one source
> of truth. For *how we like QA done* (depth, style, always/never), see `preferences.md` instead.

## Apps & surfaces
<!-- Monorepo layout; each app's entry point and what it does. -->
-

## Tech stack
<!-- Languages, frameworks, package manager, build tooling. -->
-

## Auth & test identities
<!-- How users authenticate; test credentials/roles and where they live (never commit secrets). -->
-

## Environments
<!-- local / dev / staging / prod URLs. Which is safe to test against. -->
- **Never** run mutating or browser tests against production.
- Safe default target: <local | staging>.

## Critical flows (P1 backbone)
<!-- The 3–5 journeys that must never break. These anchor P1 priority. -->
-

## Integrations & flags
<!-- Payments, email, queues, third-party widgets, feature-flag system. -->
-

## Test framework map
<!-- Existing framework(s), where tests live, Page Object patterns, fixtures, naming. -->
-

## Issue tracker
<!-- Linear / GitHub / Jira; ID conventions used in commits and PRs. -->
-
