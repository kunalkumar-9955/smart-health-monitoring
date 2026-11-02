# 🏥 Smart Community Health Monitoring & Early Warning System

A production-ready full-stack platform for real-time water-borne disease surveillance, AI-powered outbreak prediction, and community health management.

## 🚀 Quick Start

### Option 1: Run both servers (requires two terminals)

**Terminal 1 — Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Option 2: With MongoDB (optional — works without it in demo mode)
1. Install and start MongoDB locally
2. The backend auto-connects at `mongodb://localhost:27017/health_monitoring`

---

## 🔐 Demo Accounts (Quick Login)

| Role | Email | Password |
|------|-------|----------|
| Admin (Health Official) | admin@health.gov | admin123 |
| Field Worker (ASHA) | worker@health.gov | admin123 |
| Public User (Villager) | user@village.in | admin123 |

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Animations | Framer Motion |
| Backend | Node.js + Express.js |
| Database | MongoDB (optional, demo mode without) |
| Maps | Leaflet.js + OpenStreetMap |
| Charts | Recharts |
| Auth | JWT (JSON Web Tokens) |
| State | Zustand |

---

## 📁 Project Structure

```
Smart Health Monitoring/
├── backend/
│   ├── models/          # MongoDB schemas (User, Report, Water, Alert, Resource, Village)
│   ├── routes/          # API routes (auth, reports, water, alerts, resources, sms, villages, ai)
│   ├── middleware/      # JWT authentication middleware
│   ├── services/        # AI engine, email notifications
│   ├── server.js        # Express app entry point
│   └── .env             # Environment configuration
│
├── frontend/
│   ├── src/
│   │   ├── pages/       # Login, Dashboard, Reports, Water, Alerts, Resources, SMS, Map, Awareness
│   │   ├── components/  # Layout (Sidebar, Header), Map (RiskMap), Charts
│   │   ├── store/       # Zustand state management + i18n translations
│   │   ├── services/    # Axios API client
│   │   └── App.jsx      # Router + route protection
│   └── index.html
```

---

## 🎯 Features

### ✅ Authentication
- JWT-based role auth (Admin / Field Worker / Public)
- Demo accounts pre-loaded
- Protected routes per role

### ✅ Health Report Submission
- Dynamic symptom selector (Fever, Diarrhea, Vomiting, Dehydration)
- Water quality entry (pH, Turbidity, Bacterial presence)
- Voice-to-text input (Web Speech API)
- GPS auto-detection
- Offline save + sync

### ✅ SMS Reporting (Simulated)
- Parse messages like: `DIARRHEA 5 CASES VILLAGE_RAMPUR WATER_BAD`
- Auto-extracts disease, cases, location, water status
- Creates report in database

### ✅ AI Outbreak Prediction
- Rule-based scoring: `risk_score = (cases × 2) + (water_contamination × 3) + (season_factor × 2)`
- Three risk levels: LOW / MODERATE / HIGH
- Actionable recommendations

### ✅ Water Monitoring
- Manual data entry
- IoT sensor simulation
- Status classification (Safe / Moderate / Contaminated)

### ✅ Interactive Risk Map
- Leaflet.js + OpenStreetMap (no Google Maps API)
- Color-coded village markers (Red=HIGH, Orange=MODERATE, Green=LOW)
- Popup with detailed village info

### ✅ Admin Dashboard
- Summary cards: Total cases, High risk zones, Active alerts
- Cases over time chart (AreaChart)
- Village comparison chart (BarChart)
- Live activity feed
- Simulate incoming reports button

### ✅ Resource Allocation
- Assign Doctors, Medical Kits, Water Treatment Units
- Track status: Pending → In Progress → Completed

### ✅ Multilingual Support
- English, हिंदी (Hindi), Tribal (placeholder)
- Language switcher in sidebar

### ✅ Offline Support
- Detects online/offline status
- Queues reports in localStorage
- Sync button appears when back online

### ✅ Dark/Light Mode
- Full theme system
- Persisted to localStorage

### ✅ Seasonal Toggle
- Monsoon / Dry Season affects AI risk scoring

---

## 🔧 Environment Variables

`backend/.env`:
```
MONGO_URI=mongodb://localhost:27017/health_monitoring
JWT_SECRET=smart_health_jwt_secret_key_2026_production
PORT=5000
CLIENT_URL=http://localhost:5173
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
NODE_ENV=development
```

---

## 📡 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| GET | /api/reports | Get all reports |
| POST | /api/reports | Submit report |
| GET | /api/reports/stats | Dashboard stats |
| GET | /api/water | Water records |
| POST | /api/water | Add water record |
| POST | /api/water/simulate-iot | Generate IoT data |
| GET | /api/alerts | Get alerts |
| POST | /api/sms/parse | Parse SMS message |
| GET | /api/villages | Get villages |
| POST | /api/ai/predict | Run AI prediction |
| POST | /api/ai/simulate | Simulate reports |
| GET | /api/resources | Get resources |
| POST | /api/resources | Assign resource |

---

## 🎮 Demo Flow

1. Login as **Field Worker** (worker@health.gov / admin123)
2. Go to **Health Reports** → Submit report with symptoms + water data
3. OR go to **SMS Reporting** → type `DIARRHEA 5 CASES VILLAGE_RAMPUR WATER_BAD`
4. Switch to **Admin** account (admin@health.gov / admin123)
5. View **Dashboard** → AI risk levels updated
6. Check **Risk Map** → Affected villages highlighted
7. Go to **Alerts** → Review HIGH risk alerts
8. Go to **Resource Allocation** → Assign doctors/medical kits
9. Click **Simulate Incoming Reports** to see live system behavior

---

*Built with ❤️ for rural community health surveillance*
