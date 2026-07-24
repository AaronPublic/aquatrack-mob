# AquaTrack Mobile Application

A production-ready mobile application built for water anomalies reporting and field operations, featuring persistent state caching, native mapping, and real-time push alerts.

---

## 🛠️ Technology Stack (Local Development & Testing)

To support instant developer testing within the **Expo Go** application and browser environments, the project uses a fully compatible testing stack:

### Frontend
- **Framework**: React Native 0.86.0 compiled via Expo SDK 57.0.7.
- **Styling**: NativeWind v4 (Tailwind CSS utility engine for mobile layout compiling).
- **Navigation**: React Navigation v6 using `@react-navigation/native-stack` and `@react-navigation/bottom-tabs`.
- **Icons**: `@expo/vector-icons` (Ionicons).

### State Management & Storage
- **Runtime State**: Zustand for lightweight, hook-based application global runtime state handling.
- **Local Storage Cache**: `@react-native-async-storage/async-storage` for persistent key-value storage (supports web browser fallback).

### Hardware & Geospatial Layer
- **Geo-Location**: `expo-location` to fetch real-time, high-accuracy WGS84 device coordinates.
- **Media Capture**: `expo-image-picker` to request camera/gallery permissions and capture photos.
- **Interactive Mapping**: `react-native-maps` to render interactive map canvases and draggable markers.

### Backend Integration
- **Database & Auth Connector**: `@supabase/supabase-js` client SDK configured with a custom AsyncStorage adapter. Equipped with **Supabase Realtime WebSockets** subscriptions to auto-sync ticket states and community advisories.
- **API Services Connection**: Fetch client configured with platform-specific host routing to Next.js API endpoints.
- **Push Alerts**: `expo-notifications` to request permission alerts, fetch device FCM tokens, and listen for notifications.

---

## 🚀 Setup & Launch Guide (For Team Members)

Follow these exact steps to get the app running on your machine:

### 1. Pre-requisites
*   Ensure you have **Node.js** and **npm** installed.
*   Ensure you have **Android Studio** installed (including the Android SDK Manager and a running Emulator).

### 2. Clone the repository & Install Dependencies
Open a terminal in the `aquatrack-mob` folder and run:
```bash
npm install
```
## Okay na ito, nalagay na
### 3. Register your Google Services File
Make sure you have downloaded the `google-services.json` file from your Firebase console (configured for the package name `com.aquatrack.mob`). Save it directly in the root of the `aquatrack-mob/` project directory.

---

## 🛠️ Compiling the Development Build (Android)

Because modern Expo SDKs do not support push notification receivers inside the standard Expo Go app from the app store, you must compile a local **Development Build** to test notifications. 

### Step 1: Run the Prebuild Generator
Generates the native `android` source folders:
```bash
npx expo prebuild --platform android
```

### Step 2: Configure Android SDK Location (`local.properties`)
If you try to run the compile command now, Gradle will throw an error saying: `SDK location not found`.
*   Go to your `aquatrack-mob/android/` folder.
*   Create a new file named `local.properties`.
*   Add the following line (replace `<Your-Username>` with your Windows account user folder name):
    ```properties
    sdk.dir=C:/Users/<Your-Username>/AppData/Local/Android/Sdk
    ```

### Step 3: Resolve Corrupted NDK Errors (If Gradle Fails)
If the build fails with an NDK error like `NDK ... did not have a source.properties file`, fix it in Android Studio:
1. Open **Android Studio**.
2. Go to **Tools** -> **SDK Manager** (or Settings -> System Settings -> Android SDK).
3. Select the **SDK Tools** tab.
4. Check the **Show Package Details** box in the bottom right.
5. Under **NDK (Side-by-side)**, locate version **`27.1.12297006`**:
   *   Uncheck it and click **Apply** (to delete the corrupted NDK files).
   *   Check it again and click **Apply** (to download a fresh, complete copy).
6. Click **OK** once finished.

### Step 4: Compile and Install the App
Start your Android Emulator in Android Studio, then run:
```bash
npx expo run:android
```
This compiles the native packages and installs a custom **AquaTrack** developer client app on your emulator screen. 

---

## 📦 Generating a Standalone APK for Physical Devices

If you want to compile an installer file (`.apk`) to install and run the app directly on a physical Android phone:

### 1. Configure the Backend API (Wi-Fi local IP)
Because a physical phone cannot connect to `localhost`, you must update the mobile API base URL to your computer's local Wi-Fi IP address:
*   Find your computer's local IP (open Command Prompt and type `ipconfig`, look for the `IPv4 Address` under your active Wi-Fi connection, e.g. `192.168.100.64`).
*   Open the mobile API configuration file: [api.js](file:///C:/Users/AJ/CAPSTONE/aquatrack-mob/src/config/api.js) and update the IP:
    ```javascript
    export const API_BASE_URL = Platform.select({
      android: 'http://192.168.100.64:3000', // Replace with your actual local IPv4 address
      default: 'http://192.168.100.64:3000',
    });
    ```
*   Make sure both your phone and your computer are connected to the **same Wi-Fi network**.
*   Start your Next.js web server bound to all local network interfaces so your phone can reach it:
    ```bash
    npm run dev -- -H 0.0.0.0
    ```

---

### Option A: Standalone Release APK (No Packager Required)
Use this option if you want to distribute the app to your groupmates or test independently from your computer. The JavaScript code is compiled inside the APK.
*   **Compile command**:
    ```bash
    cd android
    ./gradlew assembleRelease
    ```
*   **Installer location**:
    `C:\Users\AJ\CAPSTONE\aquatrack-mob\android\app\build\outputs\apk\release\app-release.apk`
*   **Do I need to rebuild for every change?**
    **Yes.** Because the code is packaged inside the app, any updates you write in your JavaScript files will require you to rebuild (`./gradlew assembleRelease`) and reinstall the APK.

---

### Option B: Debug APK + USB Port Forwarding (Recommended for Active Coding)
Use this option during active development to get **instant hot-reloading on your physical phone** without ever rebuilding the APK.
1.  **Compile command**:
    ```bash
    cd android
    ./gradlew clean
    ./gradlew assembleDebug
    ```
2.  **Installer location**:
    `C:\Users\AJ\CAPSTONE\aquatrack-mob\android\app\build\outputs\apk\debug\app-debug.apk` (Install this on your phone).
3.  **Set up Port Forwarding (Bypasses "Unable to load script" error)**:
    *   Connect your phone to your PC via a USB cable.
    *   Enable **USB Debugging** on your phone (inside Settings -> Developer Options).
    *   Open a terminal on your computer and run this command:
        ```bash
        adb reverse tcp:8081 tcp:8081
        ```
        *(This forces your phone to route all React Native packager requests back to your PC over the USB cable).*
4.  **Run the packager**:
    ```bash
    npm run start
    ```
5.  **Do I need to rebuild for every change?**
    **No!** Open the app on your phone. Any changes you save on your PC will automatically hot-reload on your phone instantly over USB.

---

## 💻 Daily Development Workflow

Once the custom developer client app is installed on your emulator, you **do not** need to re-run the 3-minute compilation command again!

For daily coding, testing, and UI updates:
1.  Start the Next.js backend server (`npm run dev` in `aquatrack-web`).
2.  Start the mobile packager server in your mobile terminal:
    ```bash
    npm run start
    ```
3.  Open the custom **AquaTrack** app on your emulator. It will automatically load your JavaScript bundle.
4.  To reload changes, simply press **`r`** in the terminal where you ran `npm run start`.

---

## 📲 Standalone Production Builds (Google Play / Apple App Store)

When building standalone release packages (`.apk`/`.aab`) for app store release, you can restore raw Firebase native SDKs and high-performance MMKV caching.

### Reference Plans for Future Production Migration:
We have saved step-by-step implementation plans in the project's brain artifacts folder to guide you:

1.  **Zustand & MMKV Integration Plan**  
    *   **File Name**: `2026-07-19-zustand-mmkv-integration-plan.md`
    *   **Path**: `C:\Users\AJ\.gemini\antigravity-cli\brain\a39107bf-1ac8-4d96-b7eb-20aca0c24680\2026-07-19-zustand-mmkv-integration-plan.md`
2.  **Firebase Native SDK Integration Plan**  
    *   **File Name**: `2026-07-19-fcm-integration-plan.md`
    *   **Path**: `C:\Users\AJ\.gemini\antigravity-cli\brain\a39107bf-1ac8-4d96-b7eb-20aca0c24680\2026-07-19-fcm-integration-plan.md`

---

## 🔍 Feature Verification & Testing

### 1. Zustand & AsyncStorage Caching
*   Log into the application.
*   Kill the application process.
*   Reopen the application.
*   **Expected**: The app bypasses the Login screen and opens the home dashboard instantly.

### 2. Push Notifications
*   **Community Advisories**: Log into the mobile app, open the Web Admin dashboard, and publish a new community advisory.
    *   **Expected**: A push notification banner slides down at the top of your phone/emulator screen immediately.
*   **Ticket Status Updates**: Submit a complaint in the mobile app. Log into the Web Admin dashboard and change the status of that complaint (e.g. from `PENDING` to `ONGOING` or `RESOLVED`).
    *   **Expected**: Your phone receives a push notification saying: *"Complaint Status Updated: Your ticket regarding '[Ticket Title]' is now 'ONGOING'"*.
*   **Technician Job Assignments**: Log into the Web Admin dashboard, select a complaint, and assign it to a technician account (e.g., `tech@aquatrack.com`).
    *   **Expected**: The technician's phone receives a push notification saying: *"New Work Order Assigned: You have been assigned a new job: '[Ticket Title]'"*.

### 3. AI-Assisted Diagnostics
*   Open the mobile app and go to the **File Report** screen.
*   Type a description in Tagalog/Kapampangan/English (e.g., *"Mababa ang presyon ng tubig"*) and click **Submit**.
*   **Expected**: The app displays `Running AI diagnostics...` and loads a "Gemini AI Diagnosis" details card on the screen showing the translated text, auto-classification category, and urgency level before submitting.

### 4. Supabase Storage (Image Upload)
*   On the **File Report** screen, click **Attach Incident Photo** and select an image from the emulator gallery.
*   Click **Submit**.
*   **Expected**: The app logs `Uploading photo...`, uploads the image file to the `complaint-media` Supabase storage bucket, and displays the image on the **Track Tickets** history item.

### 5. Supabase Realtime Synchronization
*   Open the mobile app on the **Track Tickets** screen or **Home** dashboard.
*   Simultaneously, open your web admin portal and change one of your user's ticket statuses (e.g. from `EVALUATING` to `DISPATCHED` or `RESOLVED`).
*   **Expected**: The status badge and the tracker stepper dots on the emulator change instantly without requiring a page pull or swipe refresh.
