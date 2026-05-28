/**
 * LinkME — Legal Content (download source)
 * Synced with LegalPages.tsx v3 — no CCBill references.
 * These strings are served as downloadable .txt files via downloadLegalDoc().
 */

export interface LegalDoc {
  key: string;
  title: string;
  content: string;
}

export const TERMS_OF_SERVICE: LegalDoc = {
  key: "terms",
  title: "Terms of Service",
  content: `LinkME LLC – TERMS OF SERVICE
Version 3.0 | Effective: May 27, 2026

IMPORTANT: This agreement contains a mandatory arbitration clause and class action waiver (Section 11).

1. ACCEPTANCE
By accessing LinkME you agree to these Terms, our Privacy Policy, Cookie Policy, and Code of Conduct. You must be 18+ to use this Service.

2. ELIGIBILITY
You must be at least 18 years of age. You represent under penalty of perjury that you are 18+ and legally permitted to access adult content in your jurisdiction.

3. CREDITS & PURCHASES
Credits are virtual currency with no cash value. All purchases are final and non-refundable except as required by law or as described in our Refund Policy. Membership subscriptions auto-renew; cancel 48 hours before renewal.

4. CHARGEBACKS
Contact support@LinkME.com before initiating any payment dispute. Chargebacks without prior contact result in account suspension and liability for an administrative processing fee.

5. USER CONDUCT & FOSTA-SESTA
You may not use LinkME to facilitate prostitution, sex trafficking, or solicitation of real-world sexual services. Any violation is reported to NCMEC and law enforcement immediately. Full conduct rules in our Code of Conduct.

6. CONTENT & IP
Creators retain copyright. Purchasing content grants a personal, non-transferable viewing license only. Do not download, screenshot, or redistribute content.

7. PRIVACY
Governed by our Privacy Policy and Cookie Policy. All billing charges appear as "LinkME" on your statement.

8. LIMITATION OF LIABILITY
LinkME's liability is limited to the greater of amounts paid in the prior 12 months or $100 USD. No liability for indirect, incidental, or consequential damages.

9. TERMINATION
LinkME may terminate accounts with or without cause. Credits are forfeited on termination for cause.

10. GOVERNING LAW
Laws of the State of Delaware. Subject to mandatory arbitration (Section 11).

11. MANDATORY ARBITRATION & CLASS ACTION WAIVER
ALL DISPUTES RESOLVED BY BINDING INDIVIDUAL ARBITRATION (AAA Consumer Rules). YOU WAIVE THE RIGHT TO JURY TRIAL AND CLASS ACTION PARTICIPATION.
- Send written Notice of Dispute to legal@LinkME.com first (30-day informal resolution period)
- AAA arbitration in Sheridan, WY or by videoconference
- Small claims court exception applies
- 30-day opt-out right: email legal@LinkME.com within 30 days of first acceptance

Legal: legal@LinkME.com | 30 N Gould St Ste N, Sheridan, WY 82801, USA
© 2026 LinkME LLC All rights reserved.`,
};

export const PRIVACY_POLICY: LegalDoc = {
  key: "privacy",
  title: "Privacy Policy",
  content: `LinkME LLC – PRIVACY POLICY
Version 2.0 | Effective: May 27, 2026

1. INFORMATION WE COLLECT
- Account info (name, email, date of birth, username)
- Age verification (government ID, verification results)
- Payment info (processed securely; we do not store full card numbers)
- Usage data, device info, cookies (see Cookie Policy)
- Communications and content you create

2. HOW WE USE YOUR INFORMATION
- Provide and improve the Service
- Process payments and verify age
- Enforce Terms of Service and comply with law (FOSTA-SESTA, § 2257, DMCA)
- Detect and prevent fraud
- Marketing communications (with consent where required)

3. DATA SHARING
We do NOT sell your personal information. We share only with:
- Payment processors (for transaction processing)
- Hosting and security providers
- Law enforcement (when legally required)
- Age verification services

4. SECURITY
AES-256 encryption at rest, TLS 1.3 in transit, PCI DSS Level 1 payment processing.

5. YOUR RIGHTS
Access, correct, or delete your data: legal@LinkME.com

6. CALIFORNIA RESIDENTS (CCPA)
- Right to know, delete, correct, and opt-out of sale (we don't sell data)
- Right to non-discrimination
- Submit requests: legal@LinkME.com (Subject: "CCPA Request")
- Response within 45 days

7. EU/EEA/UK RESIDENTS (GDPR)
Legal bases: contract performance, legal obligation, legitimate interests, consent.
Rights: access, rectification, erasure, portability, objection, restriction.
Submit requests: legal@LinkME.com | Response within 30 days.
Right to lodge complaint with your local DPA.

8. COOKIES
See our Cookie Policy for full details on cookies and your opt-out options.

9. DATA RETENTION
Account data: 1 year post-termination. Payment records: 7 years. Age verification: 5 years.

Privacy: legal@LinkME.com | GDPR: legal@LinkME.com
30 N Gould St Ste N, Sheridan, WY 82801, USA
© 2026 LinkME LLC All rights reserved.`,
};

export const CREATOR_AGREEMENT: LegalDoc = {
  key: "creator",
  title: "Creator Agreement & NDA",
  content: `LinkME LLC – CREATOR AGREEMENT & NDA
Version 3.0 | Effective: May 27, 2026

PART I — CREATOR SERVICES AGREEMENT

1. INDEPENDENT CONTRACTOR
You are an independent contractor. You are responsible for your own taxes. LinkME issues Form 1099-NEC for US creators earning $600+.

2. REVENUE SHARE TIERS

2a. GRACE PERIOD (First 90 Days)
All new creators automatically earn at the Growth tier rate (80% / 20%) for their first 90 days on the platform, regardless of monthly earnings volume. No application required — grace period is applied automatically from your creator activation date.

2b. STANDARD TIERS (post-Grace Period)
- Growth Tier ($0–$5,000/mo): 80% Creator / 20% Platform
- Established Tier ($5,001–$15,000/mo): 80% / 20%
- Elite Tier ($15,001–$25,000/mo): 83% / 17%
- Partner Tier ($25,001–$75,000/mo): 85% / 15%
- Senior Partner Tier ($75,001–$150,000/mo): 87% / 13%
- Executive Partner Tier ($150,001–$300,000/mo): 88% / 12%
- Premier Partner Tier ($300,001–$500,000/mo): 89% / 11%
- Top Partner Tier ($500,001–$1,000,000/mo): 90% / 10%
- Pinnacle Tier ($1,000,001+/mo): 90% / 10% [MAXIMUM — platform minimum 10% at all revenue levels]
Revenue shares calculated AFTER payment processing fees (~3–5% per transaction).
Payouts every Friday; minimum threshold $50 USD.

2c. CREATOR REFERRAL TIER BOOST PROGRAM (One-Time)
Bring 25 qualifying referrals to the platform using your unique Creator/Streamer Code AND those referrals collectively earn $10,000/month on-platform — you receive a permanent one-time revenue share rate boost to the next percentage bracket (e.g., 80% → 83%, or 85% → 87%).
- One-time reward per creator account. Non-repeatable and non-transferable.
- Your unique code is available in your Creator Dashboard under the "Referral" tab.
- Qualifying referral: any subscriber or creator who registers using your code and remains active (earning or spending) for 30+ consecutive days.
- The $10,000/month collective earnings threshold is measured across a rolling 30-day window.
- Tier boost is applied automatically upon verification. Confirmation email sent to your registered address.

3. § 2257 RECORD-KEEPING & CUSTODIAN OF RECORDS
Compliance with 18 U.S.C. § 2257 is mandatory. Maintain age verification records for all depicted individuals for 5+ years.
Custodian of Records: Chief Compliance Officer, LinkME LLC, 30 N Gould St Ste N, Wilmington DE 19801. legal@LinkME.com.

4. FOSTA-SESTA COMPLIANCE (MANDATORY)
You are strictly prohibited from using LinkME to advertise, facilitate, or solicit real-world sexual services or sex trafficking. Violation = immediate permanent termination, forfeiture of all balances, reporting to NCMEC and law enforcement.

5. CONTENT STANDARDS
PERMITTED: Consensual adult content between verified adults.
NEVER PERMITTED: CSAM, non-consensual content, real violence, bestiality, trafficking-related content.

6. TERMINATION & EARNINGS
- Termination FOR CAUSE (violations): All unpaid earnings are forfeited.
- Termination WITHOUT CAUSE (LinkME discretion): All CLEARED earnings (past 90-day chargeback window) paid on next weekly cycle; uncleared earnings paid on their clearing dates.
- Voluntary termination: Cleared earnings paid on next cycle; 7 days' written notice required.

PART II — NON-DISCLOSURE AGREEMENT

7. CONFIDENTIALITY
You agree to keep confidential all LinkME business information, algorithms, earnings data, and unreleased features.

8. NDA SURVIVAL
This confidentiality obligation survives termination for TWO (2) YEARS following the effective date of termination. After two years, publicly available information is no longer restricted.

Creators: creators@LinkME.com | Compliance: legal@LinkME.com
30 N Gould St Ste N, Sheridan, WY 82801, USA
© 2026 LinkME LLC All rights reserved.`,
};

export const CODE_OF_CONDUCT: LegalDoc = {
  key: "conduct",
  title: "Code of Conduct",
  content: `LinkME LLC – CODE OF CONDUCT
Version 2.0 | Effective: May 27, 2026

CORE PRINCIPLES: Consent. Safety. Respect. Authenticity. Legality.

PROHIBITED FOR ALL USERS:
- Harassment, stalking, doxxing, threats, or abuse
- Soliciting or facilitating real-world sexual services (FOSTA-SESTA)
- Creating, sharing, or requesting CSAM (reported to NCMEC immediately)
- Non-consensual intimate images
- Using bots, scripts, or automation to manipulate the platform
- Fraud, scams, or financial crimes
- Sharing anyone's personal information without consent

CREATOR RESPONSIBILITIES:
- Maintain § 2257 records for all depicted individuals
- Ensure all on-screen individuals are 18+ and consented
- Do not solicit off-platform payments outside LinkME's system

VIEWER RESPONSIBILITIES:
- Do not attempt to arrange in-person meetings with creators
- Do not record or redistribute creator content without permission
- Respect creator boundaries — no means no

ENFORCEMENT TIERS:
- Warning: Minor first-time violations
- Temporary Suspension (7–30 days): Repeated or moderate violations
- Permanent Ban: Severe violations or illegal content
- Legal Action: CSAM, trafficking, fraud, criminal activity

CONTENT MODERATION APPEALS:
To appeal a removal or suspension, email support@LinkME.com within 30 days.
Subject: "Moderation Appeal — [Username]"
Include: username, account email, action appealed, date, explanation, evidence.
Response time: 5–14 business days depending on severity.
Appeals are reviewed by a different team member than the original decision.
Zero-tolerance violations (CSAM, trafficking) are not eligible for appeal.

Report violations: support@LinkME.com
Emergencies (minors/trafficking): legal@LinkME.com
Appeals: support@LinkME.com
© 2026 LinkME LLC All rights reserved.`,
};

export const DMCA_POLICY: LegalDoc = {
  key: "dmca",
  title: "DMCA Policy",
  content: `LinkME LLC – DMCA POLICY
Version 1.0 | Effective: May 27, 2026

DMCA Agent: legal@LinkME.com
LinkME LLC, 30 N Gould St Ste N, Sheridan, WY 82801, USA

TAKEDOWN NOTICE (17 U.S.C. § 512(c)(3))
To report copyright infringement, your notice must include:
1. Identification of the copyrighted work claimed to be infringed
2. Identification of the infringing material and its location (URL/username)
3. Your contact information (full name, address, phone, email)
4. Statement of good faith belief that the use is not authorized
5. Statement of accuracy under penalty of perjury
6. Your physical or electronic signature

Send to: legal@LinkME.com

WARNING: Knowingly filing a false DMCA claim is perjury (17 U.S.C. § 512(f)).

COUNTER-NOTIFICATION (17 U.S.C. § 512(g)(3))
If your content was wrongly removed, your counter-notice must include:
1. Identification of the removed material and its prior location
2. Statement under penalty of perjury of good faith belief the removal was in error
3. Your full name, address, and phone number
4. Consent to jurisdiction of the Federal District Court (Delaware)
5. Your signature

After a valid counter-notice, the complainant has 10–14 business days to file a court action before we restore the content.

REPEAT INFRINGER POLICY
Accounts with multiple valid DMCA notices within 12 months may be terminated.

Non-copyright violations: support@LinkME.com
© 2026 LinkME LLC All rights reserved.`,
};

export const REFUND_POLICY: LegalDoc = {
  key: "refund",
  title: "Refund Policy",
  content: `LinkME LLC – REFUND POLICY
Version 1.0 | Effective: May 27, 2026

GENERAL: All credit purchases are final and non-refundable.

ELIGIBLE FOR REFUND:
1. Technical errors — credits deducted without feature delivery, duplicate charges
   (Report within 7 days to support@LinkME.com with transaction ID)
2. Unauthorized transactions — account accessed without your authorization
   (Contact support@LinkME.com and support@LinkME.com immediately)
3. Consumer protection law requirements in your jurisdiction
4. Platform permanent shutdown (pro-rated unused credit balance refunded)

NOT ELIGIBLE FOR REFUND:
- Used/consumed credits (tips, gifts, unlocked content)
- Change of mind after purchase
- Account suspensions for Terms violations
- Monthly subscription fees for periods already accessed
- Boost packages already applied

SUBSCRIPTION CANCELLATIONS:
- Monthly: Non-refundable for current period. Cancel in Account Settings → Billing.
- Annual: 7-day cooling-off period from initial purchase (pro-rated refund if not accessed).
- Cancel at least 48 hours before renewal to avoid next charge.

HOW TO REQUEST A REFUND:
Email: support@LinkME.com
Subject: "Refund Request — [Transaction ID]"
Include: username, email, transaction ID, date, amount, reason, evidence.
Response: 2 business days acknowledgment; 5–10 business days resolution.
Approved refunds returned to original payment method within 5–10 business days.

Billing: support@LinkME.com
© 2026 LinkME LLC All rights reserved.`,
};

export const COOKIE_POLICY: LegalDoc = {
  key: "cookies",
  title: "Cookie Policy",
  content: `LinkME LLC – COOKIE POLICY
Version 1.0 | Effective: May 27, 2026

We use cookies and similar technologies to operate the platform, remember your preferences, and comply with legal requirements.

STRICTLY NECESSARY (cannot be disabled):
- Age gate and verification status
- Authentication session
- CSRF/security tokens

FUNCTIONAL (can be disabled, may affect features):
- Credit balance, membership tier, saved payment methods
- Boost package, notification preferences

ANALYTICS (opt-out available):
- Aggregated page views and feature usage (anonymized)

SECURITY / FRAUD PREVENTION (cannot be disabled):
- Bot detection and fraud prevention

WE DO NOT:
- Use cookies for behavioral advertising
- Allow third-party ad networks to set cookies
- Track you across other websites

YOUR CHOICES:
- Manage preferences via cookie consent banner (shown on first visit)
- Browser settings: Chrome/Firefox/Safari/Edge all allow cookie management
- Opt out of analytics: legal@LinkME.com

GDPR: We obtain consent before placing non-essential cookies.
CCPA: We do not sell personal information collected via cookies.

Adult platform note: Age gate and verification cookies are essential. Clearing them will require re-verification on next visit.

Privacy: legal@LinkME.com
© 2026 LinkME LLC All rights reserved.`,
};

export const COMMUNITY_GUIDELINES: LegalDoc = {
  key: "community",
  title: "Community Guidelines",
  content: `LinkME LLC – COMMUNITY GUIDELINES
Version 1.0 | Effective: May 27, 2026

OUR VALUES: Consent. Safety. Authenticity. Respect. Legality.

WHAT'S ALLOWED:
- Adult content between verified adults (creators, in designated areas)
- Consensual fantasy, roleplay, and expression
- Educational discussions about adult topics
- Artistic and creative adult expression

NEVER ALLOWED (zero tolerance):
- CSAM (any sexual content involving minors) → Immediately reported to NCMEC + law enforcement
- Non-consensual content or content simulating assault approvingly
- Real violence, abuse, or harm to persons or animals
- Bestiality
- Trafficking, solicitation, or prostitution (FOSTA-SESTA)
- Deepfakes of real people without documented consent
- Hate speech dehumanizing real groups of people

CREATOR RULES:
- All depicted individuals must be 18+ with documented consent
- Maintain § 2257 age records for all content featuring others
- No soliciting off-platform payments outside LinkME's system
- Public streams must remain non-explicit

VIEWER RULES:
- Respect creator boundaries and decisions
- Do not record or redistribute content without permission
- Do not seek a creator's real-world identity
- Do not arrange real-world meetings through the platform

MESSAGING:
- No unsolicited explicit content
- No harassment after being asked to stop
- No off-platform solicitation

REPORTING VIOLATIONS:
In-platform: Use "Report" button on any profile, message, or stream.
Email: support@LinkME.com
Minors/Trafficking emergencies: legal@LinkME.com (escalated within 1 hour)

APPEALS: Email support@LinkME.com within 30 days of any moderation action.

Safety: support@LinkME.com | Community: support@LinkME.com
© 2026 LinkME LLC All rights reserved.`,
};

export const LEGAL_DOCS: Record<string, LegalDoc> = {
  terms:     TERMS_OF_SERVICE,
  privacy:   PRIVACY_POLICY,
  creator:   CREATOR_AGREEMENT,
  conduct:   CODE_OF_CONDUCT,
  dmca:      DMCA_POLICY,
  refund:    REFUND_POLICY,
  cookies:   COOKIE_POLICY,
  community: COMMUNITY_GUIDELINES,
};

export const COMPANY = {
  name:    "LinkME LLC",
  email:   "legal@LinkME.com",
  support: "support@LinkME.com",
  website: "https://LinkME.com",
};

export function downloadLegalDoc(doc: LegalDoc) {
  const blob = new Blob([doc.content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `LinkME-${doc.key}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadAllLegalDocs() {
  const content = Object.values(LEGAL_DOCS)
    .map(doc => `${"=".repeat(60)}\n${doc.title.toUpperCase()}\n${"=".repeat(60)}\n\n${doc.content}\n\n`)
    .join("");

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "LinkME-Legal-Documents.txt";
  a.click();
  URL.revokeObjectURL(url);
}
