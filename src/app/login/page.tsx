'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [mfaStep, setMfaStep] = useState(false)
  const [factorId, setFactorId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.SyntheticEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.nextLevel === 'aal2' && aal.nextLevel !== aal.currentLevel) {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totp = factors?.totp?.[0]
      if (totp) {
        setFactorId(totp.id)
        setMfaStep(true)
        setLoading(false)
        return
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleMfa(e: React.SyntheticEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId })
    if (!challenge) { setError('Failed to start MFA challenge'); setLoading(false); return }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: totpCode })
    if (error) {
      setError('Invalid code — try again')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  if (mfaStep) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 mb-4 shadow-lg">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Two-factor auth</h1>
            <p className="text-sm text-zinc-500 mt-1">Enter the 6-digit code from your authenticator app</p>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
            <form onSubmit={handleMfa} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="totp">Authenticator code</Label>
                <Input
                  id="totp"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  value={totpCode}
                  onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>
              {error && <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-600">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading || totpCode.length !== 6}>
                {loading ? 'Verifying…' : 'Verify'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 mb-4 shadow-lg">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Business Hub</h1>
          <p className="text-sm text-zinc-500 mt-1">Sign in to your workspace</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>

            {error && <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-600">{error}</div>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-500 mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-zinc-900 hover:underline">Sign up</Link>
        </p>
        <p className="text-center text-xs text-zinc-400 mt-6">Secure access — only authorized users</p>
      </div>
    </div>
  )
}