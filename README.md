# 🚧 SiteLy — Construction Site Expense Tracker

[![Expo SDK](https://img.shields.io/badge/Expo%20SDK-54-blue.svg)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](#license)
[![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS%20%7C%20Web-green.svg)](#)

> **SiteLy** is a next-generation, enterprise-grade mobile solution for construction site management. Track workers, attendance, expenses, materials, payments, and generate actionable reports — all in one robust, secure, and scalable app.

---

## ✨ Features

- **Multi-Site Management:** Create, manage, and share multiple construction sites with granular access control.
- **Advanced Worker Management:** Add workers, mark daily attendance (hajari), track overtime, manage expenses, and process payments with full audit history.
- **Material Tracking:** Manage vendors, stock, usage, and payments. Upload bill photos and monitor remaining inventory in real time.
- **Photo Documentation:** Capture, organize, and annotate site progress photos by date and group.
- **Comprehensive Reporting:** Generate, preview, and export detailed reports (PDF/CSV) for workers, materials, budgets, and payments.
- **Smart Notifications:** In-app notification center with reminders for hajari, payments, todos, and more.
- **Personalized Experience:** Multi-language (EN/HI/GU), dark mode, profile management, and secure authentication.
- **Productivity Tools:** Integrated todo list with priorities, deadlines, and notification reminders.
- **Offline-First:** Local SQLite storage with seamless sync to cloud (Firebase).

---

## 🏗️ Tech Stack

| Technology         | Purpose                        |
|--------------------|-------------------------------|
| Expo SDK 54        | App framework                 |
| React Native 0.81  | UI layer                      |
| expo-router 6.x    | File-based routing            |
| Firebase Web SDK   | Authentication                |
| expo-sqlite        | Local database                |
| AsyncStorage       | Local storage                 |
| expo-print         | PDF generation                |
| expo-sharing       | File sharing                  |
| expo-notifications | Push notifications            |
| expo-image-picker  | Camera/gallery integration    |
| react-native-reanimated | Animations               |
| @gorhom/bottom-sheet | Bottom sheets               |
| Custom i18n        | Internationalization (EN/HI/GU)|

---

## 📁 Project Structure

<details>
<summary>Click to expand</summary>

```
Cloud-File-Sync/
├── app/            # Screens (expo-router)
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── auth.tsx
│   ├── dashboard.tsx
│   ├── create-site.tsx
│   ├── help.tsx
│   ├── notifications.tsx
│   ├── profile.tsx
│   ├── todo.tsx
│   └── site/
│       ├── [id].tsx
│       ├── add-worker.tsx
│       ├── workers.tsx
│       ├── hajari.tsx
│       ├── expense.tsx
│       ├── payment.tsx
│       ├── payment-history.tsx
│       ├── materials.tsx
│       ├── photos.tsx
│       └── reports.tsx
├── components/
│   └── ui/
├── constants/
├── lib/
│   ├── AppContext.tsx
│   ├── auth.ts
│   ├── database.ts
│   ├── storage.ts
│   ├── firebase.ts
│   ├── i18n.ts
│   ├── types.ts
│   └── query-client.ts
├── services/
├── store/
├── theme/
├── utils/
└── server/
```
</details>

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android)
- Xcode (for iOS, Mac only)

### Installation

```bash
git clone <repository-url>
cd Cloud-File-Sync
npm install
npx expo start
```

### Running

- **Android:** `npx expo run:android`
- **iOS:** `npx expo run:ios` (Mac only)
- **Web:** `npx expo start --web`

### Environment Setup

1. Configure Firebase in `lib/firebase.ts` with your credentials.
2. Set up Google/Facebook login in Firebase console.
3. Update `app.json` and `eas.json` for your app identifiers.

---

## 🗄️ Database Schema

- **sites:** id, name, location, type, ownerName, ownerPhone, startDate, endDate, isRunning, siteCode, contractorId, userId
- **workers:** id, siteId, name, age, contact, village, category
- **hajari:** id, siteId, workerId, workerName, workerCategory, amount, overtime, date, time
- **expenses:** id, siteId, workerId, workerName, workerCategory, amount, description, date, time
- **payments:** id, siteId, workerId, workerName, workerCategory, amount, date, time, method
- **photos:** id, siteId, groupId, uri, description, createdAt
- **photo_groups:** id, siteId, name, createdAt
- **materials, material_usages, todos, notifications:** (AsyncStorage)

---

## 🛠️ Build & Deploy

```bash
# Android APK
eas build -p android --profile preview

# Android AAB (production)
eas build -p android --profile production

# iOS (requires Apple Developer Account)
eas build -p ios --profile production

# Submit to Google Play
eas submit -p android
```

---

## 🎨 Theme

- **Primary:** Sky Blue `#0EA5E9`
- **Background:** Dark `#0A0A1A`
- **Surface:** `#1A1A2E`
- **Fonts:** Poppins (400, 500, 600, 700)
- **Gradients:** Blue-to-dark, per-section accent

---

## 📄 License

This project is proprietary. All rights reserved.

---

> **Built with ❤️ by professionals, for professionals.**

## Tech Stack

| Technology | Purpose |
|---|---|
| Expo SDK ~54 | App framework |
| React Native 0.81 | UI layer |
| expo-router ~6.0 | File-based routing |
| Firebase Web SDK ^12.9 | Authentication |
| expo-sqlite | Local database (SQLite) |
| AsyncStorage | Material & notification storage |
| expo-print | PDF generation |
| expo-sharing | File sharing |
| expo-notifications | Local push notifications |
| expo-image-picker | Camera & gallery |
| expo-linear-gradient | UI gradients |
| react-native-reanimated | Animations |
| @gorhom/bottom-sheet | Bottom sheets |
| i18n (custom) | Internationalization (EN/HI/GU) |

---

## Project Structure

```
Cloud-File-Sync/
├── app/                    # Screens (expo-router file-based routing)
│   ├── _layout.tsx         # Root layout with auth guard
│   ├── index.tsx           # Splash / entry screen
│   ├── auth.tsx            # Login / Signup
│   ├── dashboard.tsx       # Main dashboard with site list
│   ├── create-site.tsx     # Create new site
│   ├── help.tsx            # App user guide
│   ├── notifications.tsx   # Notification center
│   ├── profile.tsx         # Profile management
│   ├── todo.tsx            # Todo list
│   └── site/               # Site-specific screens
│       ├── [id].tsx        # Site dashboard (4 main sections)
│       ├── add-worker.tsx  # Add workers
│       ├── workers.tsx     # View all workers
│       ├── hajari.tsx      # Daily attendance + overtime
│       ├── expense.tsx     # Add expenses
│       ├── payment.tsx     # Pay workers
│       ├── payment-history.tsx  # Worker + material payments
│       ├── materials.tsx   # Material management
│       ├── photos.tsx      # Site progress photos
│       └── reports.tsx     # Report generation
├── components/             # Reusable UI components
│   └── ui/                 # AnimatedPressable, EmptyState, FloatingInput, etc.
├── constants/              # Colors, shadows
├── lib/                    # Core logic
│   ├── AppContext.tsx       # Global context provider
│   ├── auth.ts             # Firebase auth service
│   ├── database.ts         # SQLite schema & migrations
│   ├── storage.ts          # Data access layer
│   ├── firebase.ts         # Firebase config
│   ├── i18n.ts             # Translations (EN/HI/GU)
│   ├── types.ts            # TypeScript interfaces
│   └── query-client.ts     # React Query client
├── services/               # Background services
│   ├── notifications.ts    # Push notification scheduling
│   └── firestore.ts        # Firestore service
├── store/                  # Zustand stores
├── theme/                  # Typography, animations
├── utils/                  # Report generator, calculations
└── server/                 # Landing page server
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Cloud-File-Sync

# Install dependencies
npm install

# Start Expo development server
npx expo start

# Run on Android
npx expo run:android

# Run on Web
npx expo start --web
```

### Environment Setup

1. Configure Firebase in `lib/firebase.ts` with your project credentials
2. Set up Google Sign-In and Facebook Login in Firebase console
3. Update `app.json` and `eas.json` for your app identifiers

---

## Database Schema

### SQLite Tables
- **sites** — id, name, location, type, ownerName, ownerPhone, startDate, endDate, isRunning, siteCode, contractorId, userId
- **workers** — id, siteId, name, age, contact, village, category
- **hajari** — id, siteId, workerId, workerName, workerCategory, amount, overtime, date, time
- **expenses** — id, siteId, workerId, workerName, workerCategory, amount, description, date, time
- **payments** — id, siteId, workerId, workerName, workerCategory, amount, date, time, method
- **photos** — id, siteId, groupId, uri, description, createdAt
- **photo_groups** — id, siteId, name, createdAt
- **materials** — AsyncStorage (`sitely_materials_{siteId}`)
- **material_usages** — AsyncStorage (`sitely_usage_{siteId}_{matId}`)
- **todos** — AsyncStorage (`sitely_todos`)
- **notifications** — AsyncStorage (`sitely_notifications`)

---

## Build & Deploy

```bash
# Build Android APK
eas build -p android --profile preview

# Build Android AAB (production)
eas build -p android --profile production

# Submit to Google Play
eas submit -p android
```

---

## Theme

- **Primary**: Sky Blue `#0EA5E9`
- **Background**: Dark `#0A0A1A`
- **Surface**: `#1A1A2E`
- **Fonts**: Poppins (400, 500, 600, 700)
- **Gradients**: Blue-to-dark header, per-section accent colors

---

## License

This project is proprietary. All rights reserved.

---

**Built with ❤️ for construction site managers**
