# WaterTrack

Eine Trinkwasser-Tracker App für iOS und Android, gebaut mit Expo (React Native) und TypeScript.

## Features

- **Tagesübersicht** – Animierter Fortschrittsring mit aktuellem Trinkstand
- **Schnell-Hinzufügen** – 150ml, eigene Bechergrösse, 500ml per Tap
- **Streak-Tracking** – Aufeinanderfolgende Tage mit erreichtem Tagesziel
- **7-Tage Verlauf** – Animiertes Balkendiagramm mit Statistiken
- **Erinnerungen** – Lokale Push-Benachrichtigungen mit einstellbarem Intervall und Nicht-stören-Zeiten
- **Dark Mode** – Vollständige Unterstützung des System-Farbschemas
- **Offline** – Alle Daten lokal gespeichert, kein Account nötig

## Tech Stack

| | |
|---|---|
| Framework | Expo SDK 54 + Expo Router |
| Sprache | TypeScript (strict) |
| Speicherung | @react-native-async-storage/async-storage |
| Benachrichtigungen | expo-notifications |
| Icons | @expo/vector-icons (Ionicons) |
| Charts | react-native-svg |
| Datum | date-fns |

## Projektstruktur

```
app/
  _layout.tsx          # Root Layout
  (tabs)/
    index.tsx          # Home Screen (Heute)
    stats.tsx          # Statistik Screen
    settings.tsx       # Einstellungen Screen
components/
  ProgressRing.tsx     # SVG Fortschrittsring
  QuickAddButton.tsx   # Schnell-Hinzufügen Button
  BarChart.tsx         # 7-Tage Balkendiagramm
  StreakCard.tsx       # Streak & Statistik Karte
hooks/
  useWaterData.ts      # Zentraler State Hook
  useNotifications.ts  # Benachrichtigungen
constants/
  theme.ts             # Farben, Abstände, Typografie
utils/
  storage.ts           # AsyncStorage Hilfsfunktionen
  dateHelpers.ts       # Datums-Hilfsfunktionen
```

## Installation

```bash
npm install
```

## App starten

```bash
npx expo start
```

Dann QR-Code mit der **Expo Go** App scannen (iOS & Android).

## Auf Gerät testen

**Schnell via Expo Go (gleicher WLAN):**
```bash
npx expo start
```

**Als APK via EAS Build:**
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

**Lokal mit Android Emulator:**
```bash
npx expo run:android
```
Voraussetzung: Android Studio + `ANDROID_HOME` und `JAVA_HOME` (JDK 17/21) gesetzt.

## Einstellungen

| Option | Standard | Bereich |
|---|---|---|
| Tagesziel | 2000 ml | 500 – 5000 ml |
| Bechergrösse | 250 ml | 50 – 1000 ml |
| Erinnerungs-Intervall | 2h | 30 min – 8h |
