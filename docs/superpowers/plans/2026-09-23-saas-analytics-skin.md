# SaaS Analytics Skin Implementation Plan

> **For agentic workers:** Execute inline in this session (user requested develop). Skip git commits unless the user asks.

**Goal:** Apply a global analytics-SaaS visual skin across Dentura via CSS tokens + a few shared mirrors, keeping ThemeSwitcher accents and existing layouts.

**Architecture:** Update base/component/template CSS so Card/Input/Menu/Shell inherit the new look. Add `SoftCard` and `GhostButton` wrappers. Point Home KPIs at existing `KpiStat`.

**Tech Stack:** React, Tailwind (JIT), existing Ecme-style UI kit CSS layers.

## Global Constraints

- Do not lock accent to violet; preserve `themeColor` / ThemeSwitcher.
- Do not add new layout types.
- Dark mode must remain usable.
- No commits unless user requests.

---

### Task 1: Global canvas + typography skin

**Files:**
- Modify: `front/src/assets/styles/tailwind/index.css`

- [ ] Soften `body` background to `bg-gray-50` (dark: keep `bg-gray-900`)
- [ ] Slightly tighten heading weight feel if needed (keep existing sizes)

### Task 2: Primitive component CSS

**Files:**
- Modify: `front/src/assets/styles/components/_card.css`
- Modify: `front/src/assets/styles/components/_input.css`
- Modify: `front/src/assets/styles/components/_button.css`
- Modify: `front/src/assets/styles/components/_menu-item.css`
- Modify: `front/src/assets/styles/components/_tables.css`
- Modify: `front/src/assets/styles/components/_dialog.css`

- [ ] Cards: `rounded-xl`, softer border/shadow
- [ ] Inputs: `rounded-lg`, lighter border (`gray-200`)
- [ ] Buttons: default radius `rounded-lg`
- [ ] Menu active: `bg-gray-100` instead of `bg-gray-200`
- [ ] Tables/dialogs: softer radii and header backgrounds

### Task 3: Shell retouch

**Files:**
- Modify: `front/src/assets/styles/template/_side-nav.css`
- Modify: `front/src/assets/styles/template/_header.css`

- [ ] Side nav light: subtle border, white surface
- [ ] Header: light border-bottom instead of heavy shadow feel

### Task 4: Mirror components

**Files:**
- Create: `front/src/components/shared/SoftCard.tsx`
- Create: `front/src/components/shared/GhostButton.tsx`
- Modify: `front/src/components/shared/index.ts`

- [ ] `SoftCard` wraps `Card` with analytics defaults
- [ ] `GhostButton` wraps `Button` as outlined soft secondary

### Task 5: Home showcase

**Files:**
- Modify: `front/src/views/Home.tsx`

- [ ] Replace gradient `KpiTile` with `KpiStat`
- [ ] Prefer `SoftCard` / `GhostButton` where it improves the dashboard

### Task 6: Visual smoke check

- [ ] Confirm CSS changes compile (dev server or build if already running)
- [ ] Spot-check Home + a list page mentally against success criteria
