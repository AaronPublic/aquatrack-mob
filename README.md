# AquaTrack Mobile Application

A production-ready mobile application built for water anomaly reporting and field operations, featuring real-time ticket tracking, AI-assisted diagnostics, push notifications, and a unified consumer dashboard.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React Native 0.86.0 via Expo SDK 57
- **Styling**: NativeWind v4 (Tailwind CSS utility engine for React Native)
- **Navigation**: React Navigation v6 — `@react-navigation/native-stack` + `@react-navigation/bottom-tabs`
- **Icons**: `@expo/vector-icons` (Ionicons)
- **Typography**: Plus Jakarta Sans (via `@expo-google-fonts/plus-jakarta-sans`) as the global default font; Geist Mono for numeric readouts
- **Animations**: `react-native-reanimated` + `react-native-gesture-handler`

### State Management & Storage
- **Runtime State**: Zustand for lightweight hook-based global state
- **Persistent Cache**: `@react-native-async-storage/async-storage` for session persistence across app restarts

### Hardware & Geospatial
- **Geo-Location**: `expo-location` — real-time WGS84 coordinates
- **Media Capture**: `expo-image-picker` — camera and gallery access
- **Interactive Maps**: `react-native-maps` — draggable markers and map canvases

### Backend Integration
- **Database & Auth**: `@supabase/supabase-js` with AsyncStorage session adapter
- **Realtime**: Supabase Realtime WebSocket subscriptions for live ticket state sync
- **API Layer**: Fetch client with platform-specific routing to Next.js API endpoints
- **AI Diagnostics**: Gemini AI integration for complaint classification and urgency scoring
- **Push Notifications**: `expo-notifications` — FCM token registration and foreground/background alert handling

---

## 🚀 Setup & Launch (For Team Members)

### Prerequisites
- **Node.js** and **npm** installed
- **Android Studio** with the Android SDK and a configured emulator (or a physical Android device)

### 1. Install Dependencies
```bash
npm install
```

### 2. Register Google Services File
Download `google-services.json` from Firebase Console (configured for package `com.aquatrack.mob`) and place it in the root of `aquatrack-mob/`.

### 3. Configure the API Base URL
Open [`src/config/api.js`](file:///C:/Users/AJ/CAPSTONE/aquatrack-mob/src/config/api.js) and set your machine's local Wi-Fi IP:
```javascript
export const API_BASE_URL = Platform.select({
  android: 'http://192.168.x.x:3000', // Replace with your IPv4 address
  default: 'http://192.168.x.x:3000',
});
```
> Run `ipconfig` in Command Prompt and look for the **IPv4 Address** under your active Wi-Fi adapter.

---

## 📦 Building a Debug APK (Physical Device Testing)

### Step 1 — Generate Native Android Project
```bash
npx expo prebuild --platform android --clean
```

### Step 2 — Create `local.properties`
After prebuild completes, Gradle needs to know where your Android SDK is located. This file is **git-ignored** and must be recreated manually after every `--clean` prebuild.

**Option A — PowerShell (one-liner):**
```powershell
Set-Content -Path android\local.properties -Value "sdk.dir=C\:/Users/<Your-Username>/AppData/Local/Android/Sdk"
```

**Option B — Create the file manually:**
1. Navigate to `aquatrack-mob\android\`
2. Create a new file named exactly `local.properties`
3. Paste the following content (replace `<Your-Username>`):
   ```properties
   sdk.dir=C\:/Users/<Your-Username>/AppData/Local/Android/Sdk
   ```

**To find your username**, run in PowerShell:
```powershell
echo $env:USERNAME
```

> ⚠️ **Important formatting rules for this file:**
> - Use **forward slashes** `/` or an escaped colon `C\:` — do NOT use plain Windows backslashes
> - The file must be a single line with no extra spaces or line breaks
> - Verify the file with: `Get-Content android\local.properties`
> - Expected output: `sdk.dir=C\:/Users/AJ/AppData/Local/Android/Sdk`

### Step 3 — Build the APK
```powershell
cd android
.\gradlew assembleDebug
```

### Step 4 — Install on Device
**Via ADB (USB):**
```bash
adb install app\build\outputs\apk\debug\app-debug.apk
```
**Or** transfer the APK manually to the device and install directly.

> **APK Output Location:**
> `android\app\build\outputs\apk\debug\app-debug.apk`

---

## 🔄 Debug APK + Hot Reload (Active Development)

For active coding sessions with instant hot-reload on a physical device:

1. Install the debug APK on your phone (see above)
2. Connect your phone via USB and enable USB Debugging
3. Set up port forwarding:
   ```bash
   adb reverse tcp:8081 tcp:8081
   ```
4. Start the packager:
   ```bash
   npm run start
   ```
5. Open the **AquaTrack** app on your phone — changes save instantly with no rebuild required

---

## 🏭 Release APK (Distribution)

To build a standalone APK with the JS bundle packaged inside (no packager needed):
```bash
cd android
.\gradlew assembleRelease
```
> **Output:** `android\app\build\outputs\apk\release\app-release.apk`
> Any code changes require a full rebuild.

---

## ⚠️ NDK Error Fix (If Gradle Fails)

If the build fails with: `NDK did not have a source.properties file`:
1. Open **Android Studio → Tools → SDK Manager → SDK Tools**
2. Check **Show Package Details**
3. Under **NDK (Side-by-side)**, find version **`27.1.12297006`**
4. Uncheck → Apply (removes corrupted files), then re-check → Apply (reinstalls clean copy)

---

## 💻 Daily Development Workflow

Once the custom build is installed on your emulator or phone:
1. Start the Next.js backend: `npm run dev` (in `aquatrack-web/`)
2. Start the mobile packager:
   ```bash
   npm run start
   ```
3. Open **AquaTrack** on your device — it auto-loads your JS bundle
4. Press **`r`** in the terminal to manually reload

---

## 🔍 Feature Verification & Testing

### 1. Session Persistence (Zustand + AsyncStorage)
- Log in → force-close the app → reopen
- **Expected**: Bypasses login, opens dashboard directly

### 2. Push Notifications
- **Advisories**: Publish a bulletin from the Web Admin dashboard
  - **Expected**: Push notification appears immediately on device
- **Ticket Status Updates**: Change a complaint's status in Web Admin
  - **Expected**: Phone receives `"Your ticket is now ONGOING"` notification
- **Tech Assignments**: Assign a complaint to a technician in Web Admin
  - **Expected**: Technician's phone receives `"New Work Order Assigned"` notification

### 3. AI-Assisted Diagnostics
- Go to **File a Complaint**, type in Tagalog/English/Kapampangan, tap **Submit**
- **Expected**: `Running AI diagnostics...` appears, followed by a Gemini diagnosis card with category, translation, and urgency level

### 4. Photo Upload (Supabase Storage)
- On the complaint form, tap **Attach Incident Photo** and select an image
- **Expected**: Photo uploads to `complaint-media` Supabase bucket and appears on the ticket detail

### 5. Realtime Sync (Supabase Websocket)
- Open **Track My Tickets** on the mobile app
- Change a ticket's status from the Web Admin dashboard
- **Expected**: The status badge and progress stepper update instantly without a manual refresh

---

## 📲 Production Build Notes

For future App Store / Play Store release builds, integration plans for native Firebase SDK and MMKV caching are documented in the project brain artifacts:
- **Zustand + MMKV Plan**: `brain/.../2026-07-19-zustand-mmkv-integration-plan.md`
- **Firebase Native SDK Plan**: `brain/.../2026-07-19-fcm-integration-plan.md`

## Session Changelog (August 6, 2026)

### Mobile App — Sub-Admin / Technician Portal (`aquatrack-mob`)

#### New Shared Header Component

- **Created `components/subadminpages/TechHeader.js`** — A reusable React Native component that renders the full AQUATRACK-branded `LinearGradient` header for all four technician screens. Accepts props: `navigation`, `subtitle`, `pageTitle`, `pageDesc`, `techName`, `metrics` (optional, only shown on home screen), `onProfilePress`.
- **Notification drawer modal** is now owned exclusively by `TechHeader` — renders a slide-up bottom sheet with complaint and advisory notifications sourced from `useTechNotificationStore`, with icon/color logic per type and urgency. Tapping a notification dismisses it and navigates to the relevant tab.
- **Metrics bar** (home screen only) displays `MY JOBS`, `UNASSIGNED`, and `IOT ALERTS` counters with color-coded values: cyan / amber / red-or-green.

#### Header Standardization Across All Screens

All four sub-admin screens now import and use `TechHeader`, replacing their previous inline `LinearGradient` header blocks. Redundant imports (`Image`, `LinearGradient`, `homeStyles`) removed from each:

| Screen | `subtitle` | `pageTitle` | Metrics bar |
|---|---|---|---|
| `SubAdminHome.js` | `TECHNICIAN PORTAL` | `FT-[FirstName]` | ✅ Yes |
| `SubAdminComplaints.js` | `TECHNICIAN TRIAGE` | `Complaints Triage` | — |
| `SubAdminTelemetry.js` | `TECHNICIAN TELEMETRY` | `IoT Telemetry Nodes` | — |
| `SubAdminAdvisories.js` | `STAFF ADVISORIES` | `Staff Advisories` | — |

Secondary screens also received the `{ navigation }` prop to enable notification routing inside `TechHeader`.

#### Metrics Counter Improvements (`SubAdminHome.styles.js`)

- Number `fontSize`: `18` → `22`, with `fontFamily: GeistMono-Regular`
- Color-coded: MY JOBS = `#00D1FF`, UNASSIGNED = `#FFCC00`, IOT ALERTS = `#FF6B6B` / `#4CD964`
- Divider height: `24` → `32`
- Label `fontSize`: `8` → `7`, `letterSpacing`: `0.8` → `1.2`

#### Brand Typography Fixes (`SubAdminHome.styles.js`)

- `brandT` color: `#00D1FF` (cyan) → **`#ffffff` (white)** — the "T" in AQUATRACK now matches AQ and RACK
- All five brand letter styles now use explicit `fontFamily: PlusJakartaSans_800ExtraBold` instead of non-standard `fontWeight: '950'` — guaranteed correct rendering on Android
- `brandSubtitle` → `PlusJakartaSans_800ExtraBold`
- `greetingText` → `PlusJakartaSans_600SemiBold`
- `techNameTitle` → `PlusJakartaSans_700Bold`

#### Metro Watcher Crash Fix

- Created the missing directory `node_modules/expo-modules-core/expo-module-gradle-plugin/bin/src/main/kotlin` to resolve an `ENOENT` crash in Metro's `FallbackWatcher` when starting Expo with a cleared cache on Windows.