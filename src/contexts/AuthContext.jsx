import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, firebaseConfigured } from '../firebase'
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
    if (!firebaseConfigured) {
      // No firebase configured: show logged-out state and stop loading
      setUser(null)
      setLoading(false)
      return
    }
    const unsub = firebaseOnAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
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
    // Try calling a backend endpoint. If none exists, resolve without throwing.
    try {
      const resp = await fetch('/api/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName })
      })
      if (!resp.ok) {
        // log and continue
        console.warn('sendWelcomeEmail: backend responded with', resp.status)
      }
    } catch (err) {
      // No backend available or network error — that's fine for now.
      console.warn('sendWelcomeEmail: no backend available to send welcome email', err)
    }
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
