# Test Plan — <Feature / Ticket / PR>

**Source:** <Linear ID / PR # / branch / description>
**Scope:** <one line on what's in and out of scope>
**Calibration applied:** <e.g. "lean depth; accessibility on; staging only"> (from `.qa/preferences.md`)

---

## P1 — Must pass to ship

### TC-01 · [Happy Path] <short, specific title>
**Given** <preconditions / state>
**When** <the action, with concrete data>
**Then** <the expected, observable result>
- Priority: P1
- Traces to: <acceptance criterion / file:line / requirement>

### TC-02 · [Sad Path] <short, specific title>
**Given** …
**When** … (invalid input / denied permission / failed dependency)
**Then** … (graceful, specific failure — exact message / state)
- Priority: P1
- Traces to: …

---

## P2 — Important

### TC-03 · [Edge Case] <short, specific title>
**Given** …  **When** … (boundary / empty / max / unicode / concurrency)  **Then** …
- Priority: P2
- Traces to: …

---

## P3 — Nice to have

### TC-04 · [Non-functional] <accessibility / performance / i18n / responsive>
**Given** …  **When** …  **Then** …
- Priority: P3
- Traces to: …

---

## Notes & assumptions
- <any assumption made because the source was ambiguous>
- <anything explicitly NOT covered and why>

## Suggested next steps
- [ ] Explore P1 flows in a browser to confirm selectors/behavior
- [ ] Automate P1/P2 in <framework>
- [ ] Post plan to <Linear issue / GitHub PR>
