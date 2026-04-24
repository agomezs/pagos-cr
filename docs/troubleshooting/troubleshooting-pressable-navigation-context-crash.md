# Troubleshooting

## "Couldn't find a navigation context" — crash when pressing a StatCard

**Status: resolved**

**Resolution:** NativeWind v4 `className` on `Pressable` internally calls a navigation hook when the press interaction triggers a re-render; replacing `className` with inline `style` on the `Pressable` in `StatCard` eliminates the crash.

---

### Affected versions

| Package | Version |
|---------|---------|
| expo-router | ~55.0.12 |
| react-native | 0.83.4 |
| @react-navigation/core | (expo-router dep) |
| nativewind | ^4.2.3 |
| @gluestack-ui/pressable | ^0.1.23 |

---

### Symptom

App crashes when tapping a StatCard on the Dashboard. The error points at the `<Pressable>` inside `StatCard`.

```
Error: Couldn't find a navigation context. Have you wrapped your app with 'NavigationContainer'?

  StatCard (components/Dashboard.tsx:55:5)
  SummaryPanel (components/Dashboard.tsx:76:9)
  Dashboard (components/Dashboard.tsx:264:9)
  DashboardScreen (app/(tabs)/index.tsx:13:7)
  TabsLayout (app/(tabs)/_layout.tsx:5:5)
  RootLayout (app/_layout.tsx:8:7)
```

Occurs on interaction (pressing a StatCard), not on render. Was introduced when `StatCard` was refactored from `View` → `Pressable` with a `className` prop. A bare `Pressable` with only inline `style` and the same `onPress` does not crash.

---

### Stack overview

- expo-router provides `NavigationContainer` automatically via `<Stack>` in `app/_layout.tsx`
- `GluestackUIProvider` wraps `<Stack>` — no extra `NavigationContainer`
- `Dashboard` is rendered inside `app/(tabs)/index.tsx`, a valid tab screen
- `Dashboard` uses `useFocusEffect` from expo-router with a `useCallback` that depends on `statusFilter`
- `ChargeCard` calls `useRouter()` at its top level on every render

```tsx
// app/_layout.tsx
export default function RootLayout() {
  return (
    <GluestackUIProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </GluestackUIProvider>
  );
}
```

---

### Why the error is misleading

The stack trace points at `<Pressable>` inside `StatCard` and says "no NavigationContainer" — but the container is there and other `Pressable` components work fine. The real issue is that NativeWind v4 patches `Pressable` to track press state for variants like `active:`. That patching mechanism calls into navigation context internally on press. The error fires at `StatCard` because that's where NativeWind's patched `Pressable` with `className` lives, not because navigation is misconfigured.

---

### What was ruled out

- **Missing NavigationContainer** — expo-router provides it via `<Stack>`. Other interactions worked before this change.
- **GluestackUIProvider interfering** — it wraps `<Stack>`, not the other way around; unchanged.
- **The `onPress` handler content** — a bare `Pressable` with the same `onPress` and only inline `style` works without crashing. Ruled out.
- **Gluestack's `Pressable` calling a navigation hook** — inspected `@gluestack-ui/pressable/lib/Pressable.jsx`: uses `@react-native-aria/interactions` and `@react-native-aria/focus`, neither of which touch `useNavigation`. Ruled out by source inspection.
- **`Dashboard.tsx` importing `Pressable` from Gluestack** — confirmed it imports from `react-native` directly (line 4). Ruled out.
- **`ChargeCard` calling `useRouter()` at top level** — removing it and passing `onPress` as a prop did not fix the crash. Ruled out.
- **`useFocusEffect` calling `useNavigation()` on re-render** — replacing it with `useEffect` did not fix the crash. Ruled out.

---

### Hypotheses

**Hypothesis 1 ❌ — `ChargeCard` calls `useRouter()` at top level; re-render triggered by StatCard press causes it to fire outside navigation context**

Reasoning: `ChargeCard` calls `useRouter()` unconditionally on every render. When a StatCard press triggers `setStatusFilter`, the charge list re-renders and all `ChargeCard` instances re-run their hooks. If expo-router's context is briefly unavailable during that update cycle, `useRouter()` throws.

Changes:
- Remove `useRouter` from `ChargeCard`
- Add an `onPress: () => void` prop to `ChargeCard`
- Pass `onPress` down from `Dashboard`, which receives it from `DashboardScreen`

Trade-off introduced: none

Result: persisted

---

**Hypothesis 2 ❌ — `useFocusEffect` calls `useNavigation()` unconditionally on every render; changing `statusFilter` causes it to re-run and throw**

Reasoning: Confirmed by source inspection of `@react-navigation/core/src/useFocusEffect.tsx:15` — `useFocusEffect` calls `useNavigation()` unconditionally. In `Dashboard`, it receives a `useCallback` that depends on `statusFilter`, so every StatCard press produces a new callback reference, `useFocusEffect` re-runs, and `useNavigation()` fires.

Changes:
- Replace `useFocusEffect(useCallback(() => { load(); }, [load]))` with `useEffect(() => { load(); }, [load])`

Trade-off introduced: none

Result: persisted

---

**Hypothesis 3 ✅ — NativeWind v4 `className` on `Pressable` calls into navigation context when processing press-state variants**

Reasoning: A bare `Pressable` with the same `onPress` and only inline `style` works without crashing. The only difference is the absence of `className`. NativeWind v4 patches `Pressable` to support variants like `active:opacity-80` — that patching tracks press state in a way that internally touches the navigation context.

Changes:
- Remove `className` from the `Pressable` in `StatCard`
- Replace with equivalent inline `style`

Trade-off introduced: loses NativeWind variant support (`active:`, `focus:`, etc.) on this specific component — use `style` callbacks or `Animated` for press feedback instead

Result: resolved

---

### Hypotheses to try (most likely first)

| # | Status | Hypothesis / Fix to attempt | Reasoning | Result |
|---|--------|----------------------------|-----------|--------|
| 1 | ✅ Tested | Remove `useRouter` from `ChargeCard`; pass `onPress` from `DashboardScreen` via `Dashboard` | `useRouter` called during re-render triggered by StatCard press | persisted |
| 2 | ✅ Tested | Replace `useFocusEffect(useCallback(..., [load]))` with `useEffect(..., [load])` in `Dashboard` | `useFocusEffect` calls `useNavigation()` unconditionally — confirmed in `@react-navigation/core/src/useFocusEffect.tsx:15` | persisted |
| 3 | ✅ Tested | Remove `className` from `Pressable` in `StatCard`; use inline `style` only | NativeWind v4 patches `Pressable` for press-state variants — bare `Pressable` with same `onPress` and inline style works fine | resolved |
