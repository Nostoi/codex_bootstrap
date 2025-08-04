# Component Catalog

Each component includes:

- Name
- File path
- Props (with types)
- States / Variants
- Slots or children
- Accessibility
- Linked Screens

## 🧱 Example: TaskCard

- File: `components/ui/TaskCard.tsx`
- Props:

```ts
interface TaskCardProps {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  dueDate?: string;
  onClick?: () => void;
}
```

- Variants: Compact, Expanded
- Used on: `/dashboard`, `/projects/[id]`
