# AquaTrack Mobile Application

AquaTrack Mobile is a production-ready mobile application built for water district management. It serves as the mobile interface for consumers (residents) to file water anomaly complaints and track status, and for sub-admins (field technicians) to manage work assignments, triage complaints, and monitor live IoT telemetry node sensor metrics. The application interfaces directly with Supabase for authentication and database management, alongside a Next.js API server.

---

## 🛠️ Technology Stack

- **Framework**: Expo (SDK 57) / React Native (0.86.0)
- **Navigation**: React Navigation v6 (Native Stack + Bottom Tabs)
- **Backend & Database**: Supabase JS (Auth & DB direct connection)
- **Geolocation**: `expo-location` (GPS tracking) & `react-native-maps` (map viewer)
- **Media Upload**: `expo-image-picker` (camera & gallery upload access)
- **Icons**: `@expo/vector-icons` (Ionicons)
- **Styling**: Pairs each screen component with a companion stylesheet built using React Native `StyleSheet.create()`.

---

## 📂 Project Folder Structure

```text
aquatrack-mob/
├── App.js                            # App root component
├── index.js                          # Launcher entry point
├── app.json                          # Expo configuration settings
├── metro.config.js                   # Metro bundler config
├── package.json                      # Dependencies and scripts
│
├── assets/                           # Image assets, icons, logos, and background surfaces
│
├── src/
│   ├── config/
│   │   ├── supabase.js               # Supabase JS client configuration
│   │   ├── api.js                    # API client definitions (development proxy configuration)
│   │   └── theme.js                  # Brand style guide design tokens (colors, fonts, margins)
│   └── navigation/
│       └── RootNavigator.js          # Authentication router and screen stacks navigator
│
└── components/
    ├── authpages/                    # Auth login & register forms
    ├── consumerpages/                # Resident dashboard, ticket trackers, and report forms
    └── subadminpages/                # Technician command dashboard, triage list, and telemetry
```

---

## 🚀 How to Install and Run

1. **Install Dependencies**: Open a terminal in the project root directory and run:
   ```bash
   npm install
   ```

2. **Configure Environment API Host**:
   Proxy host IP addresses are initialized in [src/config/api.js](file:///C:/Users/aaron/Downloads/AquaT/aquatrack-mob/src/config/api.js) to map localhost requests correctly depending on the testing target:
   ```javascript
   export const API_BASE_URL = Platform.select({
     android: 'http://10.0.2.2:3000', // standard fallback to host machine
     default: 'http://localhost:3000',
   });
   ```

3. **Start the Packager**: Launch Expo Go developer packager menu:
   ```bash
   npm run start
   ```

4. **Run the App**: Scan the terminal QR code using the **Expo Go** application on your physical mobile device, or press `a` for Android Emulator / `i` for iOS Simulator.
