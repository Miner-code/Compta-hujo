import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, firebaseConfigured } from '../firebase'
import {
  createUserWithEmailAndPassword as firebaseCreateUser,
  signInWithEmailAndPassword as firebaseSignIn,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  sendEmailVerification as firebaseSendEmailVerification
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
  }
  const login = (email, password) => {
    if (!firebaseConfigured) return Promise.reject(new Error('Firebase not configured'))
    return firebaseSignIn(auth, email, password)
  }
  const logout = () => {
    if (!firebaseConfigured) return Promise.reject(new Error('Firebase not configured'))
    return firebaseSignOut(auth)
  }
  // sendVerification optionally accepts a continueUrl so the verification link redirects back to the app
  const sendVerification = (continueUrl) => {
    if (!firebaseConfigured) return Promise.reject(new Error('Firebase not configured'))
    if (!auth.currentUser) return Promise.reject(new Error('No user'))
    const actionCodeSettings = {
      url: continueUrl || (typeof window !== 'undefined' ? window.location.origin : ''),
      // If you want the code to be handled in the app, set handleCodeInApp: true and configure
      // the client to intercept the link; for simple redirect set false.
      handleCodeInApp: false
    }
    return firebaseSendEmailVerification(auth.currentUser, actionCodeSettings)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, sendVerification }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
