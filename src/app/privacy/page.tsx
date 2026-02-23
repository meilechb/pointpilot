import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Point Tripper privacy policy — how we handle your data.',
}

const sectionTitle: React.CSSProperties = {
  fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 8,
}

const paragraph: React.CSSProperties = {
  fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16,
}

const list: React.CSSProperties = {
  fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16,
  paddingLeft: 24,
}

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>
        Last updated: February 2026
      </p>

      <p style={paragraph}>
        Point Tripper ("we", "us", "our") is a free tool that helps you organize flight options and optimize credit card points for travel bookings. This policy explains what data we collect, how we use it, and your rights.
      </p>

      <h2 style={sectionTitle}>What We Collect</h2>
      <p style={paragraph}>
        <strong>Account information:</strong> If you create an account, we collect your email address and display name through Supabase Authentication. If you sign in with Google, we receive your name, email, and profile picture from Google — we do not receive your Google password.
      </p>
      <p style={paragraph}>
        <strong>Local data:</strong> Your trips, flights, and points wallet are stored in your browser's local storage. This data stays on your device and is not sent to our servers unless you explicitly choose to sync it.
      </p>
      <p style={paragraph}>
        <strong>Usage data:</strong> We use Google Analytics to understand how people use the site (pages visited, time on site, general location). This data is aggregated and does not personally identify you.
      </p>

      <h2 style={sectionTitle}>How We Use Your Data</h2>
      <ul style={list}>
        <li>To provide and improve Point Tripper's features</li>
        <li>To save your account preferences and data across devices (if signed in)</li>
        <li>To understand usage patterns and improve the experience</li>
        <li>To display relevant advertisements via Google AdSense</li>
      </ul>

      <h2 style={sectionTitle}>Third-Party Services</h2>
      <p style={paragraph}>We use the following third-party services:</p>
      <ul style={list}>
        <li><strong>Supabase</strong> — authentication and database hosting. Your account data is stored on Supabase servers. <a href="https://supabase.com/privacy" style={{ color: 'var(--primary)' }}>Supabase Privacy Policy</a></li>
        <li><strong>Google Analytics</strong> — anonymous usage tracking. <a href="https://policies.google.com/privacy" style={{ color: 'var(--primary)' }}>Google Privacy Policy</a></li>
        <li><strong>Google AdSense</strong> — advertising. Google may use cookies to serve ads based on your browsing history. <a href="https://policies.google.com/technologies/ads" style={{ color: 'var(--primary)' }}>Google Ads Policy</a></li>
        <li><strong>Vercel</strong> — website hosting. <a href="https://vercel.com/legal/privacy-policy" style={{ color: 'var(--primary)' }}>Vercel Privacy Policy</a></li>
      </ul>

      <h2 style={sectionTitle}>Cookies</h2>
      <p style={paragraph}>
        We use cookies for authentication (keeping you signed in) and analytics. Google Analytics and AdSense may set their own cookies. You can disable cookies in your browser settings, but some features may not work properly.
      </p>

      <h2 style={sectionTitle}>Data Sharing</h2>
      <p style={paragraph}>
        We do not sell, rent, or share your personal information with third parties for marketing purposes. We only share data with the service providers listed above, strictly to operate Point Tripper.
      </p>

      <h2 style={sectionTitle}>Data Retention & Deletion</h2>
      <p style={paragraph}>
        Local data (trips, flights, wallet) is stored only in your browser and can be cleared at any time by clearing your browser data. Account data is retained as long as your account exists. You can delete your account and all associated data from the Account page.
      </p>

      <h2 style={sectionTitle}>Your Rights</h2>
      <p style={paragraph}>You have the right to:</p>
      <ul style={list}>
        <li>Access the personal data we hold about you</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your account and data</li>
        <li>Opt out of analytics tracking by using browser extensions or settings</li>
      </ul>

      <h2 style={sectionTitle}>Children's Privacy</h2>
      <p style={paragraph}>
        Point Tripper is not intended for children under 13. We do not knowingly collect personal information from children.
      </p>

      <h2 style={sectionTitle}>Changes to This Policy</h2>
      <p style={paragraph}>
        We may update this policy from time to time. Changes will be posted on this page with an updated date.
      </p>

      <h2 style={sectionTitle}>Contact</h2>
      <p style={paragraph}>
        If you have questions about this privacy policy or your data, contact us at{' '}
        <a href="mailto:meilechbiller18@gmail.com" style={{ color: 'var(--primary)' }}>
          meilechbiller18@gmail.com
        </a>.
      </p>
    </div>
  )
}
