# 🚑 Emergency Copilot AI

> **AI-powered emergency response platform that provides intelligent first-aid guidance, real-time emergency facility discovery, and interactive medical assistance—all within seconds.**

![Status](https://img.shields.io/badge/Status-Active-success)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-38BDF8)
![OpenRouter](https://img.shields.io/badge/AI-OpenRouter-purple)
![Geoapify](https://img.shields.io/badge/Maps-Geoapify-green)
![Leaflet](https://img.shields.io/badge/Leaflet-Interactive_Map-brightgreen)
![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E)

---

# 📖 Overview

Emergency Copilot AI is a modern emergency assistance platform designed to help users during medical emergencies.

The application combines Artificial Intelligence, live GPS, interactive maps, and emergency facility discovery to guide users from identifying a medical issue to locating the nearest appropriate healthcare provider.

The goal is to reduce response time by providing immediate guidance and helping users reach medical assistance faster.

> **Disclaimer:** This application is intended for educational and informational purposes only and should not replace professional medical advice.

---

# ✨ Key Features

## 🤖 AI Emergency Analysis

- AI-powered emergency assessment
- Intelligent first-aid guidance
- Emergency recommendations
- Medical summary generation

---

## 📍 Live GPS Detection

- Automatic location detection
- Live "You Are Here" marker
- Accurate distance calculations
- Dynamic map centering

---

## 🏥 Smart Hospital Finder

- Nearby hospitals
- Interactive maps
- Live navigation
- Emergency call support
- Distance-based ranking

---

## 💊 Pharmacy Finder

- Nearby pharmacy search
- Automatic fallback search
- Green pharmacy markers
- Interactive pharmacy cards

---

## 🚑 Emergency Centre Finder

- Government hospitals
- Trauma centres
- Emergency medical facilities
- Medical colleges

---

## 🗺️ Interactive Emergency Map

- React Leaflet integration
- Custom animated markers
- User location
- Hospital markers
- Pharmacy markers
- Emergency centre markers
- Auto-fit map bounds

---

## 🎠 Smart Nearby Carousel

- Top 5 nearest facilities
- Auto sliding
- Manual navigation
- Map synchronization
- Sidebar synchronization

---

## 📱 Responsive Design

Optimized for

- Desktop
- Tablet
- Android
- iOS

Includes

- Swipeable mobile interface
- Responsive layout
- Glassmorphism UI
- Smooth animations

---

# 🚀 Complete User Flow

```text
Home

↓

Patient Details

↓

Emergency Description

↓

AI Emergency Analysis

↓

Hospital Finder

↓

Medical Summary

↓

Emergency Report
```

---

# 🏗️ System Architecture

```text
                 User
                  │
                  ▼
        Next.js Frontend
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
 OpenRouter AI        Geoapify Maps
        │                   │
        └─────────┬─────────┘
                  │
                  ▼
          Next.js API Routes
                  │
                  ▼
             Supabase DB
                  │
                  ▼
          Emergency Reports
```

---

# 🛠 Tech Stack

## Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- React Leaflet

## Backend

- Next.js API Routes
- REST APIs

## Artificial Intelligence

- OpenRouter API
- Large Language Models

## Maps & Location

- Geoapify Places API
- OpenStreetMap
- Overpass API (Pharmacy fallback)
- Browser Geolocation API

## Database

- Supabase
- PostgreSQL

## Deployment

- Vercel

---

# 📂 Project Structure

```text
app/
│
├── api/
│   ├── analyze/
│   ├── hospitals/
│
├── patient-details/
├── emergency-description/
├── ai-analysis/
├── hospital-finder/
├── medical-summary/
│
components/
hooks/
lib/
store/
public/
```

---

# 💡 Technical Highlights

- AI-powered emergency workflow
- Live GPS tracking
- Interactive emergency map
- Nearby hospital discovery
- Pharmacy finder
- Emergency centre filtering
- Dynamic client-side filtering
- Responsive mobile-first design
- Animated UI components
- Map ↔ Sidebar synchronization
- Smart facility ranking
- Google Maps navigation
- Emergency call integration

---

# 🔐 Environment Variables

```env
OPENROUTER_API_KEY=

GEOAPIFY_API_KEY=

NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

# 🚀 Getting Started

```bash
git clone https://github.com/Aqib-umair/emergency-copilot-ai.git

cd emergency-copilot-ai

npm install

npm run dev
```

Production Build

```bash
npm run build
npm start
```

---

# 📸 Screenshots

Add screenshots for

- Home
- AI Analysis
- Hospital Finder
- Interactive Map
- Pharmacy Finder
- Emergency Centres
- Mobile View
- Medical Summary

---

# 🎯 Future Roadmap

- Voice-guided emergency assistance
- Offline emergency mode
- Emergency contacts
- Ambulance tracking
- Blood bank locator
- Medical profile
- Downloadable emergency reports (PDF)
- Wearable device integration
- Push notifications

---

# 👨‍💻 Developer

**Shaik Mohammed Aqib Umair**

B.Tech – Computer Science & Engineering (Artificial Intelligence & Machine Learning)

📍 India

### Connect with Me

- GitHub: https://github.com/Aqib-umair
- LinkedIn: *(Add your LinkedIn profile)*
- Portfolio: *(Add your portfolio if available)*

---

# ⭐ Support

If you found this project useful or interesting, please consider giving it a ⭐ on GitHub.

It helps others discover the project and supports future development.
