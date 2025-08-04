# Routing & Layout Plan

| Path             | File                         | Purpose               |
| ---------------- | ---------------------------- | --------------------- |
| `/`              | `app/page.tsx`               | Landing               |
| `/dashboard`     | `app/dashboard/page.tsx`     | Focus & AI overview   |
| `/projects`      | `app/projects/page.tsx`      | List of projects      |
| `/projects/[id]` | `app/projects/[id]/page.tsx` | Detailed project view |
| `/reflection`    | `app/reflection/page.tsx`    | Journaling and logs   |

## Layout

- File: `app/layout.tsx`
- Shared components: `<Sidebar />`, `<Topbar />`
- Responsive behavior: Mobile = full-width, Desktop = split layout
