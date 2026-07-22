# 🚑 Emergency Copilot AI

> AI-powered emergency assistance that helps users make informed decisions in critical situations within seconds.

![Status](https://img.shields.io/badge/Status-Active-success)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Database-Supabase-green)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📖 Overview

Emergency Copilot AI is an intelligent emergency response web application that provides rapid AI-powered assistance during medical emergencies.

Users can enter patient information and describe an emergency. The application analyzes the situation using Google Gemini AI, provides emergency guidance, stores emergency records securely in Supabase, and helps users locate nearby hospitals.

> ⚠️ This application is intended for informational purposes only and is **not a substitute for professional medical care.**

---

# ✨ Features

- 🚨 One-click emergency workflow
- 🤖 Google Gemini AI analysis
- 🩺 Patient information management
- 🏥 Nearby hospital search
- 📋 Medical summary generation
- 🌍 Multi-language support
- 💾 Secure data storage with Supabase
- 📱 Responsive mobile-friendly interface
- ⚡ Fast deployment with Vercel

---

# 🛠 Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Next.js API Routes
- Google Gemini API
- REST API Integration

### Database

- Supabase
- PostgreSQL

### Deployment

- Vercel

---

# 🏗 Project Structure

```
app/
 ├── api/
 │    └── analyze/
 ├── patient-details/
 ├── emergency-description/
 ├── ai-analysis/
 ├── hospital-finder/
 ├── medical-summary/

components/
store/
lib/
```

---

# 🔄 Application Flow

```
User
   │
   ▼
Patient Details
   │
   ▼
Emergency Description
   │
   ▼
Gemini AI Analysis
   │
   ▼
Nearby Hospitals
   │
   ▼
Medical Summary
   │
   ▼
Feedback
```

---

# 🗄 Database

The application uses Supabase with the following tables:

- patient_cases
- emergency_reports
- hospital_searches
- feedback

---

# 🔐 Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url

NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

GEMINI_API_KEY=your_gemini_api_key
```

---

# 🚀 Installation

```bash
git clone https://github.com/Aqib-umair/emergency-copilot-ai.git

cd emergency-copilot-ai

npm install

npm run dev
```

---

# 🚀 Production

Build

```bash
npm run build
```

Start

```bash
npm start
```

---

# 📷 Screens

- Home
- Patient Details
- Emergency Description
- AI Analysis
- Hospital Finder
- Medical Summary
- Feedback

(Add screenshots here later.)

---

# 🎯 Future Improvements

- Live GPS tracking
- Ambulance integration
- Voice emergency assistant
- Offline mode
- PDF emergency report
- Emergency contacts
- Wearable device integration
- Push notifications
- AI follow-up recommendations

---

# 👨‍💻 Author

**Shaik Mohammed Aqib Umair**

B.Tech Computer Science (AI & ML)

India

GitHub:
https://github.com/Aqib-umair

---

# 📄 License

This project is licensed under the MIT License.

---

⭐ If you like this project, please give it a star!
