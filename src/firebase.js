// Firebase initialization. Fill values via Vite env variables starting with VITE_FIREBASE_
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const isConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.authDomain && !!firebaseConfig.projectId

let app = null
let auth = null

if (!isConfigured) {
  // don't initialize Firebase if env vars are missing — avoid the cryptic runtime error
  console.warn('Firebase not configured. Set VITE_FIREBASE_API_KEY and other VITE_FIREBASE_* env vars in a .env file. See README.md')
} else {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
}

export { app, auth, isConfigured as firebaseConfigured }
