'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase'

export default function AccountPage() {
  const { user, loading, signOut } = useAuth()
  const supabase = createClient()

  // Password change
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)

  // Local data
  const [localCounts, setLocalCounts] = useState({ trips: 0, flights: 0, wallet: 0 })
  const [dataCleared, setDataCleared] = useState(false)

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const isGoogleUser = user?.app_metadata?.provider === 'google'

  useEffect(() => {
    setLocalCounts({
      trips: JSON.parse(localStorage.getItem('trips') || '[]').length,
      flights: JSON.parse(localStorage.getItem('flights') || '[]').length,
      wallet: JSON.parse(localStorage.getItem('wallet') || '[]').length,
    })
  }, [dataCleared])

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
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  const handleClearData = () => {
    if (!confirm('This will delete all your locally saved trips, flights, and wallet entries. This cannot be undone. Continue?')) return
    localStorage.removeItem('trips')
    localStorage.removeItem('flights')
    localStorage.removeItem('wallet')
    setDataCleared(prev => !prev)
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
      // Clear local data too
      localStorage.removeItem('trips')
      localStorage.removeItem('flights')
      localStorage.removeItem('wallet')
      // Sign out and redirect
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
    fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)',
    marginBottom: 4, display: 'block',
  }

  const totalLocal = localCounts.trips + localCounts.flights + localCounts.wallet

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 20px 80px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>My Account</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Manage your profile, data, and account settings.
      </p>

      {/* A. Profile Info */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Profile</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <span style={labelStyle}>Email</span>
            <span style={{ fontSize: 15, fontWeight: 500 }}>{user.email}</span>
          </div>
          <div>
            <span style={labelStyle}>Name</span>
            <span style={{ fontSize: 15, fontWeight: 500 }}>
              {user.user_metadata?.full_name || user.user_metadata?.name || '—'}
            </span>
          </div>
          <div>
            <span style={labelStyle}>Sign-in method</span>
            <span style={{
              display: 'inline-block', padding: '4px 10px',
              borderRadius: 20, fontSize: 13, fontWeight: 600,
              backgroundColor: isGoogleUser ? '#E8F0FE' : 'var(--primary-light)',
              color: isGoogleUser ? '#1A73E8' : 'var(--primary)',
            }}>
              {isGoogleUser ? '🔵 Google' : '✉️ Email'}
            </span>
          </div>
        </div>
      </div>

      {/* B. Change Password (email users only) */}
      {!isGoogleUser && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Change Password</h2>
          <div>
            <label style={labelStyle}>New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              style={{ marginBottom: 10 }}
            />
            <label style={labelStyle}>Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Type it again"
              style={{ marginBottom: 14 }}
            />
            {passwordMsg && (
              <div style={{
                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                marginBottom: 12, fontSize: 14,
                backgroundColor: passwordMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                color: passwordMsg.type === 'success' ? '#065F46' : '#991B1B',
              }}>
                {passwordMsg.text}
              </div>
            )}
            <button
              onClick={handleChangePassword}
              disabled={changingPassword || !newPassword || !confirmPassword}
              style={{
                padding: '10px 20px',
                background: (!newPassword || !confirmPassword) ? 'var(--border)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                color: (!newPassword || !confirmPassword) ? 'var(--text-muted)' : 'var(--text-inverse)',
                border: 'none', borderRadius: 'var(--radius-sm)',
                cursor: (!newPassword || !confirmPassword) ? 'default' : 'pointer',
                fontWeight: 600, fontSize: 14,
              }}
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      )}

      {/* C. Manage Local Data */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Local Data</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Data stored in your browser (not synced to the cloud).
        </p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Trips', count: localCounts.trips, icon: '🗺️' },
            { label: 'Flights', count: localCounts.flights, icon: '✈️' },
            { label: 'Wallet', count: localCounts.wallet, icon: '💳' },
          ].map(item => (
            <div key={item.label} style={{
              padding: '10px 16px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)', flex: 1, minWidth: 100, textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, marginBottom: 2 }}>{item.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{item.count}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.label}</div>
            </div>
          ))}
        </div>
        <button
          onClick={handleClearData}
          disabled={totalLocal === 0}
          style={{
            padding: '10px 20px',
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

      {/* D. Delete Account */}
      <div style={{
        ...cardStyle,
        border: '1px solid var(--danger)',
        backgroundColor: '#FEF2F2',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>
          Danger Zone
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <label style={{ ...labelStyle, marginBottom: 6 }}>
          Type <strong>DELETE</strong> to confirm
        </label>
        <input
          type="text"
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder="DELETE"
          style={{ marginBottom: 12, maxWidth: 200 }}
        />
        {deleteError && (
          <div style={{
            padding: '8px 12px', borderRadius: 'var(--radius-sm)',
            marginBottom: 12, fontSize: 14,
            backgroundColor: '#FEE2E2', color: '#991B1B',
          }}>
            {deleteError}
          </div>
        )}
        <button
          onClick={handleDeleteAccount}
          disabled={deleteConfirm !== 'DELETE' || deleting}
          style={{
            padding: '10px 20px', display: 'block',
            backgroundColor: deleteConfirm === 'DELETE' ? 'var(--danger)' : 'var(--border)',
            color: deleteConfirm === 'DELETE' ? '#fff' : 'var(--text-muted)',
            border: 'none', borderRadius: 'var(--radius-sm)',
            cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'default',
            fontWeight: 600, fontSize: 14,
          }}
        >
          {deleting ? 'Deleting...' : 'Delete My Account'}
        </button>
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
