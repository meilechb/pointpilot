'use client'

import Script from 'next/script'
import AuthProvider from '@/components/AuthProvider'
import Nav from '@/components/Nav'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5751210990513261"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <Script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-4HZ6XF1C20"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-4HZ6XF1C20');`}
      </Script>
      <AuthProvider>
        <Nav />
        <main style={{ minHeight: 'calc(100vh - 56px)' }}>
          {children}
        </main>
        <footer style={{
          textAlign: 'center', padding: '20px 16px',
          borderTop: '1px solid var(--border-light)',
          fontSize: 13, color: 'var(--text-muted)',
        }}>
          <a href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Privacy Policy
          </a>
        </footer>
      </AuthProvider>
    </>
  )
}
