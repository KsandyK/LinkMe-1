import { LegalDownloadBar } from "@/components/LegalDownloadBar";
import { PRIVACY_POLICY } from "@/lib/legal-content";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="text-4xl mb-3">ðŸ”</div>
          <h1 className="text-3xl font-black text-foreground mb-1">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm">Last updated: March 27, 2026 | Effective: March 27, 2026</p>
        </div>

        <LegalDownloadBar doc={PRIVACY_POLICY} />

        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 mb-6">
          <p className="text-primary text-sm font-semibold">ðŸ”’ Your Privacy Matters</p>
          <p className="text-muted-foreground text-xs mt-1">LinkMe is committed to protecting your privacy. We handle adult content and interactions with the highest discretion. Your billing statement will show a neutral merchant name â€” never "LinkMe."</p>
        </div>

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          {[
            {
              title: "1. Information We Collect",
              content: `1.1 Account Information: When you register, we collect your email address, username, date of birth (to verify age), and password (hashed).\n\n1.2 Payment Information: Credit card and billing information is handled exclusively by CCBill, our payment processor. LinkMe does not store your full payment card details.\n\n1.3 Usage Data: We collect information about how you use the platform including pages visited, content unlocked, streams watched, messages sent, and credits spent.\n\n1.4 Device & Technical Data: IP address, browser type, operating system, device identifiers, and time zone.\n\n1.5 Communications: Content of messages sent through the platform may be stored for safety and moderation purposes.\n\n1.6 Cookies: We use cookies and similar tracking technologies to maintain your session and improve the user experience.`,
            },
            {
              title: "2. How We Use Your Information",
              content: `We use your information to:\n\nâ€¢ Provide, operate, and maintain the Service\nâ€¢ Verify your age (18+ requirement)\nâ€¢ Process payments and manage your credit balance\nâ€¢ Personalize your experience and recommendations\nâ€¢ Prevent fraud, abuse, and illegal activity\nâ€¢ Send transactional emails (purchase receipts, security alerts)\nâ€¢ Comply with legal obligations\nâ€¢ Improve the platform based on usage analytics\n\nWe do not sell your personal information to third parties.`,
            },
            {
              title: "3. Billing Discretion",
              content: `We understand the sensitive nature of adult platform billing. All charges will appear on your bank or credit card statement as "CCBILL*LinkMe" or a similar neutral descriptor. We never use "adult," "dating," or explicit language in billing descriptors.\n\nFor maximum discretion, we recommend using a prepaid card or virtual card number available from most banks.`,
            },
            {
              title: "4. Data Sharing",
              content: `We share your information only with:\n\nâ€¢ CCBill (payment processing) â€” subject to CCBill's privacy policy\nâ€¢ Cloud infrastructure providers (hosting, CDN)\nâ€¢ Analytics providers (aggregate, anonymized data only)\nâ€¢ Law enforcement when required by valid legal process\n\nWe do not share your data with advertisers, marketers, or data brokers.`,
            },
            {
              title: "5. Creator Interactions",
              content: `Creators on LinkMe are independent contractors. While we facilitate interactions, please be aware:\n\nâ€¢ Creators can see your username and public profile when you interact with them\nâ€¢ Messages you send are visible to the recipient creator\nâ€¢ Gifts and tips sent are visible to the creator\nâ€¢ Creators cannot see your real name, payment information, or physical address`,
            },
            {
              title: "6. Data Retention",
              content: `We retain your account data for as long as your account is active. Upon account deletion:\n\nâ€¢ Account data is deleted within 30 days\nâ€¢ Payment records are retained for 7 years as required by law\nâ€¢ Anonymized usage data may be retained indefinitely\n\nYou may request deletion of your account at any time by contacting support@LinkMe.com.`,
            },
            {
              title: "7. Security",
              content: `We employ industry-standard security measures including:\n\nâ€¢ TLS/HTTPS encryption for all data in transit\nâ€¢ AES-256 encryption for sensitive data at rest\nâ€¢ Regular security audits and penetration testing\nâ€¢ Two-factor authentication (optional)\nâ€¢ Access controls limiting employee access to personal data\n\nNo system is 100% secure. In the event of a data breach, we will notify affected users within 72 hours as required by applicable law.`,
            },
            {
              title: "8. Your Rights (GDPR / CCPA)",
              content: `Depending on your location, you may have the following rights:\n\nâ€¢ Right to access your personal data\nâ€¢ Right to correct inaccurate data\nâ€¢ Right to deletion ("right to be forgotten")\nâ€¢ Right to data portability\nâ€¢ Right to restrict processing\nâ€¢ Right to opt out of marketing communications\n\nTo exercise these rights, contact: privacy@LinkMe.com\n\nCalifornia residents have additional rights under the CCPA, including the right to know what personal information is sold and the right to opt-out.`,
            },
            {
              title: "9. Cookies Policy",
              content: `We use:\n\nâ€¢ Essential cookies: Required for the platform to function (session management, age verification)\nâ€¢ Analytics cookies: Help us understand how the platform is used (can be disabled)\nâ€¢ Preference cookies: Remember your settings\n\nYou can control cookies through your browser settings. Disabling essential cookies may prevent the platform from functioning correctly.`,
            },
            {
              title: "10. Contact",
              content: `Privacy inquiries:\n\nLinkMe Inc. â€” Data Privacy Officer\nprivacy@LinkMe.com\n\nFor GDPR requests (EU residents):\ngdpr@LinkMe.com`,
            },
          ].map(section => (
            <div key={section.title} className="p-5 rounded-xl border border-border bg-card">
              <h2 className="text-foreground font-bold mb-3">{section.title}</h2>
              <p className="whitespace-pre-line">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
