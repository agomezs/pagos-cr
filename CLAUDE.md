# Project guidelines

## React Conventions

Extract a component when it genuinely simplifies the code — e.g. the logic is reused in multiple places, or the JSX block is large enough that inlining it obscures the parent's intent. Don't extract for its own sake: a small, one-off piece of JSX belongs inline.

## Navigation / UX Conventions

Use a chevron `›` (right-aligned, `text-gray-300`) on tappable cards that navigate to an edit or detail screen. This follows the iOS settings pattern and signals interactivity without adding visual noise.

## Component Catalog

Reusable components are documented in `docs/component-catalog.md`. Check it before creating new components — props, behavior, and usage examples are there.
