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

## Status

Planning is complete and development has not started. Setup and run instructions will be added once the project is scaffolded.
