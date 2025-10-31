import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthPage() {
  const [mode, setMode] = useState('login') // or 'signup'
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{mode === 'login' ? 'Login' : 'Sign up'}</h2>
          <div className="text-sm text-gray-600">
            <button className={`mr-2 ${mode === 'login' ? 'font-semibold' : ''}`} onClick={() => setMode('login')}>Login</button>
            <button className={`${mode === 'signup' ? 'font-semibold' : ''}`} onClick={() => setMode('signup')}>Sign up</button>
          </div>
        </div>
        {mode === 'login' ? <LoginForm /> : <SignupForm />}
      </div>
    </div>
  )
}

function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div>
        <label className="text-sm text-gray-600">Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded px-2 py-1" type="email" />
      </div>
      <div>
        <label className="text-sm text-gray-600">Password</label>
        <input value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded px-2 py-1" type="password" />
      </div>
      <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Login</button>
      </div>
    </form>
  )
}

function SignupForm() {
  const { signup, sendVerification } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [ok, setOk] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const cred = await signup(email, password)
      // send verification
      await sendVerification()
      setOk('Account created. A verification email was sent — check your inbox.')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <div className="text-sm text-red-600">{error}</div>}
      {ok && <div className="text-sm text-green-600">{ok}</div>}
      <div>
        <label className="text-sm text-gray-600">Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded px-2 py-1" type="email" />
      </div>
      <div>
        <label className="text-sm text-gray-600">Password</label>
        <input value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded px-2 py-1" type="password" />
      </div>
      <div className="flex justify-end">
        <button className="bg-green-600 text-white px-4 py-2 rounded">Sign up</button>
      </div>
    </form>
  )
}
