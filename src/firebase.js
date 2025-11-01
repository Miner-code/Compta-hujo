// Firebase initialization. Fill values via Vite env variables starting with VITE_FIREBASE_
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Exports that other modules import. We'll initialize them at runtime.
let app = null
let auth = null
let firebaseConfigured = false

const initWithConfig = (cfg) => {
  if (!cfg || !cfg.apiKey) return false
  try {
    app = initializeApp({
      apiKey: cfg.apiKey,
      authDomain: cfg.authDomain,
      projectId: cfg.projectId,
      storageBucket: cfg.storageBucket,
      messagingSenderId: cfg.messagingSenderId,
      appId: cfg.appId,
      measurementId: cfg.measurementId
    })
    auth = getAuth(app)
    firebaseConfigured = true
    return true
  } catch (err) {
    console.error('Failed to initialize Firebase with config', err)
    return false
  }
}

// Attempt to initialize immediately from build-time Vite vars if present.
// For the "no-embed" approach we expect build-time VITE_* to be absent so
// this will usually not initialize during build.
if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) {
  initWithConfig({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  })
}

// initFirebase: attempt to fetch runtime config from a Netlify Function if not initialized.
let _initPromise = null
const initFirebase = async () => {
  if (firebaseConfigured) return true
  if (_initPromise) return _initPromise
  _initPromise = (async () => {
    try {
      const resp = await fetch('/.netlify/functions/firebase-config', { cache: 'no-store' })
      if (!resp.ok) {
        console.warn('firebase-config function not available or returned error', resp.status)
        return false
      }
      const cfg = await resp.json()
      const ok = initWithConfig(cfg || {})
      if (!ok) console.warn('firebase-config returned invalid config')
      return ok
    } catch (err) {
      console.warn('Could not fetch firebase-config function', err)
      return false
    }
  })()
  return _initPromise
}

export { app, auth, firebaseConfigured, initFirebase }
