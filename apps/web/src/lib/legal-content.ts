export const TERMS_OF_SERVICE = `LINKME INC. – TERMS OF SERVICE
Last Updated: May 21, 2026

Welcome to LinkMe. By accessing or using the LinkMe platform, you agree to these Terms of Service. Please read them carefully.

1. Eligibility
You must be at least 18 years old to use LinkMe. By using the platform, you confirm that you are 18 or older.

2. Account Registration
You agree to provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your account.

3. Content and Conduct
You agree not to post or share any illegal, harmful, or non-consensual content. LinkMe reserves the right to remove content and suspend accounts that violate these rules.

4. Payments and Credits
All purchases are final. Credits and subscriptions are non-refundable except where required by law.

5. Termination
LinkMe may terminate or suspend your account at any time for violation of these terms.

6. Limitation of Liability
LinkMe is not liable for any indirect or consequential damages arising from your use of the platform.

By using LinkMe, you agree to these terms in full.`;

export const PRIVACY_POLICY = `LINKME INC. – PRIVACY POLICY
Last Updated: May 21, 2026

LinkMe Inc. ("LinkMe", "we", "us", or "our") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information.

1. Information We Collect
- Account information (email, username, age)
- Payment information (processed securely via CCBill)
- Usage data and interactions on the platform

2. How We Use Your Information
- To provide and improve our services
- To process payments and subscriptions
- To verify age and prevent fraud
- To communicate with you about your account

3. Data Sharing
We do not sell your personal data. We only share information with trusted service providers (such as payment processors) when necessary.

4. Data Security
We use industry-standard security measures, including encryption and secure storage.

5. Your Rights
You may request access, correction, or deletion of your personal data by contacting support@linkme.com.

6. Changes to This Policy
We may update this Privacy Policy from time to time. We will notify users of significant changes.

Last Updated: May 21, 2026`;

export const CODE_OF_CONDUCT = `LINKME INC. – CODE OF CONDUCT
Last Updated: May 21, 2026

All users of LinkMe are expected to follow this Code of Conduct:

- Treat all users with respect
- Do not harass, threaten, or abuse others
- Do not share illegal or non-consensual content
- Do not impersonate others or post false information
- Respect the privacy of other users
- Report any violations you witness

Violation of this Code of Conduct may result in account suspension or termination.`;

export const CREATOR_AGREEMENT = `LINKME INC. – CREATOR AGREEMENT & NDA
Last Updated: May 21, 2026

This Creator Agreement applies to all creators on LinkMe.

1. Content Ownership
You retain ownership of your content but grant LinkMe a license to display and promote it on the platform.

2. Age Verification
All creators must provide valid government-issued ID to verify they are 18 or older.

3. Revenue Share
Creators receive 80% of earnings from their content and live sessions (subject to payment processor fees).

4. Non-Disclosure
You agree not to disclose confidential information about LinkMe's platform, features, or business operations.

5. Termination
LinkMe may terminate this agreement and remove creator status at any time for violation of platform rules.

By applying to become a creator, you agree to the terms above.`;

export const LEGAL_DOCS = {
  terms: TERMS_OF_SERVICE,
  privacy: PRIVACY_POLICY,
  dmca: "DMCA content will be added here.",
  refunds: "Refund policy content will be added here.",
  community: "Community guidelines will be added here.",
  code: CODE_OF_CONDUCT,
  creator: CREATOR_AGREEMENT,
};

export const COMPANY = {
  name: "LinkMe Inc.",
  email: "legal@linkme.com",
  support: "support@linkme.com",
  website: "https://linkme.com",
};

export function downloadLegalDoc(docKey: string) {
  const content = (LEGAL_DOCS as any)[docKey];
  if (!content) return;

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `LinkMe-${docKey}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadAllLegalDocs() {
  const content = Object.entries(LEGAL_DOCS)
    .map(([key, text]) => `=== ${key.toUpperCase()} ===\n\n${text}\n\n`)
    .join("");

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "LinkMe-Legal-Documents.txt";
  a.click();
  URL.revokeObjectURL(url);
}
