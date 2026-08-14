# AGENTS.md

AquaTrack Mobile — field technician + consumer resident companion to the AquaTrack Web command center. Expo SDK 57 (React Native 0.86, React 19) + NativeWind v4 (Tailwind) + React Navigation v6 + Zustand + Supabase (Auth, Realtime, Postgres) + expo-notifications (FCM).

> ⚠️ **Expo has changed.** Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Commands

- Install: `npm install` (plain — no `--legacy-peer-deps` needed here, unlike aquatrack-web).
- Dev server (Metro): `npm start`. Open on device/emulator via the Expo dev client.
- Native builds: `npm run android` / `npm run ios` (= `expo run:android` / `expo run:ios`). Requires `npx expo prebuild` first.
- Web: `npm run web` (works, but push notifications and native maps don't apply).
- **There is NO test suite in this repo** (unlike aquatrack-web's vitest). No `npm test`, no typecheck (plain JS, no tsconfig). Verification is manual + the web repo's tests.
- Debug APK: `npx expo prebuild --platform android --clean` → recreate `android/local.properties` → `cd android; .\gradlew assembleDebug`. Release: `.\gradlew assembleRelease`.
- Hot reload over USB: `adb reverse tcp:8081 tcp:8081` after installing the debug APK.

## Config & Env (hardcoded — no dotenv)

- `src/config/supabase.js` — **hardcoded** `SUPABASE_URL` + `SUPABASE_ANON_KEY` (project ref `eivmilbjlkanxclysczl`). Do NOT commit real secrets; the anon key is public by design. Auth session is persisted via a custom AsyncStorage adapter (`src/config/supabaseStorage.js`).
- `src/config/api.js` — `API_BASE_URL` **hardcoded** to `http://192.168.100.64:3000` (dev machine LAN IP). Update this to your machine's IPv4 (`ipconfig`) or nothing can reach the Next.js API. Uses cleartext HTTP on Android (`usesCleartextTraffic: true` in `app.json`).
- `google-services.json` (root) — Firebase config for package `com.aquatrack.mob`; required for FCM push. Not gitignored → treat as sensitive.
- `.env*.local` files are gitignored but the app doesn't read any env files — config lives in the `src/config/` files above.
- `eas.json` — EAS dev-client/preview/production build profiles (`projectId` in `app.json.extra.eas`).

## Backend it talks to (aquatrack-web, NOT this repo)

The app is a thin client over the Next.js API. Endpoints used by mobile:

| Endpoint | Used by |
|---|---|
| `POST /api/auth/profile` | almost every screen (role fetch) |
| `POST /api/auth/register` | Login.js (auto-register path), Register.js |
| `POST /api/auth/location` | SubAdminHome (tech live location — see note below) |
| `POST /api/auth/push-token` | `src/config/fcm.js` (FCM token registration) |
| `GET /api/advisories` | Announcements, ConsumerHome, SubAdminAdvisories, notification store |
| `GET /api/admin/nodes` | SubAdminHome, SubAdminTelemetry |
| `GET/PUT /api/admin/complaints` | SubAdminComplaints |
| `POST /api/complaints` | FileComplaint |
| `POST /api/locate-barangay` | FileComplaint (geocode + out-of-scope check) |
| `POST /api/triage` | FileComplaint (Gemini diagnosis) |

Some screens also query Supabase directly (`.from('Complaint')`, `.from('TelemetryReading')`, `.from('Advisory')`) and subscribe to **Supabase Realtime** `postgres_changes` channels — see below.

## Architecture

- `App.js` — root: font loading, global `Text`/`TextInput` render monkey-patch, `SafeAreaProvider` + `NavigationContainer`.
- `src/navigation/RootNavigator.js` — role-based stack: no session → `Login`/`Register`; `FIELD_ENGINEER_TECHNICIAN` → `SubAdminTab` (4 tabs); else `ConsumerTab` (6 screens). **`ADMIN` role is force-signed-out on mobile** (web-only role).
- `components/` — `consumerpages/`, `subadminpages/`, `authpages/`. Each screen pairs with a `[Name].styles.js` stylesheet module. `subadminpages/` shares `TechHeader.js` (gradient header + notification drawer + metrics bar).
- `src/store/` — Zustand stores: `useAuthStore` (persisted to AsyncStorage), `useNotificationStore` (consumer notifications), `useTechNotificationStore` (tech notifications).
- `src/config/` — `api.js`, `supabase.js`, `supabaseStorage.js`, `fcm.js`, `theme.js`.
- Styling is **NativeWind v4**: `className` props work because `babel.config.js` sets `jsxImportSource: "nativewind"` and `metro.config.js` uses `withNativeWind(config, { input: './global.css' })`. `tailwind.config.js` adds brand colors (`primary #001e66`, `accent #00aeef`).

## Realtime (Supabase WebSocket)

Channels are created and **must be removed on unmount** (`supabase.removeChannel(channel)`):

- `TrackComplaints.js` — `resident-complaints-{userId}` postgres_changes on `Complaint`.
- `ConsumerHome.js` — `home-realtime-{userId}` channels for advisories + complaints.
- `SubAdminComplaints.js` — `tech-complaints-list` (event `*` on `Complaint`).
- `SubAdminTelemetry.js` — `tech-telemetry-realtime` (INSERT on `TelemetryReading`).

## Technician live location (`SubAdminHome.js`)

- `startLocationTracking` effect (runs once, `[]`) requests foreground location, then posts the initial fix to `POST /api/auth/location`, then `watchPositionAsync` (`distanceInterval: 50m`, `timeInterval: 60s`) posts on every move. Subscribes only if mounted; `subscription.remove()` on unmount.
- **Robustness fix (do not regress):** `Location.getCurrentPositionAsync()` is wrapped in `try/catch` falling back to `Location.getLastKnownPositionAsync()`; if both yield nothing, the effect `console.warn`s `Technician location unavailable — live tracking skipped` and returns WITHOUT starting the watcher. A bare `getCurrentPositionAsync` (no fallback) is a known regression — it silently fails on devices where the foreground fix is unavailable.

## Recovery from Metro cache (gitcheckout accidents)

- If uncommitted edits to a screen are accidentally reverted by `git checkout`, the last-bundled version often survives as the module text inside `%LOCALAPPDATA%\Temp\metro-cache\**\*.mp` files. Search the cache for a unique symbol from the lost code (e.g. `distanceInterval`, `startLocationTracking`, `MapboxGL.default.PointAnnotation`), then extract the Babel-compiled module — it can be reverse-translated back to source. This is how the FileComplaint Mapbox map and the SubAdminHome location fix were both recovered.

## Maps — Mapbox (native) + OSM iframe (web)

- `@rnmapbox/maps` **10.3.5** (Mapbox Maps SDK v11 via `RNMapboxMapsVersion: "11.23.1"`) provides the interactive map on **native** (Android/iOS) in `components/consumerpages/FileComplaint.js`.
- Access token is the **public pk.** token (`src/config/mapbox.js`, same as the web repo's `NEXT_PUBLIC_MAPBOX_TOKEN`); set at module load via `MapboxGL.setAccessToken()`. Never commit a secret `sk.` token.
- Mapbox is **NOT available in Expo Go** — it requires a dev/custom build (`npx expo prebuild` + rebuild). `index.native.js` (native) and `index.js` (web) entries exist; Metro picks native on Android/iOS.
- The **web target still uses the OSM iframe** (`WebMap`) and the "Awaiting Location" placeholder — Mapbox native code is guarded by `Platform.OS !== 'web'`, so web behavior is unchanged.
- Pin is an interactive draggable red `PointAnnotation`; `onDragEnd` re-runs `/api/locate-barangay` (barangay + out-of-scope detection). Camera focuses via a ref (`cameraRef` + `mapReadyRef`) — never render/mount the map with `setTimeout` patterns. Current Mapbox JSX in FileComplaint was verified byte-for-byte against the pre-revert bundle (see Recovery from Metro cache).
- `react-native-maps` (Google/Apple native maps) is still installed but **unused** — FileComplaint no longer imports it. Do not reintroduce it for Mapbox features.
- `mapbox-gl` is installed as an optional peer dep so the `npm run web` build resolves the library's web entry.
- The San Fernando 788-vertex geofence boundary is NOT bundled here; geofencing is enforced server-side via `/api/locate-barangay` (mobile only shows an `outOfScope` warning string).
- After touching `app.json` plugins or bumping `@rnmapbox/maps`: re-run `npx expo prebuild --platform android` (regenerates `android/`) and **recreate `android/local.properties`** (wiped on prebuild).

## Push Notifications (`src/config/fcm.js`)

- `expo-notifications` via a **dev build / custom build only**. In **Expo Go, remote push tokens are not supported on SDK 53+** — `isExpoGo` short-circuits and returns null.
- `requestUserPermission(userId)` gets a device push token and registers it via `POST /api/auth/push-token`.
- `registerNotificationListeners()` wires foreground + response listeners (advisory tap → `Announcements` screen).

## Fonts — GOTCHA

`App.js` monkey-patches `Text.render` and `TextInput.render` to remap bare `fontWeight` values to real loaded font files (`PlusJakartaSans_*` and `GeistMono-*`). Any new screen inheriting these relies on this patch — do not remove it, and don't expect plain `fontWeight` to apply unless the matching font family is loaded.

## Build / Native pitfalls (from README — verified)

- After `npx expo prebuild --platform android --clean`, `android/local.properties` is wiped and MUST be recreated: single line `sdk.dir=C\:/Users/<username>/AppData/Local/Android/Sdk` (forward slashes or escaped colon — NOT plain backslashes).
- Gradle `NDK did not have a source.properties file` error → reinstall NDK **27.1.12297006** via Android Studio SDK Manager (uncheck → Apply → re-check → Apply).
- `metro.config.js` sets `resolver.unstable_enablePackageExports = false` — **do not re-enable**; it breaks the Supabase client (`stream`/`ws` Node-core imports). `blockList` excludes gradle/build folders from the Metro watcher.
- `app.json` requires `google-services.json` present or Android builds fail.

## Conventions

- Screens are plain JS (no TS). Match existing structure: logic in the `.js` screen, styles in the paired `.styles.js`, NativeWind `className` for layout tokens, `theme.js` colors otherwise.
- **Icons = `lucide-react-native` via the central `components/AppIcon.js` wrapper.** Do NOT import `@expo/vector-icons` (Ionicons). `AppIcon` accepts the same `name`/`size`/`color`/`style` props as Ionicons and maps the legacy Ionicons name strings (e.g. `'arrow-back'`, `'document-text-outline'`, `'construct-outline'`) to Lucide components. Static AND dynamic `name={...}` usages work unchanged. To add an icon, import the Lucide component in `AppIcon.js` and register its name in `ICON_MAP`. Requires `react-native-svg` (already installed); native rebuild needed if it's ever removed.
- Navigation is always passed from `RootNavigator`; use `navigation.navigate('ScreenName')`. Notification routing uses `src/navigation/navigationRef.js` (`navigate()`).
- Role string on the platform is `FIELD_ENGINEER_TECHNICIAN` (sub-admin). In the web DB the role enum is `FIELD_TECHNICIAN` — check the web `/api/auth/profile` return shape if changing roles.
- Complaint statuses surfaced on mobile: `PENDING`, `EVALUATING`, `DISPATCHED`, `ONGOING`, `RESOLVED` (see `statusLabels` in `useNotificationStore.js`).
- Brand assets live in `assets/` (`LOGO1/2/3.png`, `favicon.png` used as the native notification icon with `#00aeef` tint).

## Mapbox integration status (implemented)

- **Done:** native interactive Mapbox map in `FileComplaint.js` (draggable red pin, camera follow, `/api/locate-barangay` re-validation on drag end). Web target unchanged (OSM iframe + "Awaiting Location" placeholder). See the Maps section above for the full current state.
- **Not yet ported from web:** the 3D neon geofence wall, heatmaps, complaint pin overlays, and satellite previews that exist in the aquatrack-web Mapbox maps. Adding them requires the geofence polygon coordinates (they live only in the web repo's `src/lib/san-fernando-boundary.ts`) to be bundled or fetched via API, plus `ShapeSource`/`FillExtrusionLayer` layers.
- **Native rebuild required after map changes:** `npx expo prebuild --platform android` + recreate `android/local.properties`. Mapbox renders only in a custom/dev build, never in Expo Go.
