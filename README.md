# NyayMitra

A fitness app for logging what you eat and tracking your weight. It is being built as an MVP in phases; this README covers phase 1.

## MVP phase 1

Phase 1 is the app working fully on the device, with no AI, no login and no backend. You log your food and your weight, and the app shows that data back to you.

### Features

- **Food log:** add an item in one line, with optional time and quantity; edit and delete.
- **Days:** switch between days and view past ones. Each item is assigned to a day, so late-night eating can count for the previous day.
- **Weight:** log weight when you like, with a graph (7 days and 25 days) that redraws from the entries, plus start, target and to-go figures.
- **Home:** today's item count, latest weight and the last few items eaten.
- **Streaks:** consecutive days with at least one entry.
- **Reminders:** daily reminders to log food and weight (Android).
- **Settings:** target weight, daily calorie target, day-start time, export and import of data, delete all data.

### Platforms

- **Android:** the main target.
- **Windows and Mac:** the web version in a browser.
- **iPhone:** only after the Android app is released.

### Not in phase 1

- Calorie estimates from AI (phase 2).
- Photos, meal plans and grocery links.
- Sign in, cloud storage and sync.
- Walking counter.

### Data

Everything is stored in a local database on the device and works offline. Records carry unique IDs and timestamps so cloud sync can be added later without a rewrite.

## Tech stack (phase 1)

- TypeScript, React Native with Expo, Expo Router
- `expo-sqlite` for local storage
- `react-native-svg` for charts
- `expo-notifications` for reminders
- Jest for unit tests
- EAS Build for Android builds, Vercel for the web version

A Java (Spring Boot, PostgreSQL) backend is planned for later phases.

## Running the app

Requires Node.js 20.19 or newer (developed on Node 24) and, for Android, the Expo Go app on a phone connected to the same Wi-Fi as the computer.

```bash
npm install
npx expo start
```

Then scan the QR code with Expo Go to open the app on Android, or press `w` to open it in the browser.

| Command | What it does |
|---|---|
| `npm start` | Starts the development server |
| `npm run web` | Starts it and opens the browser version |
| `npm test` | Runs the unit tests |
| `npm run typecheck` | Checks types |
| `npm run lint` | Runs the linter |
| `npm run export:web` | Builds the static web version into `dist/` |

Install new packages with `npx expo install <package>` so the versions match the Expo SDK.

## Project layout

- `src/app/` — one file per screen (Expo Router); `_layout.tsx` loads fonts and the tab bar.
- `src/components/` — shared pieces: screen wrapper, card, button, text, tab bar.
- `src/constants/theme.ts` — colours, fonts, spacing and radii from the mockups.
- `src/db/` — database code; `migrate.ts` runs schema upgrades.
- `src/lib/` — plain logic with unit tests.
- `docs/decisions.md` — technical decisions and what was tested.

## Status

Steps 1 and 2 of 9 are done: the app opens with four empty tabs (Home, Food, Weight, Settings) in the mockup styling, and the storage, database upgrade and signing decisions are recorded in `docs/decisions.md`. No features are built yet.
