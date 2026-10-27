---
description: The one QA entry point — hand it a ticket, PR, build or nothing (current branch) and it plans, prepares the env, tests, proves bugs, reports, learns, and asks you once at the end.
argument-hint: "[<ticket | PR | build>] [plan only | preflight <flow> | explore | automate | swarm | resume] · bug bash <area> · fix <BUG-ID>"
---

Invoke the `qa` skill with: **$ARGUMENTS**

Follow its loop end to end without stopping to ask on local/test environments. Stop once, at the
end, for everything outward-facing (filing bugs, posting comments, committing, pushing, opening
fix PRs). Never production.
