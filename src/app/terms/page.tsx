export default function TermsPage() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '48px 20px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>Last updated: March 2026</p>

      <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
        <Section title="1. Acceptance of Terms">
          By accessing or using Point Tripper (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
        </Section>

        <Section title="2. Description of Service">
          Point Tripper is a travel planning tool that helps users compare flight options, manage loyalty points, and build optimized travel itineraries. The Service includes a web application and a Chrome browser extension.
        </Section>

        <Section title="3. User Accounts">
          You may need to create an account to use certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating an account.
        </Section>

        <Section title="4. User Data">
          You retain ownership of all data you input into the Service, including trip information, flight details, and loyalty program balances. We store this data solely to provide the Service to you. See our Privacy Policy for details on how we handle your data.
        </Section>

        <Section title="5. Acceptable Use">
          You agree not to: (a) use the Service for any unlawful purpose; (b) attempt to gain unauthorized access to the Service or its related systems; (c) interfere with or disrupt the Service; (d) scrape, crawl, or use automated means to access the Service beyond normal use.
        </Section>

        <Section title="6. Third-Party Services">
          The Service may display information from third-party booking sites and loyalty programs. We are not responsible for the accuracy of third-party data. Flight prices, availability, and loyalty program terms are subject to change by the respective providers.
        </Section>

        <Section title="7. Disclaimer of Warranties">
          The Service is provided &quot;as is&quot; without warranties of any kind, either express or implied. We do not guarantee that flight prices, point values, or transfer rates displayed are accurate or current. Always verify details directly with airlines and loyalty programs before booking.
        </Section>

        <Section title="8. Limitation of Liability">
          Point Tripper shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to lost savings, missed bookings, or inaccurate point calculations.
        </Section>

        <Section title="9. Changes to Terms">
          We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the updated terms.
        </Section>

        <Section title="10. Contact">
          For questions about these terms, contact us at <a href="mailto:support@pointtripper.com" style={{ color: 'var(--primary)', textDecoration: 'none' }}>support@pointtripper.com</a>.
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{title}</h2>
      <p>{children}</p>
    </div>
  )
}
