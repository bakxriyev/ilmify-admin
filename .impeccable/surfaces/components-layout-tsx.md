---
version: 1
slug: "components-layout-tsx"
primary_target: "components/Layout.tsx"
related_targets: ["app/dashboard/page.tsx","components/Sidebar.tsx","components/Header.tsx"]
---

# Admin shell (sidebar, header, mobile tab bar) and dashboard

Scope: the authenticated admin shell that wraps every route using `components/Layout.tsx`, the shared UI primitives in `components/ui`, and `/dashboard`. Visitor mode: Operate.

Audience and job: education-center directors and admins running the day (students, groups, attendance, payments, CRM). Constraints: preserve all business logic, API calls, permission filtering and routes; Uzbek copy; light and dark themes (user confirmed); must work at phone width.

## Direction contract
THESIS: Chrome is a layer of liquid glass floating over the work, not an opaque frame that takes strips from it. This refuses the category default of a saturated solid-blue rail plus a white top bar.
OWN-WORLD: a cool, diffuse ambient light field (sky, lilac, mint washes on #eef1f6; deep indigo on #07090d). Chrome is translucent glass: a 28px blur at 180% saturation, a bright specular top edge, a hairline rim and a soft offset shadow. Content sits on thick, near-opaque material. One accent, system blue. A system font stack with tabular figures.
STORY: the admin sees where they are (the page title in the header, the lens on the active nav item), finds any of 40 pages in seconds (grouped nav plus a ⌘K palette), sees center tariff status and notifications at a glance, then works the page.
FIRST VIEWPORT: a floating glass sidebar inset 12px on the left (center logo and name, five labelled nav groups, profile at the foot). A floating glass header bar to its right (page title with breadcrumb, search trigger, tariff chip, theme toggle, bell). The page content scrolls beneath both. On phones: a compact glass header and a floating glass capsule tab bar.
FORM: pinned. Signature move: the liquid lens, a bright glass pill under the active nav or tab item that springs between items.
seed: none (pinned) "apple liquid glass effectida qilib ber"
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
