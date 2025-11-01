// Netlify Function: returns Firebase client config from server-side env vars.
// This prevents embedding the values directly in the client bundle.
exports.handler = async function (event, context) {
  const cfg = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || null,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || null,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || null,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || null,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || null,
    appId: process.env.VITE_FIREBASE_APP_ID || null,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || null,
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      // Prevent caching so deploy-time changes propagate quickly
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(cfg)
  }
}
// Netlify Function to return Firebase config to the client at runtime.
// Read values from process.env.FIREBASE_* so they are not injected at build time.
exports.handler = async function handler(event, context) {
  const cfg = {
    apiKey: process.env.FIREBASE_API_KEY || null,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || null,
    projectId: process.env.FIREBASE_PROJECT_ID || null,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || null,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || null,
    appId: process.env.FIREBASE_APP_ID || null,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || null
  }

  // If no apiKey present, report 503 so client can fallback gracefully
  if (!cfg.apiKey) {
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Firebase config not available' })
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cfg)
  }
}
