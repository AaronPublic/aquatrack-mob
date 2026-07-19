# AquaTrack Mobile Application

A production-ready municipal water district mobile application built for water anomalies reporting and field operations, featuring high-performance state caching, native mapping, and real-time push alerts.

## Tech Stack

### Frontend
- **Framework**: React Native 0.86.0 compiled via Expo SDK 57.0.7 for native cross-platform iOS and Android user interfaces.
- **Styling**: NativeWind v4 (Tailwind CSS utility engine for mobile layout compiling) paired with custom theme tokens.
- **Navigation**: React Navigation v6 using `@react-navigation/native-stack` (dynamic authentication gateways) and `@react-navigation/bottom-tabs` (icon-only navigation bars).
- **Icons**: `@expo/vector-icons` (Ionicons) for unified, system-style vector icons.

### State Management & Storage
- **Runtime State**: Zustand for lightweight, hook-based application global runtime state handling.
- **Local Storage Cache**: `react-native-mmkv` for high-performance, synchronous C++ based key-value storage of sessions and profiles.

### Hardware & Geospatial Layer
- **Geo-Location**: `expo-location` to fetch real-time, high-accuracy physical WGS84 device coordinates.
- **Media Capture**: `expo-image-picker` to request camera/gallery permissions and capture photos.
- **Interactive Mapping**: `react-native-maps` to render interactive municipal map canvases and draggable incident markers.

### Backend Integration
- **Database & Auth Connector**: `@supabase/supabase-js` client SDK configured with a custom MMKV storage adapter for session persistence and live WebSocket channel updates.
- **API Services Connection**: Fetch client configured with platform-specific host routing to Next.js API endpoints.
- **Push Alerts**: Firebase Cloud Messaging (FCM) via `@react-native-firebase/app` and `@react-native-firebase/messaging` for live foreground and background notification pathways.

---

## Setup Instructions

### 1. Clone the repository
Ensure you are in the workspace folder:
```bash
cd aquatrack-mob
```

### 2. Install dependencies
Install standard node modules and Expo modules:
```bash
npm install
```

### 3. API Server Setup
Verify host mappings in [src/config/api.js](file:///C:/Users/AJ/CAPSTONE/aquatrack-mob/src/config/api.js). For local emulators, the configuration maps automatically:
*   **Android Emulator**: `http://10.0.2.2:3000`
*   **iOS Simulator / Expo Go**: `http://localhost:3000`

### 4. Firebase Setup (Optional)
To enable real push notifications on physical devices:
1. Register your package name in the Firebase Console.
2. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS).
3. Drop them into the root folder of `aquatrack-mob`.
4. Run `npx expo prebuild` to compile native settings.

### 5. Run local development
Launch the Expo packager:
```bash
npm run start
```
Scan the QR code with **Expo Go** on your physical phone, or press `a` for Android Emulator / `i` for iOS Simulator.

---

## Mobile App Routing

| Tab / Screen | Access Role | Description |
| :--- | :--- | :--- |
| `Login` | Logged out | Credential sign-in form with active redirect guards. |
| `Register` | Logged out | Resident account registration with strict password checking. |
| `ConsumerHome` | Resident | Dashboard home showing dynamic incident counters, critical alerts feed, and quick shortcuts. |
| `FileComplaint` | Resident | Guided incident form with Mapbox coordinate picking, camera capture, and Gemini AI analysis. |
| `TrackComplaints` | Resident | Historical complaint timeline showing active ticket status logs. |
| `Announcements` | Resident / Sub-Admin | Public bulletins list detailing advisory events and warnings. |
| `ContactSupport` | Resident | Water district hotline details and sub-office address information. |
| `SubAdminHome` | Technician | Technician command center showing active work orders and crew task toggles. |
| `SubAdminComplaints` | Technician | Interactive complaints triage registry with fly-to-marker Mapbox triggers. |
| `SubAdminTelemetry` | Technician | Sensor Network HUD displaying real-time water quality parameter readouts. |

---

## Authentication

The mobile client leverages **Supabase Auth** integrated with **Zustand** and **MMKV** for secure, persistent session routing:

1. **Persisted Storage Adapter**: We configure the Supabase client in [supabase.js](file:///C:/Users/AJ/CAPSTONE/aquatrack-mob/src/config/supabase.js) to use a custom storage adapter [supabaseStorage.js](file:///C:/Users/AJ/CAPSTONE/aquatrack-mob/src/config/supabaseStorage.js) backed by `react-native-mmkv`.
2. **Synchronous Caching**: When a user logs in, their Supabase session and user profile (role) are updated in [useAuthStore.js](file:///C:/Users/AJ/CAPSTONE/aquatrack-mob/src/store/useAuthStore.js) and synced synchronously to MMKV storage.
3. **Instant Auth Checks**: On app launch, [RootNavigator.js](file:///C:/Users/AJ/CAPSTONE/aquatrack-mob/src/navigation/RootNavigator.js) queries MMKV storage synchronously to route the user instantly to their portal, eliminating blank screens or loading lags.
4. **Sign Out Pruning**: Signing out clears the Zustand store state and completely deletes the persisted MMKV files, redirecting cleanly to the `Login` screen.

---

## Useful Operations

### Run expo start
```bash
npm run start
```

### Syntax Validation
Verify javascript files for syntax errors using node's compiler checker:
```bash
node -c C:/Users/AJ/CAPSTONE/aquatrack-mob/App.js
```

---

## Feature Details, Testing & Verification

### 1. Zustand & MMKV Caching
- **Implementation**: Managed via [useAuthStore.js](file:///C:/Users/AJ/CAPSTONE/aquatrack-mob/src/store/useAuthStore.js) and [supabaseStorage.js](file:///C:/Users/AJ/CAPSTONE/aquatrack-mob/src/config/supabaseStorage.js). Caches the user session and metadata profile synchronously.
- **Verification**:
  1. Log into the application as a resident or technician.
  2. Kill the application process.
  3. Reopen the application.
  4. **Expected**: The app bypasses the Login screen and loads the appropriate dashboard instantly.

### 2. NativeWind (Tailwind CSS) Layout Engine
- **Implementation**: Styled using NativeWind v4 directives in [global.css](file:///C:/Users/AJ/CAPSTONE/aquatrack-mob/global.css) and configuration files. Showcase implementation successfully refactored in [ContactSupport.js](file:///C:/Users/AJ/CAPSTONE/aquatrack-mob/components/consumerpages/ContactSupport.js).
- **Verification**:
  1. Navigate to the Support / Hotline screen.
  2. **Expected**: Element margins, colors, text alignment, and borders render exactly matching the CSS-utility properties (`className`), and the layout remains fluid across screen resizing.

### 3. Firebase Cloud Messaging (FCM) Push Notifications
- **Implementation**: Handled via [fcm.js](file:///C:/Users/AJ/CAPSTONE/aquatrack-mob/src/config/fcm.js) and Next.js backend `/api/auth/push-token` endpoints. Triggered on advisory publish.
- **Verification**:
  1. Log into the application and check terminal/IDE logs to confirm `FCM Authorization status` and the `Device FCM Token` generated.
  2. Check the Next.js server console to confirm `POST /api/auth/push-token` was called with the correct `userId` and token.
  3. Publish a new advisory using the Web Admin portal (`POST /api/advisories`).
  4. **Expected**: Web server outputs FCM log detailing target tokens and data payload.
