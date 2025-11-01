import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, firebaseConfigured, initFirebase } from '../firebase'
import {
  createUserWithEmailAndPassword as firebaseCreateUser,
  signInWithEmailAndPassword as firebaseSignIn,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  // removed: sendEmailVerification (we no longer send verification emails)
} from 'firebase/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsub = null
    let mounted = true
    ;(async () => {
      await initFirebase()
      if (!mounted) return
      if (!firebaseConfigured) {
        // No firebase configured: show logged-out state and stop loading
        setUser(null)
        setLoading(false)
        return
      }
      unsub = firebaseOnAuthStateChanged(auth, (u) => {
        setUser(u)
        setLoading(false)
      })
    })()
    return () => { mounted = false; if (unsub) unsub() }
  }, [])

  const signup = (email, password) => {
    if (!firebaseConfigured) return Promise.reject(new Error('Firebase not configured'))
    return firebaseCreateUser(auth, email, password)
      .then((userCredential) => {
        // After successful signup, trigger a welcome email.
        // This attempts to call a server-side endpoint at /api/send-welcome (not provided here).
        // If you don't have a backend, the function will silently fall back and the signup still succeeds.
        const userEmail = userCredential?.user?.email
        const userName = userCredential?.user?.displayName || null
        sendWelcomeEmail(userEmail, userName).catch(() => {
          // swallow errors so signup isn't blocked by email sending
        })
        return userCredential
      })
  }
  const login = (email, password) => {
    if (!firebaseConfigured) return Promise.reject(new Error('Firebase not configured'))
    return firebaseSignIn(auth, email, password)
  }
  const logout = () => {
    if (!firebaseConfigured) return Promise.reject(new Error('Firebase not configured'))
    return firebaseSignOut(auth)
  }
  // sendWelcomeEmail: attempt to notify the user that they are registered.
  // This is a lightweight client-side helper that POSTs to `/api/send-welcome` if present.
  // Implement the server-side handler (SendGrid, Mailgun, etc.) to actually send the email.
  const sendWelcomeEmail = async (email, displayName) => {
    if (!email) return Promise.reject(new Error('No email provided'))
    // Try calling a backend endpoint. First try /api/send-welcome (common mapping),
    // then fallback to /.netlify/functions/send-welcome (Netlify default) if first fails.
    const payload = { email, displayName }
    const tryPaths = ['/api/send-welcome', '/.netlify/functions/send-welcome']
    for (const path of tryPaths) {
      try {
        const resp = await fetch(path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (resp.ok) return
        // If 404, try next path; otherwise log and continue
        if (resp.status === 404) continue
        console.warn('sendWelcomeEmail: backend responded with', resp.status, 'for', path)
      } catch (err) {
        // network error, try next path
        console.warn('sendWelcomeEmail: request failed for', path, err)
        continue
      }
    }
    // If we reach here, none of the endpoints succeeded — swallow error.
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, sendWelcomeEmail }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
