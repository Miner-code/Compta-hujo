# Compta — simple personal finance

Minimal React + Vite + Tailwind app to track salary, incomes and expenses and get a savings projection.

Prerequisites

- Node.js 18+

Quick start

```bash
cd /c/Users/hugvallet/Documents/Compta
npm install
npm run dev
```

Features

- Enter monthly salary
- Add one-off or recurring expenses (with optional date)
- Add one-off or recurring incomes
- Dashboard showing this-month expenses, known future expenses, projected savings
- Data is stored locally in the browser (localStorage)

Market data

- Top cryptos: the app can query CoinGecko to fetch 24h top movers (no API key required).
- Stock market data requires an API key (AlphaVantage, Finnhub, FinancialModelingPrep, etc.) if you want to add equities.

UI redesign

- Single-page layout: header, inputs (salary/incomes/expenses) and dashboard.
- Investment section: pie chart allocation, risk profile selector and suggested monthly allocation.

Usage

1. Start the dev server:

```bash
cd /c/Users/hugvallet/Documents/Compta
npm install
npm run dev
```

2. Open the URL shown by Vite (e.g. http://localhost:5174) and scroll to access all sections.

Authentication (Firebase)

This project supports Firebase Authentication (email/password + email verification). To enable it:

1. Create a Firebase project at https://console.firebase.google.com/ and enable Email/Password sign-in in Authentication > Sign-in method.
2. In the project settings, copy the firebase config values (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).
3. Create a file named `.env` at the project root (next to `package.json`) and add the following keys (Vite requires the VITE\_ prefix):

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Install the Firebase SDK and start the dev server:

```bash
npm install firebase
npm run dev
```

Notes:

- The app will show a login/signup page until a user signs in and verifies their email.
- User-specific data is currently stored in localStorage under the same key; you may want to migrate to a per-user key or cloud storage later.

Next improvements

- Edit transactions
- Categories and filters
- Cloud sync / export/import
- Unit tests for calculation utilities
