# Technical decisions

Decisions from the phase 1 spikes (step 2), with what was tested. Add new decisions at the bottom.

## 1. Storage on the web: use expo-sqlite everywhere

**Decision:** one storage implementation, `expo-sqlite`, on Android and on the web. No separate IndexedDB version. Use only the async API (`openDatabaseAsync`, `runAsync`, `getFirstAsync`, `getAllAsync`, `execAsync`, `withTransactionAsync`).

**Why:** it works in the browser today, so a second implementation would be extra code to keep in step for no gain.

**Tested on 2026-10-12** (Expo SDK 57, expo-sqlite 57.0.4, headless Chrome on Windows, static web export):

- A page opened the database, ran two migrations, inserted a row and counted rows.
- Across three separate browser launches the count went 1, 2, 3, so data persists after the browser closes.
- It worked with and without the `Cross-Origin-Embedder-Policy` / `Cross-Origin-Opener-Policy` headers. The headers are only needed for the sync API, which we do not use, so the web host needs no special configuration.

**Limits found:**

- **One tab at a time.** A second tab on the same site fails to open the database (`NoModificationAllowedError` from `createSyncAccessHandle`). The app must catch this and show "already open in another tab".
- **Expo labels web support alpha.** All database access goes through our own functions (`addFood`, `getDay`, ...), never `expo-sqlite` directly from a screen, so the web side can be replaced if it proves unreliable.
- **Not supported on web:** `withExclusiveTransactionAsync`. Use `withTransactionAsync`.
- **Metro needs `wasm` in `assetExts`** (see `metro.config.js`).

**Not tested:** Safari, Firefox, and a real Android device. Android uses the native SQLite build, which is the stable path; it gets its first real test when the food log lands (step 4).

## 2. Database upgrades: numbered migrations with `PRAGMA user_version`

**Decision:** the schema version is SQLite's `user_version`. Upgrades are an ordered list of migrations, each moving the database up one version. The runner is `src/db/migrate.ts`.

**Rules:**

- Each migration and its version bump run in one transaction, so a failure leaves the database untouched.
- A shipped migration is never edited or removed; changes go in a new one.
- A table is never dropped or rewritten in the migration that replaces it. Copy the data first and remove the old table in a later release.
- A database newer than the app (version higher than the app knows) is refused, not downgraded.

**Tested** by unit tests against real SQLite (`src/db/__tests__/migrate.test.ts`, using Node's built-in `node:sqlite`): fresh install, upgrade that keeps existing rows, no-op when current, rollback on failure, refusal of a newer database, and upgrade of a database file left on disk by an earlier release.

## 3. Android signing key: EAS-managed upload key plus Play App Signing

**Decision:**

- EAS Build generates and stores the Android keystore. It is not kept in the repo (`*.jks` is ignored).
- Download a backup of the keystore with `eas credentials` right after the first build and keep it somewhere safe outside the repo.
- When the app is created in Play Console, enrol in Play App Signing. Google then holds the real app signing key and the EAS keystore is only the upload key, which Google can reset if it is ever lost.
- Builds for testers use the `preview` profile (an installable APK); the store build uses `production` (an app bundle). Both are in `eas.json`.

**Why:** losing the only signing key means the installed app can never be updated. With Play App Signing the key that can be lost is replaceable.

**Not yet done (needs the account owner):**

1. Create or log in to an Expo account: `npx eas-cli@latest login`.
2. Run the first build: `npx eas-cli@latest build --profile preview --platform android`. This creates the keystore and confirms `eas.json` works.
3. Back up the keystore with `npx eas-cli@latest credentials`.

Until the first build is run, `eas.json` is untested.

**Package name (chosen 2026-10-12):** `com.adityanilabh.SehatAM`, set in `app.json`. It becomes permanent once the app is published on the Play Store.

## 4. Choices made while building steps 3 to 8

- **Day boundary.** An entry's day is decided once, when it is made, from the phone's local time and the day-start hour (default 4 am, changeable in Settings). It is stored as a plain date, so a later time-zone change never moves entries. Changing the day-start hour affects new entries only.
- **One weight per day.** Logging a weight for a day that already has one replaces it.
- **Items added to today are stamped with the current time**; items added to a past day get no time. Either can be changed in the edit sheet.
- **Time is typed, not picked.** The time field accepts "8:30", "0830" or "8" instead of using a native time picker, which keeps one implementation across Android and web.
- **Sheets are in-screen modals**, not routes. The tab bar only shows registered tabs, and a modal avoids restructuring the routes.
- **Screens refresh through one revision counter.** Any write calls `invalidate()`, and every query re-runs. Simple, and fast enough at this data size.
- **No date library.** The few date functions needed are in `src/lib/day.ts` with tests, so `date-fns` was not added.
- **Backups merge on import.** Rows are matched by id and the most recently edited copy wins, so importing twice or importing an old file loses nothing.
- **Export uses the share sheet on Android** and a download in the browser.
- **Reminders are local notifications**, scheduled by the phone with fixed ids so re-scheduling replaces them. They are not offered in the browser.
- **The history limit is one constant**, `FREE_HISTORY_DAYS` in `src/constants/limits.ts`.
- **Calories are not shown anywhere yet.** The column and the calorie target are stored, ready for phase 2.
- **Reminders are not loaded inside Expo Go on Android.** `expo-notifications` throws on import there, so it is loaded lazily and only where it can run. Reminders need a development or release build.

## 5. Changes after first use on a phone (2026-10-12)

- **Meals.** Schema version 2 adds a nullable `meal` column to `food_entry`. The meals are breakfast, lunch, evening snack and dinner, listed in `src/lib/meals.ts`; an item may have none and then shows under "Other". When adding to today, the meal for the current time of day is preselected.
- **Backup format 2** adds `meal` to food rows. Format 1 files still import.
- **Pounds.** Weights are always stored in kilograms; the unit (kg or lb) is a setting that only changes how weights are shown and typed. Stored weights keep two decimal places so a weight typed in pounds shows as the same number afterwards.
- **Getting back to today.** Pulling the Food screen down returns to today on a phone. Browsers have no pull-to-refresh, so a "Back to today" button also appears whenever another day is shown.
- **Calendar.** "Pick a date" opens a month grid. Future days cannot be chosen, and days with food logged carry a dot.
- **Number settings have a Save button.** It appears once the value is changed, and "Saved" shows afterwards. Leaving the field still saves.
- **Transactions wait their turn.** The database adapter queues transactions, because two writes started close together failed with "cannot start a transaction within a transaction".

**Checked in a desktop browser only:** every screen was driven in headless Chrome (add, edit, delete, change day, log weight, export, delete all, import, restart). **Not checked on a phone:** keyboard behaviour around the add box and sheets, the Android share sheet and file picker, and whether reminders fire.
