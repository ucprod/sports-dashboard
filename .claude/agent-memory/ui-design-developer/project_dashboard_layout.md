---
name: Dashboard layout architecture
description: Full-screen no-scroll layout design decisions for the Oilers dashboard
type: project
---

The dashboard was redesigned to a full-screen, no-scroll layout in March 2026.

Key decisions:
- `html` and `body` both use `h-full overflow-hidden` in layout.tsx to establish a full-viewport height chain
- `Dashboard.tsx` is a `h-full flex flex-col overflow-hidden` container — the root constraint
- Header strip is `shrink-0` (~40px), game row is `shrink-0` (~52px), roster gets `flex-1 min-h-0`
- `min-h-0` on the roster flex child is critical — without it, flex items don't respect overflow constraints
- Roster sections scroll horizontally per position group (Forwards / Defense / Goalies), not vertically
- `StandingsTable` was removed entirely from Dashboard.tsx and is no longer rendered anywhere

**Why:** User requirement — all content must fit in the viewport with no scrolling. Roster is the primary content.

**How to apply:** Any new sections added to the dashboard must either be `shrink-0` with a very small footprint, or replace the roster as the `flex-1` region. Do not add vertical scrolling to the outer container.
