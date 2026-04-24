# pagos-cr

A React Native mobile app built with Expo for payment processing in Costa Rica.

## Tech Stack

- **Expo** ~55.0.0
- **React Native** 0.83.4
- **React** 19.2.0
- **NativeWind** v4 — Tailwind CSS for React Native
- **Gluestack UI** v3 — UI component library
- **expo-sqlite** — local database
- **react-native-reanimated** 4.2.1
- **TypeScript** ~5.9

## Getting Started

Install dependencies:

```bash
npm install --legacy-peer-deps
```

Start the dev server:

```bash
npm start
```

Run on a specific platform:

```bash
npm run ios
npm run android
npm run web
```

## Project Structure

```
├── App.tsx                  # App entry point
├── index.ts                 # Expo entry registration
├── components/
│   └── ui/
│       ├── button/          # Gluestack Button component
│       └── gluestack-ui-provider/  # Theme provider
├── assets/                  # Icons, splash, images
├── global.css               # Global Tailwind styles
├── tailwind.config.js       # Tailwind configuration
├── babel.config.js          # Babel configuration
├── metro.config.js          # Metro bundler configuration
└── tsconfig.json            # TypeScript configuration
```

## UI Labels

All user-visible strings live in `constants/labels.ts`. Import `LABELS` and reference the appropriate key — do not hardcode Spanish strings in components.

## Notes

- Use `--legacy-peer-deps` when installing packages due to peer dependency conflicts between NativeWind v4 and Gluestack UI v3.
- Tailwind CSS is pinned to v3 — NativeWind v4 does not support Tailwind v4.
- `expo-sqlite` is configured as an Expo plugin in `app.json`.

## Entity Diagram

### High level

```
contacts ──────────< charges
    |                   |
    |                   └──────< charge_lines
    |
    └──────< contact_templates >──────── charge_templates
```

### Expanded

```
contacts                        charge_templates
+------------------+            +---------------------------+
| id               |            | id                        |
| name             |            | concept                   |
| phone            |            | amount                    |
| notes            |            | type: recurring | extra    |
| active           |            +---------------------------+
+------------------+                      |
        |                                 |
        | 1                     contact_templates
        |                       +---------------------------+
        | *                     | id                        |
+------------------+            | contact_id (FK)           |
| charges          |            | template_id (FK)          |
+------------------+            | active                    |
| id               |            +---------------------------+
| contact_id (FK)  |
| due_date         |
| status           |  ← derived: pending | overdue | paid
+------------------+
        |
        | 1
        |
        | *
+---------------------+
| charge_lines        |
+---------------------+
| id                  |
| charge_id (FK)      |
| concept             |
| amount              |
| description         |  ← free text e.g. "Lucas + Clarita"
| type                |  ← recurring | extra
| status              |  ← pending | overdue | paid
| payment_method      |
| paid_at             |
+---------------------+
```

### Example — Marco, May 2026

```
contact:  Marco  +506 8888-1111
charge:   due 2026-05-02  status: pending
  line 1  tuition  "Lucas + Clarita"  380000  recurring  [pending]
  line 2  ballet   "Clarita"           25000  extra      [pending]
  total pending: 405000

after paying line 1:
  line 1  [paid 2026-05-03  sinpe]
  line 2  [pending]
  total pending: 25000
```