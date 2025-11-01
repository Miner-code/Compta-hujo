// Firebase initialization. Fill values via Vite env variables starting with VITE_FIREBASE_
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Build-time config read from Vite envs (may be undefined in some deploy scenarios).
let firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || null,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || null,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || null,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || null,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || null,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || null,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || null,
}

export let app = null
export let auth = null
export let firebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.authDomain && !!firebaseConfig.projectId

// initialize from existing config if present at build time
if (firebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
  } catch (err) {
    console.warn('Firebase initialization failed at build-time:', err)
    app = null
    auth = null
    firebaseConfigured = false
  }
}

// ensureFirebaseInitialized: runtime initializer that will fetch config from a server-side
// endpoint (Netlify Function) when build-time env vars are not available or when we want
// to avoid embedding secrets in the client bundle.
export async function ensureFirebaseInitialized() {
  if (firebaseConfigured) return true
  try {
    const resp = await fetch('/.netlify/functions/firebase-config')
    if (!resp.ok) {
      console.warn('Could not fetch runtime firebase config:', resp.status)
      return false
    }
    const cfg = await resp.json()
    if (!cfg || !cfg.apiKey) return false
    firebaseConfig = cfg
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    firebaseConfigured = true
    return true
  } catch (err) {
    console.warn('ensureFirebaseInitialized error', err)
    return false
  }
}

export default firebaseConfig
