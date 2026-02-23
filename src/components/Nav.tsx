'use client'

import { useRouter, usePathname } from 'next/navigation'

export default function Nav() {
  const router = useRouter()
  const pathname = usePathname()

  if (pathname === '/') return null

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 20px',
      borderBottom: '1px solid #eee',
      maxWidth: 600,
      margin: '0 auto',
    }}>
      <span
        onClick={() => router.push('/')}
        style={{ fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}
      >
        PointPilot
      </span>
      <div style={{ display: 'flex', gap: 16 }}>
        <span
          onClick={() => router.push('/trips')}
          style={{ cursor: 'pointer', color: pathname.startsWith('/trip') ? '#000' : '#666', fontSize: 14 }}
        >
          My Trips
        </span>
        <span
          onClick={() => router.push('/wallet')}
          style={{ cursor: 'pointer', color: pathname === '/wallet' ? '#000' : '#666', fontSize: 14 }}
        >
          Wallet
        </span>
      </div>
    </div>
  )
}