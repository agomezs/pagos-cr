# Troubleshooting

## "Couldn't find a navigation context" — crash when pressing a StatCard

**Status: unresolved**

**Resolution:**

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

Occurs on interaction (pressing a StatCard), not on render. Was introduced when `StatCard` was refactored from `View` → `Pressable`. Before that change the StatCard had no `onPress` and the crash did not occur.

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

The stack trace points at `<Pressable>` inside `StatCard`, but that component has no navigation code. The crash is triggered by the `setStatusFilter` state update that `onPress` causes — something in the re-render that follows calls `useNavigation()` at a moment the context is unavailable.

---

### What was ruled out

- **Missing NavigationContainer** — expo-router provides it via `<Stack>`. Other interactions worked before this change.
- **GluestackUIProvider interfering** — it wraps `<Stack>`, not the other way around; unchanged.
- **The `onPress` handler content** — `onPress` only calls `setStatusFilter`, no navigation calls.
- **Gluestack's `Pressable` calling a navigation hook** — inspected `@gluestack-ui/pressable/lib/Pressable.jsx`: uses `@react-native-aria/interactions` and `@react-native-aria/focus`, neither of which touch `useNavigation`. Ruled out by source inspection.
- **`Dashboard.tsx` importing `Pressable` from Gluestack** — confirmed it imports from `react-native` directly (line 4). Ruled out.

---

### Hypotheses

[Order by likelihood. Work top to bottom.]

**Hypothesis 1 ❌ — `ChargeCard` calls `useRouter()` at top level; re-render triggered by StatCard press causes it to fire outside navigation context**

Reasoning: `ChargeCard` calls `useRouter()` unconditionally on every render. When a StatCard press triggers `setStatusFilter`, the charge list re-renders and all `ChargeCard` instances re-run their hooks. If expo-router's context is briefly unavailable during that update cycle, `useRouter()` throws. This would explain why the crash surface is `StatCard` (the initiator of the state change) even though `StatCard` has no navigation code.

Changes:
- Remove `useRouter` from `ChargeCard`
- Add an `onPress: () => void` prop to `ChargeCard`
- Pass `onPress` down from `Dashboard`, which receives it from `DashboardScreen` (which already owns `handleChargePress` with `useRouter`)

Trade-off introduced: none — `DashboardScreen` already had the correct `handleChargePress` wired up but it was being ignored

Result: persisted

---

**Hypothesis 2 ❌ — `useFocusEffect` calls `useNavigation()` unconditionally on every render; changing `statusFilter` causes it to re-run and throw**

Reasoning: Confirmed by source inspection of `node_modules/@react-navigation/core/src/useFocusEffect.tsx:15` — `useFocusEffect` calls `useNavigation()` unconditionally at its top level on every render. In `Dashboard`, `useFocusEffect` receives a `useCallback` that depends on `statusFilter`. When StatCard press calls `setStatusFilter`, `useCallback` produces a new function reference, `useFocusEffect` re-renders, and `useNavigation()` fires. If expo-router's context is unavailable at that moment, it throws.

The fix is to replace `useFocusEffect` with a plain `useEffect` for filter-driven reloads. `useEffect` does not call `useNavigation()` and is sufficient here since we just want to re-run `load()` when deps change.

Changes:
- Replace `useFocusEffect(useCallback(() => { load(); }, [load]))` with `useEffect(() => { load(); }, [load])` in `Dashboard`

Trade-off introduced: none — behavior is equivalent; `useEffect` triggers on mount and dep changes the same way

Result: persisted

---

**Hypothesis 3 — `@react-native-aria` press interaction emits a focus/blur event that triggers `useFocusEffect`'s blur listener, briefly invalidating the navigation context**

Reasoning: `useFocusEffect` registers a `blur` listener on the navigation object. `@react-native-aria/interactions` (used inside Gluestack's Pressable, which wraps `StatCard`'s `Pressable` at the NativeWind level) fires focus/blur events on press. If pressing StatCard causes the navigation screen to emit `blur`, `useFocusEffect`'s cleanup runs and the context becomes unavailable mid-render. Less likely than H2 but shares the same root: `useFocusEffect` holding a navigation listener. The same fix (replacing `useFocusEffect` with `useEffect`) eliminates this trigger too.

Changes:
- Same as Hypothesis 2

Trade-off introduced: none

Result: <!-- persisted | resolved | partial | reverted -->

---

### Hypotheses to try (most likely first)

| # | Status | Hypothesis / Fix to attempt | Reasoning | Result |
|---|--------|----------------------------|-----------|--------|
| 1 | ✅ Tested | Remove `useRouter` from `ChargeCard`; pass `onPress` from `DashboardScreen` via `Dashboard` | `useRouter` called during re-render triggered by StatCard press | persisted |
| 2 | ✅ Tested | Replace `useFocusEffect(useCallback(..., [load]))` with `useEffect(..., [load])` in `Dashboard` | `useFocusEffect` calls `useNavigation()` unconditionally — confirmed in `@react-navigation/core/src/useFocusEffect.tsx:15` | persisted |
| 3 | ⬜ Untested | Same fix as H2 — also eliminates potential `@react-native-aria` focus/blur cascade from Gluestack's Pressable | If H2 resolves it, H3 is moot | — |
