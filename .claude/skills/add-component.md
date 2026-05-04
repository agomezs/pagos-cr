---
name: add-component
description: Add a Gluestack UI v3 component to this project. Scaffolds via `npx gluestack-ui add <component-name>`, applies NativeWind styles, and creates a custom wrapper in components/ only when genuinely needed.
user-invocable: true
allowed-tools:
  - Bash(npx gluestack-ui add *)
---

# Add Gluestack UI Component

Use this skill when the user asks to add a UI component to the project.

## Stack

- **Component logic**: Gluestack UI v3 (already installed)
- **Styling**: NativeWind v4 (Tailwind v3 classes via `className`). Do NOT upgrade to Tailwind v4.
- **Icons**: `lucide-react-native`

## Step 1 — Scaffold with the CLI

Run the Gluestack CLI to add the component:

```bash
npx gluestack-ui add <component-name>
```

This writes the component files into `components/ui/<component-name>/`. Do not manually recreate what the CLI generates.

Check `docs/component-catalog.md` first — if the component is already scaffolded, skip the CLI call.

## Step 2 — Custom wrapper (only when needed)

Create a wrapper in `components/<component-name>/` **only** if one of the following is true:

- The component is reused in multiple screens with shared props or logic
- The raw Gluestack component needs project-specific defaults (e.g. a `StatusBadge` that encapsulates color logic for `ChargeStatus`)
- The JSX block is large enough that inlining it in the parent screen obscures the parent's intent

If none apply, use the Gluestack component directly from `components/ui/`. Do not create a wrapper for its own sake.

## Step 3 — Dark mode

Every new component must include `dark:` Tailwind variants on all background, border, and text colors. No exceptions.

## Step 4 — Update the catalog

After adding any reusable component (wrapper or raw Gluestack), add an entry to `docs/component-catalog.md` with:
- Component name and import path
- Props summary
- Brief usage example

## Reference

Available Gluestack component names: `accordion`, `actionsheet`, `alert`, `alert-dialog`, `avatar`, `badge`, `bottom-tabs`, `box`, `button`, `card`, `center`, `checkbox`, `divider`, `drawer`, `fab`, `form-control`, `grid`, `heading`, `hstack`, `icon`, `image`, `input`, `kbd`, `link`, `list`, `menu`, `modal`, `popover`, `portal`, `pressable`, `progress`, `radio`, `select`, `skeleton`, `slider`, `spinner`, `switch`, `table`, `tabs`, `text`, `textarea`, `toast`, `tooltip`, `vstack`.

Run `npx gluestack-ui add --help` for the full list.
