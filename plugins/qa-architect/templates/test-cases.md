# 🧪 Test Plan — <Feature / Ticket / PR>

**Source:** <Linear ID / PR # / branch / description>
**Assumes:** <key assumptions made when the source was ambiguous — keep to 1 line>
**Calibration applied:** <e.g. "compact table; lean depth; staging only"> (from `.qa/preferences.md`)

| ID | Type | Scenario | Input → Expected | Pri |
|----|------|----------|------------------|-----|
| 1 | ✅ Happy | <short clarifying phrase> | `<input>` → `<expected>` | 🔴 |
| 2 | ❌ Sad | <expected failure handled gracefully> | `<bad input>` → `<clear error>` *(not `<gotcha>`)* | 🔴 |
| 3 | ⚠️ Edge | <boundary / unusual-but-valid> | `<edge input>` → `<expected>` | 🟡 |
| 4 | 📊 Non-functional | <a11y / perf / i18n / responsive> | `<condition>` → `<expected>` | 🔵 |

**Legend** — Type: ✅ Happy · ❌ Sad · ⚠️ Edge · 🔒 Security · ♻️ Regression · 📊 Non-functional
**Priority** — 🔴 P1 (must pass to ship) · 🟡 P2 (important) · 🔵 P3 (nice-to-have)

> **Tip:** lead with 🔴 P1. Call out which 2–3 cases are most likely to break and should be
> automated first.

---

<!-- Expand a row to full Given/When/Then ONLY when it genuinely needs more context: -->
<!--
### TC-0X · [Type] <title>
**Given** <complex preconditions>
**When** <multi-step action with concrete data>
**Then** <observable result>
- Traces to: <acceptance criterion / file:line>
-->

## Notes & assumptions
- <any assumption made because the source was ambiguous>
- <anything explicitly NOT covered and why>

## Suggested next steps
- [ ] Automate the highest-risk cases first
- [ ] Explore the flow in a browser to confirm selectors/behavior
- [ ] Post plan to <Linear issue / GitHub PR>
