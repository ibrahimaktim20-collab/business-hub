'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace, WORKSPACE_COLORS } from '@/hooks/useWorkspace'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, ShieldCheck, ShieldOff, Sun, Moon, Plus, Trash2, Check } from 'lucide-react'
import QRCode from 'qrcode'

type MfaStatus = 'loading' | 'disabled' | 'enrolling' | 'enabled'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, createWorkspace, deleteWorkspace } = useWorkspace()
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) ?? workspaces[0]

  const [email, setEmail] = useState('')
  const [mfaStatus, setMfaStatus] = useState<MfaStatus>('loading')
  const [factorId, setFactorId] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [mfaError, setMfaError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [unenrolling, setUnenrolling] = useState(false)

  // New workspace form
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(WORKSPACE_COLORS[0])
  const [creating, setCreating] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setEmail(user.email)
      const { data } = await supabase.auth.mfa.listFactors()
      const verified = data?.totp?.find(f => f.status === 'verified')
      if (verified) { setFactorId(verified.id); setMfaStatus('enabled') }
      else setMfaStatus('disabled')
    }
    load()
  }, [])

  async function startEnroll() {
    setMfaError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator' })
    if (error || !data) { setMfaError(error?.message ?? 'Failed to start setup'); return }
    const uri = data.totp.uri
    const match = uri.match(/secret=([^&]+)/)
    if (match) setSecret(match[1])
    setQrUrl(await QRCode.toDataURL(uri))
    setFactorId(data.id)
    setMfaStatus('enrolling')
  }

  async function verifyEnroll() {
    setVerifying(true); setMfaError('')
    const supabase = createClient()
    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId })
    if (!challenge) { setMfaError('Challenge failed'); setVerifying(false); return }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: totpCode })
    if (error) { setMfaError('Invalid code — try again') }
    else { setMfaStatus('enabled'); setQrUrl(''); setTotpCode('') }
    setVerifying(false)
  }

  async function unenroll() {
    setUnenrolling(true)
    const supabase = createClient()
    await supabase.auth.mfa.unenroll({ factorId })
    setMfaStatus('disabled'); setFactorId('')
    setUnenrolling(false)
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    await createWorkspace(newName.trim(), newColor)
    setNewName(''); setNewColor(WORKSPACE_COLORS[0]); setShowNewForm(false); setCreating(false)
  }

  return (
    <div>
      <TopBar title="Settings" />
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Account */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Account</h2>
          <div className="space-y-1.5">
            <Label className="dark:text-zinc-400">Email</Label>
            <Input value={email} disabled className="text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700" />
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Appearance</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-colors ${theme === 'light' ? 'border-zinc-900 dark:border-zinc-100' : 'border-zinc-200 dark:border-zinc-700'}`}
            >
              <Sun className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Light</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-colors ${theme === 'dark' ? 'border-zinc-900 dark:border-zinc-100' : 'border-zinc-200 dark:border-zinc-700'}`}
            >
              <Moon className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Dark</span>
            </button>
          </div>
        </div>

        {/* Workspaces */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Workspaces</h2>
          <div className="space-y-2">
            {workspaces.map(w => (
              <div key={w.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group">
                <button onClick={() => setActiveWorkspaceId(w.id)} className="flex items-center gap-3 flex-1 text-left">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: w.color }}>
                    {w.name[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex-1">{w.name}</span>
                  {activeWorkspace?.id === w.id && <Check className="h-4 w-4 text-zinc-400" />}
                </button>
                <button
                  onClick={() => deleteWorkspace(w.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-300 hover:text-red-500 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {showNewForm ? (
            <div className="mt-4 space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Input
                placeholder="Workspace name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <div className="flex gap-2 flex-wrap">
                {WORKSPACE_COLORS.map(c => (
                  <button key={c} onClick={() => setNewColor(c)}
                    className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                    style={{ backgroundColor: c, outline: newColor === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }} />
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={!newName.trim() || creating} className="flex-1">
                  {creating ? 'Creating…' : 'Create'}
                </Button>
                <Button variant="outline" onClick={() => setShowNewForm(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewForm(true)}
              className="mt-3 flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Plus className="h-4 w-4" /> New workspace
            </button>
          )}
        </div>

        {/* 2FA */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-1">
            {mfaStatus === 'enabled'
              ? <ShieldCheck className="h-5 w-5 text-green-500" />
              : <Shield className="h-5 w-5 text-zinc-400" />}
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Two-factor authentication</h2>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            {mfaStatus === 'enabled' ? 'Your account is protected with an authenticator app.' : 'Add an extra layer of security to your account.'}
          </p>

          {mfaStatus === 'loading' && <p className="text-sm text-zinc-400">Loading…</p>}
          {mfaStatus === 'disabled' && <Button onClick={startEnroll} variant="outline">Enable 2FA</Button>}

          {mfaStatus === 'enrolling' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Scan this QR code with Google Authenticator or Authy:</p>
              {qrUrl && <img src={qrUrl} alt="2FA QR code" className="rounded-xl border border-zinc-200 w-40 h-40" />}
              {secret && <p className="text-xs text-zinc-400">Or enter manually: <span className="font-mono text-zinc-700 dark:text-zinc-300 select-all">{secret}</span></p>}
              <div className="space-y-1.5">
                <Label>Enter the 6-digit code to confirm</Label>
                <Input type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                  value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))} />
              </div>
              {mfaError && <p className="text-sm text-red-500">{mfaError}</p>}
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