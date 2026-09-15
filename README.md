# ChronoMaster Premium ⏱️🎮

[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web-blue.svg)](https://capacitorjs.com/)
[![Runtime](https://img.shields.io/badge/Runtime-Capacitor%206-brightgreen.svg)](https://capacitorjs.com/)
[![Frontend](https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20CSS3%20%7C%20HTML5-orange.svg)](https://developer.mozilla.org/)
[![UI](https://img.shields.io/badge/Theme-RTL%20Native%20%7C%20Dark%20Mode-purple.svg)](https://fontawesome.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A gamified, cross-platform productivity and focus orchestration app built with modern Web APIs and wrapped for Android native execution using Capacitor. Designed with an algorithmic Anti-Fake-Work verification engine, strict cycle tracking, and rank-based level progression.

---

## ⚡ Core Architecture & Engineering Highlights

### 1. Anti-Fake-Work & Penalty Engine
* **Objective-Conditional Verification:** Tracks elapsed focus time strictly against milestone completions. Tasks run down without checked deliverables are flagged as `Fake Work`, zeroing productive credit.
* **Overtime & Distraction Levies:** Calculates automated score deductions based on unscheduled breaks, task overruns, and logged focus interruptions.

### 2. RPG-Style Gamification & Progression (`levels.js`)
* **Dynamic XP Scaling:** Exponential XP curves calculating tier progression from *Productivity Novice* to *Productivity Emperor*.
* **Bilateral Rank Adjustments:** Includes down-ranking mechanics (XP bleed and Level Drops) triggered by poor cycle discipline.

### 3. Cycle Analytics & Diagnostic Reporting (`analytics.js`)
* Real-time generation of letter grade ranks (S / A / B / C / D / F).
* Computes Planning Accuracy KPI vs. Net Productive Value.
* AI-driven operational insights highlighting single points of failure (Black Hole tasks) and top-performing focus sessions.

### 4. Zero-Dependency Native Hybrid Architecture
* High-performance Vanilla JavaScript engine with zero framework bloat.
* Web Audio API synthesized haptic tones and vibration fallback patterns.
* SVG circular progress dashboard with dynamic stroke-dashoffset transitions.
* Capacitor Android runtime bridge supporting native device viewport optimizations and persistent local state.

---

## 📊 Productivity Cycle Pipeline

* Step 1 (Time Architecture): Allocate total cycle boundary (24h, 12h, 8h, or custom minutes) and configure individual focus units with mandatory achievements.
* Step 2 (Execution Tracking): Single-task active switching, audio-haptic feedback, distraction logging, and live background time-drift synchronization.
* Step 3 (Cycle Termination): Post-cycle telemetry audit -> Multiplier verification -> Rank assignment -> Level progression update.

---

## 🛠️ Tech Stack

* **Mobile Runtime:** Capacitor (Android Native Bridge)
* **Client Core:** Vanilla JavaScript (ES6+), HTML5, CSS3 Custom Properties
* **Haptics & Audio:** Web Audio API (OscillatorNode / GainNode), Navigator Vibration API
* **State Persistence:** LocalStorage Serialization & Hydration
* **Vector Graphics:** Scalable Vector Graphics (SVG) procedural progress rings

---

## 🚀 Installation & Local Development

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [Android Studio](https://developer.android.com/studio) (for native Android builds)

### 1. Clone Repository
git clone https://github.com/abdessalam-zenkoufi/chronomaster-app.git
cd chronomaster-app

### 2. Install Dependencies
npm install

### 3. Run Locally in Browser
Serve the `www` directory with any static local server:
npx serve www

### 4. Sync and Run on Android
npx cap sync android
npx cap open android

---

## 📁 Repository Structure

chronomaster-app/
├── android/                 # Native Android Capacitor project
├── icons/                   # High-res PWA and app asset icons
├── www/                     # Web app root
│   ├── index.html           # Main dashboard layout and view router
│   ├── analytics.js         # Evaluation, reporting, and KPI computation
│   ├── levels.js            # Gamification, XP algorithms, and penalties
│   └── manifest.json        # PWA metadata manifest
├── capacitor.config.json    # Capacitor runtime configurations
├── package.json             # Project metadata and build scripts
├── .gitignore               # Excludes node_modules and Android build cache
├── LICENSE                  # MIT Open-Source License
└── README.md                # Technical documentation

---

## 📄 License
Distributed under the MIT License. See LICENSE for more information.