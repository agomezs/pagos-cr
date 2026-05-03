# Component Catalog

Reference for LLMs and developers. Each entry documents props, behavior, and usage notes.

---

## Gluestack UI components

Gluestack UI v3 components are scaffolded into `components/ui/` via the CLI — they are not npm packages.

```bash
npx gluestack-ui add <component>   # e.g. actionsheet, modal, toast
```

**Currently scaffolded:** `actionsheet`, `button`, `gluestack-ui-provider`

**Full catalog available to add:** Accordion, Alert, AlertDialog, Avatar, Badge, BottomSheet, Box, Button, Card, Center, Checkbox, Divider, Drawer, Fab, FormControl, Grid, Heading, HStack, Icon, Image, Input, Link, Menu, Modal, Popover, Portal, Progress, Pressable, Radio, Select, Skeleton, Slider, Spinner, Switch, Table, Text, Textarea, Toast, Tooltip, VStack.

Always prefer scaffolding a Gluestack component over building a custom implementation for UI primitives (modals, sheets, toasts, form controls, overlays, etc.).

---

## SettingsSheet

**File:** `components/SettingsSheet.tsx`  
**Export:** default

Bottom sheet for app settings, built with Gluestack `Actionsheet`. Opens from the gear icon in the Dashboard header.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | yes | Controls sheet visibility |
| `onClose` | `() => void` | yes | Called when backdrop is tapped or sheet is dismissed |

### Behavior

- Slides up with Gluestack's built-in spring animation
- Backdrop tap dismisses the sheet
- Drag indicator at the top

### Usage

```tsx
import SettingsSheet from "../components/SettingsSheet";

<SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
```

---

## ScreenHeader

**File:** `components/ScreenHeader.tsx`  
**Export:** default

Sticky top bar used on every screen. Handles safe-area top inset automatically.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | yes | Screen title, rendered bold |
| `onBack` | `() => void` | no | If provided, renders a `← Volver` link on the left |
| `right` | `React.ReactNode` | no | Slot for a right-side action (button, icon, etc.) |

### Usage

```tsx
// Basic
<ScreenHeader title="Clientes" />

// With back button
<ScreenHeader title="Detalle" onBack={() => router.back()} />

// With right action
<ScreenHeader
  title="Plantillas"
  right={<Pressable onPress={handleNew}><Text>+ Nueva</Text></Pressable>}
/>
```

---

## ChargeCard

**File:** `components/dashboard/ChargeCard.tsx`  
**Export:** named `{ ChargeCard }`

Tappable card that displays a single charge. Navigates to the pay screen if the charge is pending/overdue, or to the client detail screen if paid.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `charge` | `Charge` | yes | Full charge object including `client_name` |

### Charge fields used

`id`, `client_id`, `client_name`, `concept`, `amount`, `status`, `due_date`, `paid_at`, `payment_method`

### Behavior

- **pending / overdue** → navigates to `/charges/[id]/pay`, shows `›` chevron
- **paid** → navigates to `/clients/[client_id]`, no chevron
- Badge color: blue = pending, red = overdue, green = paid

### Usage

```tsx
import { ChargeCard } from "../components/dashboard/ChargeCard";

charges.map((c) => <ChargeCard key={c.id} charge={c} />)
```

---

## ClientPickerModal

**File:** `components/dashboard/ClientPickerModal.tsx`  
**Export:** named `{ ClientPickerModal }`

Full-screen sheet modal for picking a client from a searchable list. Supports a "all clients" option (`null` selection).

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | yes | Controls modal visibility |
| `clients` | `Client[]` | yes | Full list of clients to display |
| `selected` | `string \| null` | yes | Currently selected client id, or `null` for all |
| `onSelect` | `(id: string \| null) => void` | yes | Called with the chosen id (or `null`) |
| `onClose` | `() => void` | yes | Called when the user taps "Listo" |

### Behavior

- Has an internal search input that filters by client name
- Selecting an item calls `onSelect` then `onClose` automatically
- The "Todos los clientes" row calls `onSelect(null)`

### Usage

```tsx
import { ClientPickerModal } from "../components/dashboard/ClientPickerModal";

<ClientPickerModal
  visible={showPicker}
  clients={clients}
  selected={clientFilter}
  onSelect={(id) => setClientFilter(id)}
  onClose={() => setShowPicker(false)}
/>
```

---

## TemplatePickerModal

**File:** `components/TemplatePickerModal.tsx`  
**Export:** default

Full-screen sheet modal that lists charge templates. Renders an empty state if no templates exist.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | yes | Controls modal visibility |
| `templates` | `ChargeTemplate[]` | yes | List of templates to display |
| `onSelect` | `(tpl: ChargeTemplate) => void` | yes | Called with the selected template |
| `onClose` | `() => void` | yes | Called when user taps "Cancelar" |

### Behavior

- Shows concept + formatted amount per template
- Empty state message directs user to the Plantillas tab
- Does NOT auto-close on select — caller is responsible for closing

### Usage

```tsx
import TemplatePickerModal from "../components/TemplatePickerModal";

<TemplatePickerModal
  visible={showTemplates}
  templates={templates}
  onSelect={(tpl) => {
    setConcept(tpl.concept);
    setAmount(String(tpl.amount));
    setShowTemplates(false);
  }}
  onClose={() => setShowTemplates(false)}
/>
```

---

## FloatingActionButton

**File:** `components/FloatingActionButton.tsx`  
**Export:** default

Reusable bottom-right floating action button.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onPress` | `() => void` | yes | Press handler |
| `label` | `string` | no | Button text (default: `"+"`) |
| `className` | `string` | no | Extra Tailwind classes |

### Usage

```tsx
import FloatingActionButton from "../components/FloatingActionButton";

<FloatingActionButton onPress={() => router.push("/templates/new")} />
```
