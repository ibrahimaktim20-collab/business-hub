'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, ShieldCheck, ShieldOff } from 'lucide-react'
import QRCode from 'qrcode'

type MfaStatus = 'loading' | 'disabled' | 'enrolling' | 'enabled'

export default function SettingsPage() {
  const [email, setEmail] = useState('')
  const [mfaStatus, setMfaStatus] = useState<MfaStatus>('loading')
  const [factorId, setFactorId] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [unenrolling, setUnenrolling] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setEmail(user.email)
      const { data } = await supabase.auth.mfa.listFactors()
      const verified = data?.totp?.find(f => f.status === 'verified')
      if (verified) {
        setFactorId(verified.id)
        setMfaStatus('enabled')
      } else {
        setMfaStatus('disabled')
      }
    }
    load()
  }, [])

  async function startEnroll() {
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator' })
    if (error || !data) { setError(error?.message ?? 'Failed to start setup'); return }
    const uri = data.totp.uri
    const match = uri.match(/secret=([^&]+)/)
    if (match) setSecret(match[1])
    const url = await QRCode.toDataURL(uri)
    setQrUrl(url)
    setFactorId(data.id)
    setMfaStatus('enrolling')
  }

  async function verifyEnroll() {
    setVerifying(true)
    setError('')
    const supabase = createClient()
    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId })
    if (!challenge) { setError('Challenge failed'); setVerifying(false); return }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: totpCode })
    if (error) {
      setError('Invalid code — try again')
      setVerifying(false)
    } else {
      setMfaStatus('enabled')
      setQrUrl('')
      setTotpCode('')
    }
    setVerifying(false)
  }

  async function unenroll() {
    setUnenrolling(true)
    const supabase = createClient()
    await supabase.auth.mfa.unenroll({ factorId })
    setMfaStatus('disabled')
    setFactorId('')
    setUnenrolling(false)
  }

  return (
    <div>
      <TopBar title="Settings" />
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Account */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5">
          <h2 className="font-semibold text-zinc-900 mb-4">Account</h2>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={email} disabled className="text-zinc-500" />
          </div>
        </div>

        {/* 2FA */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-1">
            {mfaStatus === 'enabled'
              ? <ShieldCheck className="h-5 w-5 text-green-500" />
              : <Shield className="h-5 w-5 text-zinc-400" />}
            <h2 className="font-semibold text-zinc-900">Two-factor authentication</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-4">
            {mfaStatus === 'enabled'
              ? 'Your account is protected with an authenticator app.'
              : 'Add an extra layer of security to your account.'}
          </p>

          {mfaStatus === 'loading' && <p className="text-sm text-zinc-400">Loading…</p>}

          {mfaStatus === 'disabled' && (
            <Button onClick={startEnroll} variant="outline">Enable 2FA</Button>
          )}

          {mfaStatus === 'enrolling' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):</p>
              {qrUrl && <img src={qrUrl} alt="2FA QR code" className="rounded-xl border border-zinc-200 w-40 h-40" />}
              {secret && (
                <p className="text-xs text-zinc-400">Or enter manually: <span className="font-mono text-zinc-700 select-all">{secret}</span></p>
              )}
              <div className="space-y-1.5">
                <Label>Enter the 6-digit code to confirm</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={verifyEnroll} disabled={verifying || totpCode.length !== 6}>
                  {verifying ? 'Verifying…' : 'Activate 2FA'}
                </Button>
                <Button variant="outline" onClick={() => setMfaStatus('disabled')}>Cancel</Button>
              </div>
            </div>
          )}

          {mfaStatus === 'enabled' && (
            <Button variant="outline" onClick={unenroll} disabled={unenrolling} className="text-red-600 border-red-200 hover:bg-red-50">
              <ShieldOff className="h-4 w-4 mr-2" />
              {unenrolling ? 'Removing…' : 'Remove 2FA'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}