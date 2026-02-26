'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase'
import { loadTrips, loadWallet } from '@/lib/dataService'

type SubInfo = {
  plan: string
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  scansUsed: number
  scansLimit: number
  canScan: boolean
}

export default function AccountPage() {
  const { user, session, loading, signOut } = useAuth()
  const supabase = createClient()

  // Subscription
  const [sub, setSub] = useState<SubInfo | null>(null)
  const [subLoading, setSubLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  // Profile editing
  const [displayName, setDisplayName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)

  // Local data
  const [localCounts, setLocalCounts] = useState({ trips: 0, flights: 0, wallet: 0 })
  const [dataCleared, setDataCleared] = useState(false)

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const isGoogleUser = user?.app_metadata?.provider === 'google'

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.full_name || user.user_metadata?.name || '')
    }
  }, [user])

  useEffect(() => {
    Promise.all([loadTrips(), loadWallet()]).then(([trips, wallet]) => {
      const flights = trips.reduce((sum: number, t: any) => sum + (t.flights?.length || 0), 0)
      setLocalCounts({ trips: trips.length, flights, wallet: wallet.length })
    })
  }, [dataCleared])

  // Fetch subscription info
  useEffect(() => {
    if (!session?.access_token) return
    setSubLoading(true)
    fetch('/api/subscription', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(data => setSub(data))
      .catch(() => {})
      .finally(() => setSubLoading(false))
  }, [session])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)', fontSize: 16 }}>
        Loading...
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Sign in required</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 24 }}>
          You need to be signed in to manage your account.
        </p>
        <a href="/login" style={{
          display: 'inline-block', padding: '12px 28px',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
          color: 'var(--text-inverse)', borderRadius: 'var(--radius-sm)',
          textDecoration: 'none', fontWeight: 600, fontSize: 15,
        }}>Sign In</a>
      </div>
    )
  }

  const currentName = user.user_metadata?.full_name || user.user_metadata?.name || ''
  const nameChanged = displayName.trim() !== currentName

  const handleSaveName = async () => {
    setNameMsg(null)
    if (!displayName.trim()) {
      setNameMsg({ type: 'error', text: 'Name cannot be empty.' })
      return
    }
    setSavingName(true)
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName.trim() }
    })
    setSavingName(false)
    if (error) {
      setNameMsg({ type: 'error', text: error.message })
    } else {
      setNameMsg({ type: 'success', text: 'Name updated!' })
      setTimeout(() => setNameMsg(null), 3000)
    }
  }

  const handleChangePassword = async () => {
    setPasswordMsg(null)
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    setChangingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setChangingPassword(false)
    if (error) {
      setPasswordMsg({ type: 'error', text: error.message })
    } else {
      setPasswordMsg({ type: 'success', text: 'Password updated!' })
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => { setShowPasswordForm(false); setPasswordMsg(null) }, 2000)
    }
  }

  const handleClearData = async () => {
    if (!confirm('This will delete all your saved trips, flights, and wallet entries. This cannot be undone. Continue?')) return
    // Clear all possible localStorage keys (scoped + legacy)
    localStorage.removeItem('trips')
    localStorage.removeItem('trips_anon')
    localStorage.removeItem('flights')
    localStorage.removeItem('wallet')
    localStorage.removeItem('wallet_anon')
    if (user) {
      localStorage.removeItem(`trips_${user.id}`)
      localStorage.removeItem(`wallet_${user.id}`)
      // Delete child records first, then trips (cascade should handle it but be safe)
      await supabase.from('itineraries').delete().eq('user_id', user.id)
      await supabase.from('flights').delete().eq('user_id', user.id)
      await supabase.from('legs').delete().eq('user_id', user.id)
      await supabase.from('trips').delete().eq('user_id', user.id)
      await supabase.from('wallet').delete().eq('user_id', user.id)
    }
    setDataCleared(prev => !prev)
  }

  const handleManageSubscription = async () => {
    if (!session?.access_token) return
    setPortalLoading(true)
    try {
      const res = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {}
    setPortalLoading(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setDeleteError(data.error || 'Failed to delete account.')
        setDeleting(false)
        return
      }
      localStorage.removeItem('trips')
      localStorage.removeItem('trips_anon')
      localStorage.removeItem('flights')
      localStorage.removeItem('wallet')
      localStorage.removeItem('wallet_anon')
      if (user) {
        localStorage.removeItem(`trips_${user.id}`)
        localStorage.removeItem(`wallet_${user.id}`)
      }
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch {
      setDeleteError('Something went wrong. Please try again.')
      setDeleting(false)
    }
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border-light)',
    padding: 24,
    marginBottom: 16,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: 'var(--text-muted)',
    marginBottom: 6, display: 'block', textTransform: 'uppercase',
    letterSpacing: 0.5,
  }

  const msgStyle = (type: 'success' | 'error'): React.CSSProperties => ({
    padding: '8px 12px', borderRadius: 'var(--radius-sm)',
    marginTop: 8, fontSize: 14,
    backgroundColor: type === 'success' ? '#ECFDF5' : '#FEF2F2',
    color: type === 'success' ? '#065F46' : '#991B1B',
  })

  const totalLocal = localCounts.trips + localCounts.flights + localCounts.wallet

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 20px 80px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>My Account</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 28 }}>
        Manage your profile and account settings.
      </p>

      {/* Profile */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Profile</h2>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Email</label>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{user.email}</div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Display Name</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setNameMsg(null) }}
              placeholder="Your name"
              style={{ flex: 1, margin: 0 }}
            />
            {nameChanged && (
              <button
                onClick={handleSaveName}
                disabled={savingName}
                style={{
                  padding: '8px 16px', whiteSpace: 'nowrap',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                  color: 'var(--text-inverse)',
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer', fontWeight: 600, fontSize: 14,
                }}
              >
                {savingName ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>
          {nameMsg && <div style={msgStyle(nameMsg.type)}>{nameMsg.text}</div>}
        </div>

        <div>
          <label style={labelStyle}>Sign-in Method</label>
          <span style={{
            display: 'inline-block', padding: '5px 12px',
            borderRadius: 20, fontSize: 13, fontWeight: 600,
            backgroundColor: isGoogleUser ? '#E8F0FE' : 'var(--primary-light)',
            color: isGoogleUser ? '#1A73E8' : 'var(--primary)',
          }}>
            {isGoogleUser ? 'Google' : 'Email & Password'}
          </span>
        </div>
      </div>

      {/* Subscription */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Subscription</h2>
        {subLoading ? (
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading...</div>
        ) : sub ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{
                display: 'inline-block', padding: '5px 14px', borderRadius: 20,
                fontSize: 13, fontWeight: 700,
                backgroundColor: sub.plan === 'pro' ? 'var(--primary-light)' : 'var(--bg)',
                color: sub.plan === 'pro' ? 'var(--primary)' : 'var(--text-muted)',
                border: sub.plan === 'pro' ? 'none' : '1px solid var(--border)',
              }}>
                {sub.plan === 'pro' ? 'Pro' : 'Free'}
              </span>
              {sub.plan === 'pro' && sub.cancelAtPeriodEnd && (
                <span style={{ fontSize: 13, color: 'var(--warning)' }}>
                  Cancels at period end
                </span>
              )}
            </div>

            {sub.plan === 'pro' ? (
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  {sub.currentPeriodEnd
                    ? `${sub.cancelAtPeriodEnd ? 'Active until' : 'Renews'} ${new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                    : 'Unlimited flight scans'}
                </div>
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  style={{
                    padding: '9px 18px', fontSize: 14, fontWeight: 600,
                    color: 'var(--primary)', backgroundColor: 'var(--primary-light)',
                    border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  }}
                >
                  {portalLoading ? 'Loading...' : 'Manage Subscription'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  {sub.scansUsed}/{sub.scansLimit} scan{sub.scansLimit !== 1 ? 's' : ''} used this month
                </div>
                <a
                  href="/pricing"
                  style={{
                    display: 'inline-block', padding: '9px 18px', fontSize: 14, fontWeight: 600,
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                    color: 'var(--text-inverse)', borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none',
                  }}
                >
                  Upgrade to Pro — $4.99/mo
                </a>
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            <a href="/pricing" style={{ color: 'var(--primary)', fontWeight: 600 }}>Upgrade to Pro</a> for unlimited flight scans with the Chrome extension.
          </div>
        )}
      </div>

      {/* Security (email users only) */}
      {!isGoogleUser && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showPasswordForm ? 16 : 0 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Security</h2>
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                style={{
                  padding: '7px 14px', fontSize: 14, fontWeight: 600,
                  color: 'var(--primary)', backgroundColor: 'var(--primary-light)',
                  border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                }}
              >
                Change Password
              </button>
            )}
          </div>

          {showPasswordForm && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    style={{ margin: 0, width: '100%' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Confirm</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    style={{ margin: 0, width: '100%' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !newPassword || !confirmPassword}
                  style={{
                    padding: '9px 18px',
                    background: (!newPassword || !confirmPassword) ? 'var(--border)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                    color: (!newPassword || !confirmPassword) ? 'var(--text-muted)' : 'var(--text-inverse)',
                    border: 'none', borderRadius: 'var(--radius-sm)',
                    cursor: (!newPassword || !confirmPassword) ? 'default' : 'pointer',
                    fontWeight: 600, fontSize: 14,
                  }}
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  onClick={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPassword(''); setPasswordMsg(null) }}
                  style={{
                    padding: '9px 18px', fontSize: 14, fontWeight: 500,
                    color: 'var(--text-secondary)', backgroundColor: 'transparent',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
              {passwordMsg && <div style={msgStyle(passwordMsg.type)}>{passwordMsg.text}</div>}
            </div>
          )}
        </div>
      )}

      {/* Local Data */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Your Data</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
          {user ? 'Synced to your account across devices.' : 'Stored in your browser — sign in to sync across devices.'}
        </p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Trips', count: localCounts.trips, icon: '🗺️' },
            { label: 'Flights', count: localCounts.flights, icon: '✈️' },
            { label: 'Wallet', count: localCounts.wallet, icon: '💳' },
          ].map(item => (
            <div key={item.label} style={{
              padding: '12px 16px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)', flex: 1, textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, marginBottom: 2 }}>{item.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{item.count}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.label}</div>
            </div>
          ))}
        </div>
        <button
          onClick={handleClearData}
          disabled={totalLocal === 0}
          style={{
            padding: '9px 18px',
            backgroundColor: totalLocal === 0 ? 'var(--border)' : 'var(--bg)',
            color: totalLocal === 0 ? 'var(--text-muted)' : 'var(--danger)',
            border: totalLocal === 0 ? 'none' : '1px solid var(--danger)',
            borderRadius: 'var(--radius-sm)',
            cursor: totalLocal === 0 ? 'default' : 'pointer',
            fontWeight: 600, fontSize: 14,
          }}
        >
          {totalLocal === 0 ? 'No local data' : 'Clear All Local Data'}
        </button>
      </div>

      {/* Danger Zone */}
      <div style={{
        ...cardStyle,
        border: '1px solid var(--danger)',
        backgroundColor: '#FEF2F2',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showDeleteConfirm ? 14 : 0 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--danger)', marginBottom: 2 }}>
              Danger Zone
            </h2>
            {!showDeleteConfirm && (
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                Permanently delete your account and data.
              </p>
            )}
          </div>
          {!showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: '7px 14px', fontSize: 14, fontWeight: 600,
                color: 'var(--danger)', backgroundColor: 'transparent',
                border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Delete Account
            </button>
          )}
        </div>

        {showDeleteConfirm && (
          <div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
              This will permanently delete your account and all associated data. Type <strong>DELETE</strong> to confirm.
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE"
                style={{ margin: 0, maxWidth: 160 }}
              />
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE' || deleting}
                style={{
                  padding: '9px 18px',
                  backgroundColor: deleteConfirm === 'DELETE' ? 'var(--danger)' : 'var(--border)',
                  color: deleteConfirm === 'DELETE' ? '#fff' : 'var(--text-muted)',
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'default',
                  fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap',
                }}
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm(''); setDeleteError('') }}
                style={{
                  padding: '9px 14px', fontSize: 14, fontWeight: 500,
                  color: 'var(--text-secondary)', backgroundColor: 'transparent',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
            {deleteError && <div style={msgStyle('error')}>{deleteError}</div>}
          </div>
        )}
      </div>

      {/* Sign Out */}
      <button
        onClick={signOut}
        style={{
          width: '100%', padding: 14, marginTop: 8,
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          cursor: 'pointer', fontSize: 15, fontWeight: 600,
        }}
      >
        Sign Out
      </button>
    </div>
  )
}
