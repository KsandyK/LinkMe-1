/**
 * CRAVR — Legal Pages
 * Full legal suite — ToS v3, Privacy v2 (CCPA + GDPR), Creator Agreement v3,
 * Code of Conduct v2, DMCA Policy, Refund Policy, Cookie Policy, Community Guidelines
 * No CCBill references. No AI watermarks.
 */
import { useParams } from "wouter";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { LEGAL_DOCS } from "@/lib/legal-content";
import { LegalDownloadBar } from "@/components/LegalDownloadBar";

const LEGAL_CONTENT: Record<string, { title: string; content: string }> = {
  terms: {
    title: "Terms of Service",
    content: `
# Cravr LLC TERMS OF SERVICE

**Version:** 3.0
**Effective Date:** May 27, 2026
**Last Updated:** May 27, 2026

Cravr LLC
30 N Gould St Ste N
Sheridan, WY 82801, USA

Legal Department: legal@cravr.fun

---

## IMPORTANT LEGAL NOTICE — READ CAREFULLY

CRAVR is an adult platform restricted to users 18 years of age or older. By accessing this Service you are entering into a legally binding contract. If you do not agree to all Terms below, you must immediately cease using the Service. Access by minors is strictly prohibited and may constitute a criminal offense.

THIS AGREEMENT CONTAINS A MANDATORY ARBITRATION PROVISION AND CLASS ACTION WAIVER. BY USING THIS SERVICE, YOU WAIVE YOUR RIGHT TO A JURY TRIAL AND TO PARTICIPATE IN A CLASS ACTION. SEE SECTION 11 FOR FULL DETAILS.

---

## 1. ACCEPTANCE OF TERMS & BINDING AGREEMENT

1.1 By accessing, registering for, or using CRAVR ("Platform," "Service," "we," "us," or "our"), you ("User," "you") agree to be legally bound by these Terms of Service ("Terms"), our Privacy Policy, Cookie Policy, and Code of Conduct, all of which are incorporated herein by reference.

1.2 These Terms constitute a legally binding agreement between you and Cravr LLC, a Wyoming limited liability company ("Company"). If you do not agree, you have no right to use the Service.

1.3 Electronic Acceptance: Clicking "I Agree," checking the age-confirmation box, creating an account, or continuing to use the Service after any update to these Terms constitutes your full legal acceptance. You waive any defense that an electronic agreement is unenforceable.

1.4 Capacity: You represent that you have the legal capacity to enter contracts in your jurisdiction, are at least 18 years old, and are not prohibited by any law from using the Service.

1.5 We reserve the right to modify these Terms at any time. Continued use after posting changes constitutes acceptance. Material changes will be communicated via email or platform notice with at least 14 days' advance notice.

---

## 2. ELIGIBILITY & AGE RESTRICTION

2.1 **Minimum Age:** You MUST be at least 18 years of age to use this Service. No exceptions.

2.2 You represent and warrant under penalty of perjury that:
- You are 18 years of age or older
- You are legally permitted to access adult content in your jurisdiction
- You are not accessing this Service from a jurisdiction where adult content is prohibited

2.3 **Minors:** If CRAVR discovers or has reason to believe any user is under 18, we will immediately terminate their account, report the matter to relevant authorities, and preserve all relevant evidence for law enforcement. Attempts to circumvent age verification may constitute criminal fraud.

2.4 You acknowledge that CRAVR employs technical, procedural, and contractual measures to prevent minor access, and that your affirmative representation of age is the foundational layer of this system. Providing false age information is a material breach of these Terms.

---

## 3. DESCRIPTION OF SERVICE & NO GUARANTEE

3.1 CRAVR is a premium hybrid adult dating and live interaction platform providing:
- Live streaming rooms and interactive broadcasts
- Creator profiles with optional locked/premium content
- Virtual gift and tipping systems
- Credit-based messaging and interaction
- VIP Lounge exclusive sessions
- Profile boost and visibility features
- Membership subscription plans

3.2 **THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE."** CRAVR MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.

3.3 We do not guarantee uninterrupted service, error-free operation, or that the Service will meet your expectations. Scheduled and unscheduled downtime may occur without notice or compensation.

3.4 **Creator Content:** Creators are independent contractors. CRAVR does not endorse, validate, or guarantee the accuracy, quality, or appropriateness of creator content beyond our moderation standards.

---

## 4. CREDITS, VIRTUAL CURRENCY & PURCHASES

4.1 Credits are a virtual currency with no cash value, not exchangeable for real currency, and non-transferable between accounts. Credits are a limited license to access features on the Platform.

4.2 All credit and subscription purchases are **FINAL AND NON-REFUNDABLE**, except:
- Where required by applicable consumer protection law
- At CRAVR's sole discretion in cases of demonstrable technical error
- As described in our Refund Policy

4.3 Credits do not expire while your account remains in good standing. Upon account termination for cause, all unused credits are forfeited without compensation.

4.4 Pricing is in USD and subject to change with 7 days' notice for subscriptions. We reserve the right to modify credit-to-dollar ratios at any time.

4.5 **Chargebacks & Disputes:** We encourage you to contact us first at support@cravr.fun before initiating any payment dispute. Initiating a chargeback without first exhausting CRAVR's internal dispute resolution process constitutes a breach of these Terms. In such cases:
- Your account will be immediately suspended pending investigation
- You will be liable for the disputed amount plus an administrative processing fee
- CRAVR reserves the right to pursue collection through any lawful means
- Accounts with fraudulent chargebacks may be permanently banned

4.6 **Bonus Credits:** Bonus credits issued through membership plans, promotions, or referrals are revocable at CRAVR's discretion and are the last credits spent from your balance.

4.7 **Membership Subscriptions:** Auto-renew unless cancelled at least 48 hours before the renewal date. Cancellation takes effect at the end of the current billing period. See our Refund Policy for additional details.

---

## 5. USER CONDUCT, PROHIBITED ACTIVITIES & FOSTA-SESTA COMPLIANCE

5.1 You agree NOT to, and represent that you will not:
- Access or use the Service if under 18 years of age
- Harass, stalk, threaten, intimidate, or harm any user, creator, or CRAVR employee
- Attempt to arrange in-person meetings with creators through the platform
- Screenshot, record, download, copy, or distribute any content from the platform without explicit written permission
- Use bots, scripts, crawlers, scrapers, or automated tools to interact with the platform
- Reverse engineer, decompile, or attempt to extract source code from the platform
- Impersonate any person, entity, or CRAVR staff member
- Create multiple accounts to evade suspension or restrictions
- Use VPN, proxy, or other tools to circumvent geo-restrictions or age verification
- Upload, transmit, or share malware, viruses, or harmful code
- Engage in any activity that interferes with platform operations or other users' enjoyment
- Attempt to manipulate credit systems, exploit bugs, or conduct fraud

5.2 **FOSTA-SESTA Prohibition:** In compliance with the Allow States and Victims to Fight Online Sex Trafficking Act (FOSTA-SESTA), 18 U.S.C. § 2421A, you are STRICTLY PROHIBITED from using CRAVR for:
- Advertising, facilitating, or promoting prostitution or sex trafficking of any kind
- Soliciting or arranging real-world sexual services through any platform feature
- Posting content that promotes, enables, or benefits from sex trafficking
- Using the platform to coerce, defraud, or traffic any individual

Any violation of this section will result in immediate permanent termination, preservation of evidence, and mandatory reporting to the National Center for Missing & Exploited Children (NCMEC) and relevant law enforcement. CRAVR takes a zero-tolerance stance on trafficking and will cooperate fully with law enforcement investigations.

5.3 **Enforcement:** Violations may result in: content removal, account suspension, permanent ban, forfeiture of credits without refund, and/or referral to law enforcement. CRAVR is the sole arbiter of violations and its decisions are final, subject to the appeal process in our Code of Conduct.

---

## 6. CONTENT, INTELLECTUAL PROPERTY & LICENSE

6.1 All platform content not owned by creators (UI, branding, algorithms, software) is the exclusive property of Cravr LLC and protected by copyright, trademark, and trade secret law.

6.2 **Creator Content:** Creators retain copyright in their original content. Purchasing or unlocking access to content grants you a personal, non-exclusive, non-transferable, revocable license to view that content within the Platform only.

6.3 **Prohibited Content Actions:** You may not download, export, record, screenshot, or reproduce any platform content. Violation constitutes copyright infringement and may expose you to civil liability of up to $150,000 per work under 17 U.S.C. § 504, plus attorney's fees.

6.4 **DMCA:** If you believe content infringes your copyright, see our DMCA Policy or send a compliant notice to: legal@cravr.fun. Repeat infringers' accounts will be terminated.

6.5 **User Content License:** By submitting any content (messages, profile information, reviews), you grant CRAVR a perpetual, irrevocable, royalty-free, worldwide license to use, store, display, and moderate that content for platform operations.

---

## 7. PRIVACY & DATA

Your use of the Service is governed by our Privacy Policy and Cookie Policy, incorporated herein by reference. You consent to our data practices including:
- Collection of account, usage, and device data
- Payment processing through secure payment processors
- Use of cookies and tracking technologies as described in our Cookie Policy
- Storage and processing of data in the United States

**Billing Discretion:** All charges appear as "CRAVR" or similar neutral descriptor on your bank statement. We never use explicit descriptors in billing.

---

## 8. LIMITATION OF LIABILITY & INDEMNIFICATION

8.1 TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, CRAVR SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOST DATA, OR LOST BUSINESS OPPORTUNITY, EVEN IF CRAVR HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

8.2 CRAVR's total aggregate liability for any claim arising from or related to the Service is limited to the greater of (a) the total amount you paid to CRAVR in the 12 months preceding the claim, or (b) $100 USD.

8.3 **Indemnification:** You agree to indemnify, defend, and hold harmless Cravr LLC and its officers, directors, employees, and agents from any claims, liabilities, damages, costs, and expenses (including reasonable attorney's fees) arising out of your use of the Service, your violation of these Terms, or your violation of any third-party rights.

---

## 9. TERMINATION

9.1 CRAVR may terminate or suspend your account at any time, with or without cause, with or without notice. Upon termination, your right to use the Service immediately ceases. All unused credits are forfeited.

9.2 You may terminate your account at any time by contacting support@cravr.fun. Termination does not entitle you to a refund of any unused credits or prepaid subscription fees, except as required by applicable law.

---

## 10. GOVERNING LAW

These Terms are governed by the laws of the State of Wyoming, without regard to its conflict of law principles. Subject to Section 11 (Mandatory Arbitration), you consent to the exclusive jurisdiction of the state and federal courts located in Sheridan County, Wyoming for any claims not subject to arbitration.

---

## 11. MANDATORY ARBITRATION, WAIVER OF JURY TRIAL & CLASS ACTION WAIVER

**PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS.**

11.1 **Mandatory Arbitration:** Any dispute, claim, or controversy arising out of or relating to these Terms, your use of the Service, or any purchase made on the Platform ("Dispute") shall be resolved exclusively by binding individual arbitration administered by the American Arbitration Association ("AAA") under its Consumer Arbitration Rules, except for claims that qualify for small claims court. You waive the right to a jury trial and to participate in any class action, collective action, or representative proceeding.

11.2 **Class Action Waiver:** ALL DISPUTES MUST BE BROUGHT IN YOUR INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS ACTION, COLLECTIVE ACTION, MASS ACTION, OR REPRESENTATIVE PROCEEDING. The arbitrator may not consolidate more than one person's claims. If a court finds that the class action waiver is unenforceable, the remainder of this arbitration agreement shall remain in force.

11.3 **Small Claims Exception:** Either party may bring an individual action in small claims court for disputes that qualify. Either party may also seek emergency injunctive relief from a court of competent jurisdiction to prevent irreparable harm pending arbitration.

11.4 **Arbitration Procedure:**
- You must send a written Notice of Dispute to legal@cravr.fun before initiating arbitration, describing your claim and desired relief
- We have 30 days to resolve the claim informally
- If not resolved, either party may initiate arbitration with AAA (adr.org)
- Arbitration shall take place in Sheridan, Wyoming or via videoconference at your election
- For claims under $75,000, CRAVR will pay all AAA filing fees and arbitrator costs

11.5 **Governing Law for Arbitration:** The Federal Arbitration Act (9 U.S.C. § 1 et seq.) governs the interpretation and enforcement of this arbitration agreement.

11.6 **30-Day Opt-Out Right:** You may opt out of this arbitration agreement by sending written notice to legal@cravr.fun within 30 days of first accepting these Terms. Your notice must include your name, email address, and a clear statement that you wish to opt out of arbitration. Opting out does not affect any other provision of these Terms.

11.7 **Severability:** If any part of this Section 11 is found invalid or unenforceable, the remainder shall continue in full force and effect, except that if the class action waiver is found unenforceable, the entire arbitration agreement is void.

---

## 12. MISCELLANEOUS

12.1 **Entire Agreement:** These Terms, together with the Privacy Policy, Cookie Policy, Code of Conduct, and any applicable Creator Agreement, constitute the entire agreement between you and CRAVR.

12.2 **Severability:** If any provision is found unenforceable, the remaining provisions shall remain in full force.

12.3 **Waiver:** Failure to enforce any provision shall not constitute a waiver of future enforcement.

12.4 **Assignment:** You may not assign your rights under these Terms without CRAVR's written consent. CRAVR may assign these Terms in connection with a merger, acquisition, or sale of assets.

12.5 **Contact:** For legal notices, contact legal@cravr.fun or Cravr LLC, 30 N Gould St Ste N, Sheridan, WY 82801, USA.

---

© 2026 Cravr LLC All rights reserved.
    `,
  },

  privacy: {
    title: "Privacy Policy",
    content: `
# Cravr LLC PRIVACY POLICY

**Version:** 2.0
**Effective Date:** May 27, 2026
**Last Updated:** May 27, 2026

---

## PRIVACY NOTICE

Cravr LLC ("we," "us," "our," or "Company") respects your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and platform (the "Service"). This Policy also describes your rights under the CCPA (California), GDPR (EU/EEA/UK), and other applicable laws.

---

## 1. INFORMATION WE COLLECT

### 1.1 Information You Provide Directly

- **Account Registration:** Name, email address, date of birth, username, password
- **Age Verification:** Government-issued ID, selfie, and verification data
- **Payment Information:** Credit card details (processed through secure payment processors — we do not store full card numbers)
- **Profile Information:** Bio, photos, interests, location, preferences
- **Communications:** Messages, support tickets, feedback, reports
- **Content:** Live streams, photos, videos, text, and other user-generated content

### 1.2 Information Collected Automatically

- **Device Information:** IP address, device type, operating system, browser type and version
- **Usage Data:** Pages visited, time spent, features used, interactions, session data
- **Cookies & Tracking:** See our Cookie Policy for full details
- **Location Data:** Approximate location based on IP address (not GPS unless explicitly consented)

### 1.3 Information from Third Parties

- **Payment Processors:** Transaction data, fraud detection information
- **Age Verification Services:** Verification results and associated data
- **Law Enforcement:** Information requests for legal compliance

---

## 2. HOW WE USE YOUR INFORMATION

We use collected information to:
- Provide, maintain, and improve the Service
- Process payments and subscriptions
- Verify age and identity
- Communicate with you about your account
- Enforce our Terms of Service and other agreements
- Detect, prevent, and address fraud and security issues
- Comply with legal obligations (including FOSTA-SESTA, § 2257, DMCA)
- Conduct analytics and research
- Personalize your experience
- Send marketing communications (with your consent, where required)

**Legal Bases for Processing (GDPR):** See Section 11 for the legal bases we rely on for processing your personal data.

---

## 3. DATA SECURITY

We implement industry-standard security measures including:
- **AES-256 Encryption** for sensitive data at rest
- **TLS 1.3** for data in transit
- **PCI DSS Level 1 Compliance** for payment processing
- **Regular Security Audits** and penetration testing
- **Access Controls** limiting employee access to sensitive data
- **Two-Factor Authentication** available for all accounts

However, no security system is impenetrable. We cannot guarantee absolute security. In the event of a data breach affecting your personal data, we will notify you as required by applicable law.

---

## 4. DATA RETENTION

- **Account Data:** Retained for the duration of your account plus 1 year after termination
- **Payment Records:** Retained for 7 years (tax/legal requirements)
- **Age Verification Data:** Retained for 5 years or as required by 18 U.S.C. § 2257 and applicable law
- **Deleted Content:** Permanently deleted within 30 days (except where legally required to retain)
- **Communications/Support Records:** Retained for 3 years

---

## 5. SHARING YOUR INFORMATION

We do **NOT** sell your personal information to third parties. We may share information with:
- **Service Providers:** Payment processors, hosting providers, analytics services, age verification partners
- **Law Enforcement:** When legally required, pursuant to valid legal process, or to prevent illegal activity
- **Legal Proceedings:** When required by court order or subpoena
- **Business Transfers:** In case of merger, acquisition, or asset sale (you will be notified)
- **Safety:** To protect the rights, property, or safety of CRAVR, our users, or the public

---

## 6. YOUR RIGHTS & CHOICES

### 6.1 Access & Portability
You have the right to request a copy of your personal data in a portable, machine-readable format. Submit requests to legal@cravr.fun.

### 6.2 Correction
You may request correction of inaccurate or incomplete personal data.

### 6.3 Deletion ("Right to Be Forgotten")
You may request deletion of your account and associated personal data. We will comply unless retention is required by law (e.g., payment records, age verification data, law enforcement holds).

### 6.4 Marketing Opt-Out
You may opt out of marketing communications at any time by clicking "unsubscribe" in any email or contacting legal@cravr.fun. You cannot opt out of essential service communications.

### 6.5 Cookie Preferences
You can manage your cookie preferences through our cookie consent banner or your browser settings. See our Cookie Policy for details.

---

## 7. CHILDREN'S PRIVACY

CRAVR is not intended for users under 18 years of age. We do not knowingly collect information from minors. If we discover a minor has provided information, we will immediately delete it and report the matter to NCMEC and relevant authorities.

---

## 8. INTERNATIONAL DATA TRANSFERS

Your information may be transferred to, stored in, and processed in the United States or other countries where our service providers operate. By using the Service, you consent to such transfers.

For transfers from the EU/EEA/UK, we use appropriate safeguards including Standard Contractual Clauses (SCCs) approved by the European Commission or UK equivalent. Contact legal@cravr.fun for a copy of the applicable SCCs.

---

## 9. CONTACT US

For privacy inquiries:

**CRAVR Privacy Team**
Email: legal@cravr.fun
GDPR inquiries: legal@cravr.fun
Address: 30 N Gould St Ste N, Sheridan, WY 82801, USA

---

## 10. CALIFORNIA PRIVACY RIGHTS (CCPA / CPRA)

This section applies to California residents. Under the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA), you have the following rights:

### 10.1 Right to Know
You have the right to request disclosure of:
- The categories and specific pieces of personal information we have collected about you
- The categories of sources from which we collected your personal information
- The business or commercial purpose for collecting your personal information
- The categories of third parties with whom we share your personal information

### 10.2 Right to Delete
You have the right to request deletion of the personal information we have collected from you, subject to certain exceptions (e.g., legal obligations, security, or completing transactions).

### 10.3 Right to Correct
You have the right to request correction of inaccurate personal information we hold about you.

### 10.4 Right to Opt-Out of Sale / Sharing
We do **not** sell personal information as defined by the CCPA. We do not share personal information with third parties for cross-context behavioral advertising. You may submit a "Do Not Sell or Share My Personal Information" request to legal@cravr.fun, though such a request is not currently applicable given our current practices.

### 10.5 Right to Limit Use of Sensitive Personal Information
We use sensitive personal information (such as age verification data) only as necessary to provide the Service. You have the right to request that we limit the use and disclosure of such information to what is necessary to perform the services you requested.

### 10.6 Right to Non-Discrimination
We will not discriminate against you for exercising any of your CCPA rights. We will not deny you services, charge different prices, or provide a different level of service because you exercised your privacy rights.

### 10.7 Shine the Light (California Civil Code § 1798.83)
California residents who provide personal information in obtaining products or services for personal, family, or household use are entitled to request information about our sharing of their personal information with third parties for the other parties' direct marketing purposes. To make such a request, contact legal@cravr.fun.

### 10.8 How to Submit a Request
Submit CCPA requests to:
- **Email:** legal@cravr.fun (Subject: "CCPA Request")
- **Mail:** Cravr LLC, Attn: Privacy — CCPA, 30 N Gould St Ste N, Sheridan, WY 82801

We will respond to verifiable requests within 45 days (extendable by an additional 45 days with notice). We will verify your identity before processing requests.

### 10.9 Categories of Personal Information Collected

| Category | Collected | Sold | Shared |
|---|---|---|---|
| Identifiers (name, email, IP) | Yes | No | No |
| Commercial information (transactions) | Yes | No | No |
| Internet activity data | Yes | No | No |
| Geolocation data (approximate) | Yes | No | No |
| Sensitive information (age verification, payment) | Yes | No | No |

---

## 11. EUROPEAN ECONOMIC AREA, UK & SWITZERLAND RIGHTS (GDPR / UK GDPR)

This section applies to individuals in the European Economic Area (EEA), United Kingdom, and Switzerland.

### 11.1 Data Controller
Cravr LLC is the data controller for personal information processed through the Service. Our EU/UK contact: legal@cravr.fun.

### 11.2 Legal Bases for Processing

We process your personal data on the following legal bases:
- **Contract Performance (Art. 6(1)(b) GDPR):** Processing necessary to provide the Service, process payments, and manage your account
- **Legal Obligation (Art. 6(1)(c) GDPR):** Processing required by law, including age verification, 18 U.S.C. § 2257 compliance, and responding to law enforcement
- **Legitimate Interests (Art. 6(1)(f) GDPR):** Fraud prevention, security, improving our services, and direct marketing to existing customers
- **Consent (Art. 6(1)(a) GDPR):** Marketing communications, non-essential cookies, and other processing for which we seek your consent

### 11.3 Your Rights Under GDPR

You have the following rights regarding your personal data:
- **Right of Access (Art. 15):** Request a copy of your personal data
- **Right to Rectification (Art. 16):** Request correction of inaccurate data
- **Right to Erasure (Art. 17):** Request deletion of your data ("right to be forgotten")
- **Right to Restriction of Processing (Art. 18):** Request that we restrict processing of your data
- **Right to Data Portability (Art. 20):** Receive your data in a structured, commonly used format
- **Right to Object (Art. 21):** Object to processing based on legitimate interests or for direct marketing
- **Rights Related to Automated Decision-Making (Art. 22):** Not be subject to solely automated decisions that significantly affect you

### 11.4 How to Exercise Your Rights
Submit requests to legal@cravr.fun. We will respond within 30 days (extendable by 2 additional months with notice). There is no charge for exercising your rights, unless requests are manifestly unfounded or excessive.

### 11.5 Data Transfers Outside the EEA/UK
When we transfer your personal data outside the EEA or UK, we use Standard Contractual Clauses (SCCs) or other appropriate safeguards. Contact legal@cravr.fun for a copy.

### 11.6 Right to Lodge a Complaint
You have the right to lodge a complaint with your local data protection authority. A list of EU supervisory authorities is available at edpb.europa.eu. For UK residents: ico.org.uk.

### 11.7 Retention Periods
Personal data is retained only for as long as necessary for the purposes set out in this Policy, or as required by law. See Section 4 for specific retention periods.

---

© 2026 Cravr LLC All rights reserved.
    `,
  },

  creator: {
    title: "Creator Agreement & NDA",
    content: `
# Cravr LLC CREATOR AGREEMENT & NDA

**Version:** 3.0
**Effective Date:** May 27, 2026
**Last Updated:** May 27, 2026

---

## LEGALLY BINDING AGREEMENT — READ EVERY SECTION

This Creator Agreement and Non-Disclosure Agreement ("Agreement") is a legally binding contract between you ("Creator," "you") and Cravr LLC, a Wyoming limited liability company ("Company," "CRAVR," "we"). By registering as a Creator, uploading content, going live, or receiving any payment through the platform, you fully accept all terms below. This Agreement supersedes all prior understandings. If you do not agree, do not register as a Creator.

---

## PART I — CREATOR SERVICES AGREEMENT

---

## 1. CREATOR STATUS — INDEPENDENT CONTRACTOR

1.1 You are an independent contractor, not an employee, agent, joint venture partner, or franchisee of Cravr LLC This Agreement does not create any employment relationship.

1.2 As an independent contractor, you:
- Are solely responsible for your own federal, state, local, and international taxes
- Are not entitled to any employee benefits
- Control your own schedule, content, and creative decisions within platform guidelines
- Must provide your own equipment, software, and internet connection
- May engage in other business activities unless prohibited by a separately signed exclusivity agreement

1.3 **Tax Reporting:** CRAVR will issue Form 1099-NEC to US-based Creators earning $600 or more in a calendar year. Non-US creators must complete IRS Form W-8BEN or W-8BEN-E.

1.4 You agree to indemnify and hold CRAVR harmless from any tax liability, penalty, or fine arising from your failure to report or pay taxes on earnings.

---

## 2. REVENUE SHARE, PAYMENTS & PROCESSING FEE DISCLAIMER

2.1 **Revenue Tiers:** Your creator revenue share is determined by your verified monthly gross platform earnings:

**🎉 Grace Period (First 90 Days):** All new creators automatically earn at **80%** for their first 90 days, regardless of monthly earnings. No application required — applied automatically from your creator activation date.

| Tier | Monthly Gross (post-Grace) | Creator | Platform |
|---|---|---|---|
| **Growth** | $0 – $5,000 | **80%** | 20% |
| **Established** | $5,001 – $15,000 | **80%** | 20% |
| **Elite** | $15,001 – $25,000 | **83%** | 17% |
| **Partner** | $25,001 – $75,000 | **85%** | 15% |
| **Senior Partner** | $75,001 – $150,000 | **87%** | 13% |
| **Executive Partner** | $150,001 – $300,000 | **88%** | 12% |
| **Premier Partner** | $300,001 – $500,000 | **89%** | 11% |
| **Top Partner** | $500,001 – $1,000,000 | **90%** | 10% |
| **Pinnacle** | $1,000,001+ | **90%** *(cap)* | 10% |

### IMPORTANT PROCESSING FEE DISCLAIMER

All revenue share percentages above are calculated on GROSS transaction revenue BEFORE the deduction of third-party vendor payment processing fees. Payment processors charge approximately 3%–5% per transaction. These processing fees are deducted from gross revenue PRIOR to calculating creator payouts.

**EXAMPLE:** On a $100 transaction — Processing fee (~4%) = $4.00. Net after processing = $96.00. Creator at 80% tier receives: $96.00 × 80% = $76.80. Platform keeps: $96.00 × 20% = $19.20.

2.2 **Additional Deductions:**
- Chargeback amounts and associated fees
- Refunds issued at platform discretion
- Any required tax withholding

2.3 **Payment Schedule:** Payouts are processed every Friday for the prior week's cleared earnings. Minimum payout threshold: $50.00 USD.

2.4 **Payment Methods:** Bank ACH transfer (US), international wire transfer ($25 wire fee), or check.

2.5 **Processing Time:** Funds typically clear in 3–7 business days. International transfers may take 5–10 business days.

2.6 **Chargebacks & Reversals:** If a user initiates a chargeback, the full creator payout portion will be reversed from your next payout. Additionally, a $25 chargeback administration fee will be deducted.

2.7 CRAVR reserves the right to adjust revenue tier thresholds and percentages upon 30 days' written notice.

2.8 Earnings estimates are informational only and do not constitute guarantees of income.

2.9 **Creator Referral Tier Boost Program (One-Time Reward):**

Creators may earn a permanent, one-time revenue share tier boost by meeting both of the following thresholds using their unique Creator/Streamer Code:
- **Referral count:** 25 qualifying individuals (subscribers or new creators) who register via your code and remain active for 30+ consecutive days.
- **Collective earnings:** Those 25 referrals collectively earn **$10,000/month** on-platform within a rolling 30-day window.

Upon meeting both thresholds, your revenue share rate is boosted by one percentage bracket (e.g., 80% → 83%, 85% → 87%, etc.) permanently and automatically.

**Conditions:**
- One-time reward per creator account. Non-repeatable and non-transferable.
- Referral activity is measured on a rolling 12-month window.
- Your unique referral code is available in your Creator Dashboard under the "Referral" tab.
- CRAVR reserves the right to verify referral authenticity and disqualify fraudulent activity.

---

## 3. CONTENT OWNERSHIP, LICENSE & IP RIGHTS

3.1 You retain copyright ownership of all original content you create ("Creator Content"), subject to the license granted herein.

3.2 **Platform License:** By uploading or streaming any Creator Content, you grant CRAVR an irrevocable, non-exclusive, royalty-free, sublicensable, worldwide license to:
- Host, store, transcode, and serve Creator Content
- Create thumbnails, previews, and promotional snippets (not exceeding 10 seconds)
- Use your username and persona for platform marketing with prior consent
- Cache and distribute Content via CDN

3.3 **License Duration:** This license remains in effect as long as Content is hosted. Upon deletion, the license terminates within 30 days, EXCEPT for Content already unlocked by paying users.

3.4 **Creator Warranties:** You represent and warrant that:
- You are the sole author and/or lawful rights holder of all Creator Content
- Creator Content does not infringe any third-party rights
- You have obtained all necessary releases and consents from all individuals depicted
- All individuals depicted are verifiably 18 years of age or older
- You have maintained all records required by 18 U.S.C. § 2257

---

## 4. AGE VERIFICATION, § 2257 RECORD-KEEPING & CUSTODIAN OF RECORDS

4.1 Compliance with 18 U.S.C. § 2257 is MANDATORY for all Creators producing sexually explicit content.

4.2 You must maintain records verifying the age (18+) of every individual depicted in sexually explicit content, including yourself. Required documentation:
- Government-issued photo ID showing legal name and date of birth
- One additional form of identification if the primary ID does not include a photo
- A signed model release form from each depicted individual

4.3 You must maintain these records for a minimum of 5 years and make them available upon lawful demand from law enforcement or CRAVR compliance officers.

4.4 Failure to maintain or produce 2257 records upon demand will result in immediate content removal and account suspension pending investigation.

4.5 **Custodian of Records:** Cravr LLC maintains a Custodian of Records for platform-level § 2257 compliance. Inspection requests and legal inquiries should be directed to:

**Custodian of Records — 18 U.S.C. § 2257**
Chief Compliance Officer, Cravr LLC
30 N Gould St Ste N
Sheridan, WY 82801, USA
Email: legal@cravr.fun

Inspection of records is available during normal business hours (9 AM–5 PM ET, Monday–Friday) upon reasonable advance notice and presentation of appropriate credentials.

---

## 5. FOSTA-SESTA COMPLIANCE (MANDATORY)

5.1 In compliance with FOSTA-SESTA (18 U.S.C. § 2421A), you are strictly prohibited from using CRAVR to:
- Advertise, facilitate, recruit for, or otherwise promote prostitution or sex trafficking
- Solicit, arrange, or coordinate real-world sexual services through any platform feature, including private messages, live streams, or profile content
- Post content that promotes, benefits, or is otherwise connected to sex trafficking activities
- Use the platform to coerce, defraud, threaten, or control any individual for the purpose of commercial sex

5.2 **Permitted vs. Prohibited Distinction:**
- **PERMITTED:** Consensual adult fantasy content, roleplay, and expression between verified adults on-platform
- **PROHIBITED:** Any direct or indirect coordination of physical, real-world sexual services for compensation

5.3 Violation of this section will result in:
- Immediate permanent account termination
- Forfeiture of all earned and pending balances
- Preservation of all platform evidence
- Mandatory reporting to the National Center for Missing & Exploited Children (NCMEC) and relevant law enforcement agencies
- Civil and/or criminal liability

5.4 You agree to immediately report to legal@cravr.fun any user you believe is attempting to use the platform for trafficking or solicitation purposes.

---

## 6. CONTENT STANDARDS & PROHIBITED CONTENT

**PERMITTED:**
- Consensual adult content between verified adults
- Adult nudity (in appropriate locked/premium sections)
- Adult roleplay between consenting adults
- Explicit language in appropriate contexts

**NEVER PERMITTED:**
- Any sexual content involving minors (CSAM) — reported to NCMEC immediately
- Non-consensual content of any kind
- Content depicting real violence, harm, or abuse
- Bestiality or content involving animals
- Content that promotes or facilitates trafficking (see Section 5)

---

## 7. TERMINATION & EARNINGS ON TERMINATION

7.1 CRAVR may terminate this Agreement and suspend your account at any time for:
- Violation of this Agreement or Terms of Service
- Violation of applicable laws (including FOSTA-SESTA, § 2257, CSAM laws)
- Failure to maintain 2257 compliance
- Involvement in fraud, trafficking, or illegal activity
- Repeated Code of Conduct violations

7.2 **Termination for Cause:** Upon termination for cause (as listed in 7.1), all unpaid earnings are forfeited and your content may be removed from the platform. CRAVR will retain evidence as required by law.

7.3 **Termination Without Cause:** If CRAVR terminates this Agreement without cause (at CRAVR's discretion, without any violation by you):
- All earnings that have **cleared** the standard chargeback period (90 days from transaction date) will be paid out in the next regular weekly payout cycle
- Earnings that have **not yet cleared** (within the 90-day chargeback window) remain subject to review and will be paid out on their respective clearing dates
- Disputed or chargeback-affected amounts remain subject to the chargeback policy in Section 2.6

7.4 **Voluntary Termination:** If you terminate this Agreement voluntarily:
- Cleared earnings will be paid in the next regular payout cycle
- You must provide 7 days' written notice to creators@cravr.fun
- Content will be removed within 30 days of termination date

---

## PART II — NON-DISCLOSURE AGREEMENT

---

## 8. CONFIDENTIAL INFORMATION

8.1 You acknowledge that during your use of the platform, you may access confidential information including:
- Platform algorithms and technical infrastructure
- Creator earnings data and payment processing details
- Other creators' personal information
- CRAVR's business strategies and financial information
- Unreleased product features and roadmaps

8.2 You agree to maintain the confidentiality of all such information and not disclose it to any third party without CRAVR's written consent.

8.3 **NDA Survival:** This confidentiality obligation survives termination of this Agreement for a period of **two (2) years** following the effective date of termination. After two years, information that has become publicly available through no breach of this Agreement is no longer subject to confidentiality obligations.

8.4 Exceptions: Confidentiality obligations do not apply to information that (a) is or becomes publicly available without breach of this Agreement, (b) was known to you prior to disclosure, (c) is independently developed by you without use of Confidential Information, or (d) must be disclosed by law or court order (with prompt written notice to CRAVR).

---

## 9. GOVERNING LAW

This Agreement is governed by the laws of the State of Wyoming, without regard to its conflict of law principles. Disputes are subject to the mandatory arbitration clause in the Terms of Service, incorporated herein by reference.

---

© 2026 Cravr LLC All rights reserved.
    `,
  },

  conduct: {
    title: "Code of Conduct",
    content: `
# Cravr LLC CODE OF CONDUCT

**Version:** 2.0
**Effective Date:** May 27, 2026
**Last Updated:** May 27, 2026

---

## PURPOSE

This Code of Conduct establishes community standards for all CRAVR users and creators. Our goal is to maintain a safe, respectful, and legal platform for all participants.

---

## 1. CORE PRINCIPLES

All users and creators agree to:
- Treat all community members with respect and dignity
- Comply with all applicable laws and platform policies
- Maintain the safety and security of the platform
- Respect the intellectual property and privacy of others
- Report violations promptly

---

## 2. PROHIBITED BEHAVIOR

### 2.1 Harassment & Abuse
- Do not harass, stalk, threaten, intimidate, or abuse any user, creator, or CRAVR employee
- Do not engage in cyberbullying, doxxing, or coordinated harassment campaigns
- Do not send unsolicited explicit content or unwanted sexual advances
- Do not impersonate others or create fake accounts to harass

### 2.2 Illegal Activity & FOSTA-SESTA
- Do not use the platform to facilitate prostitution, trafficking, or solicitation of real-world sexual services
- Do not engage in fraud, scams, or financial crimes
- Do not distribute illegal drugs or controlled substances
- Do not facilitate or promote any illegal activity
- Any suspected trafficking activity must be reported to support@cravr.fun immediately

### 2.3 Exploitation & Abuse
- Do not create, share, or request content involving minors
- Do not share non-consensual intimate images ("revenge porn")
- Do not coerce, manipulate, or exploit any user or creator
- Do not engage in financial exploitation or extortion

### 2.4 Platform Abuse
- Do not use bots, scripts, or automated tools to manipulate the platform
- Do not attempt to circumvent security measures or age verification
- Do not spam, flood, or disrupt platform operations
- Do not attempt to reverse engineer or hack the platform

### 2.5 Privacy & Doxxing
- Do not share anyone's personal information without their consent
- Do not attempt to "doxx" anyone on or off-platform
- Do not share screenshots or recordings outside the platform without consent
- Creators' real identities are protected — do not attempt to identify them

### 2.6 Content Standards
- Do not upload content involving minors in any sexual context
- Do not share non-consensual content
- Do not upload content depicting real violence or abuse
- Do not share content involving animals or bestiality

---

## 3. REPORTING & ENFORCEMENT

### 3.1 How to Report
- Use the in-platform "Report" button on any profile, chat, or stream
- Email: support@cravr.fun
- For emergencies involving minors or trafficking: legal@cravr.fun (escalated to authorities within 1 hour)

All reports are treated confidentially. We review every report within 24 hours.

### 3.2 Enforcement Tiers

**WARNING:** Minor first-time violations (inappropriate language, spam)

**TEMPORARY SUSPENSION (7-30 days):** Repeated violations or moderate offenses

**PERMANENT BAN:** Severe violations, illegal content, or repeated offenses

**LEGAL ACTION:** Cases involving minors, trafficking, fraud, or criminal activity

---

## 4. CREATOR RESPONSIBILITIES

Creators agree to:
- Maintain all required age verification and 2257 documentation
- Ensure all individuals depicted in content are 18+ and have consented
- Not engage in coercion, manipulation, or exploitation of viewers
- Comply with all content standards and platform policies
- Not share viewer personal information without consent
- Maintain professional conduct in all interactions

---

## 5. VIEWER RESPONSIBILITIES

Viewers agree to:
- Not attempt to arrange in-person meetings with creators through the platform
- Not screenshot, record, or distribute creator content without permission
- Not harass, threaten, or abuse creators
- Not attempt to obtain creator personal information
- Not engage in fraud or financial manipulation
- Respect creator boundaries and consent

---

## 6. ZERO TOLERANCE FOR CSAM

CRAVR maintains a **ZERO TOLERANCE POLICY** for child sexual abuse material (CSAM). Any content, communication, or activity involving minors in a sexual context will result in:
- Immediate account termination
- Permanent ban from the platform
- Preservation of all evidence
- Immediate report to the National Center for Missing & Exploited Children (NCMEC) via CyberTipline
- Referral to law enforcement (including FBI Crimes Against Children)

---

## 7. MODIFICATIONS & UPDATES

CRAVR reserves the right to modify this Code of Conduct at any time. Material changes will be communicated via email or platform notice. Continued use of the platform constitutes acceptance of any updates.

---

## 8. CONTENT MODERATION APPEAL PROCESS

If you believe a moderation action (content removal, account suspension, or permanent ban) was taken in error, you have the right to appeal.

### 8.1 Eligibility
Appeals are available for:
- Content removal decisions
- Account suspensions (temporary or permanent)
- Feature restrictions
- Creator account terminations

Appeals are **not** available for:
- Actions taken due to CSAM or child exploitation (zero-tolerance, no appeal)
- Actions taken pursuant to valid law enforcement orders
- Accounts terminated for confirmed FOSTA-SESTA violations

### 8.2 How to Submit an Appeal

**Step 1 — Submit within 30 days:**
Email support@cravr.fun with the subject line: "Moderation Appeal — [Your Username]"

**Include in your appeal:**
- Your username and account email
- The specific action being appealed (include any notification or reference number)
- The date the action was taken
- A clear explanation of why you believe the action was incorrect
- Any supporting evidence (screenshots, context, etc.)

**Step 2 — Acknowledgment:**
You will receive an acknowledgment within 48 hours confirming receipt and your reference number.

**Step 3 — Review:**
A member of our Trust & Safety team (different from the original reviewer) will conduct an independent review. Review timelines:
- Content removal appeals: up to 5 business days
- Account suspension appeals: up to 7 business days
- Permanent ban appeals: up to 14 business days

**Step 4 — Decision:**
You will receive a written decision via email with:
- The outcome (upheld, overturned, or modified)
- A brief explanation of the reasoning
- Any additional actions taken

### 8.3 Possible Outcomes
- **Upheld:** The original moderation decision stands. No further changes.
- **Overturned:** The action is reversed. Content restored or account reinstated.
- **Modified:** A lesser sanction replaces the original (e.g., warning instead of suspension).

### 8.4 Final Decision
Appeal decisions are final. If you believe your legal rights have been violated (e.g., DMCA counter-notification, civil rights), you may pursue remedies through applicable legal channels.

### 8.5 DMCA Counter-Notification
If content was removed pursuant to a DMCA takedown notice and you believe it was removed in error, you may file a counter-notification at legal@cravr.fun. See our DMCA Policy for the required elements of a valid counter-notification.

---

## CONTACT & SUPPORT

**CRAVR Community Team**
Email: support@cravr.fun
Safety & Reports: support@cravr.fun
Appeals: support@cravr.fun
Address: 30 N Gould St Ste N, Sheridan, WY 82801, USA

---

© 2026 Cravr LLC All rights reserved.
    `,
  },

  dmca: {
    title: "DMCA Policy",
    content: `
# Cravr LLC DMCA POLICY & COPYRIGHT NOTICE

**Version:** 1.0
**Effective Date:** May 27, 2026
**Last Updated:** May 27, 2026

---

## OVERVIEW

Cravr LLC ("CRAVR") respects the intellectual property rights of others and expects users and creators to do the same. We comply with the Digital Millennium Copyright Act (DMCA), 17 U.S.C. § 512, and have adopted policies to address copyright infringement on our platform.

---

## 1. DESIGNATED COPYRIGHT AGENT

CRAVR has designated a Copyright Agent to receive notifications of claimed copyright infringement:

**DMCA Copyright Agent**
Cravr LLC
30 N Gould St Ste N
Sheridan, WY 82801, USA
Email: legal@cravr.fun

For the fastest processing, send DMCA notices by email.

---

## 2. NOTICE OF CLAIMED COPYRIGHT INFRINGEMENT (TAKEDOWN)

If you believe that content hosted on CRAVR infringes your copyright, you may submit a DMCA takedown notice. To be valid under 17 U.S.C. § 512(c)(3), your notice must include ALL of the following:

### 2.1 Required Elements

- **Identification of the copyrighted work:** Describe the copyrighted work you claim has been infringed. If multiple works are covered by a single notice, provide a representative list.

- **Identification of the infringing material:** Provide specific information sufficient for us to locate the infringing material on our platform (e.g., URL of the specific page, username of the creator, time-stamped description of the content).

- **Your contact information:** Your full legal name, mailing address, telephone number, and email address.

- **Good faith belief statement:** A statement that you have a good faith belief that the use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.

- **Accuracy statement:** A statement that the information in the notification is accurate and, under penalty of perjury, that you are the copyright owner or authorized to act on behalf of the copyright owner.

- **Signature:** Your physical or electronic signature.

### 2.2 Where to Send

Email (preferred): legal@cravr.fun (Subject: "DMCA Takedown Notice")

**WARNING:** Knowingly submitting a materially false DMCA claim is perjury and may result in civil liability. See 17 U.S.C. § 512(f).

---

## 3. COUNTER-NOTIFICATION (DISPUTED TAKEDOWN)

If your content was removed pursuant to a DMCA notice and you believe the removal was made in error (e.g., the content is not infringing, it is covered by fair use, or you are the rights holder), you may submit a counter-notification.

### 3.1 Required Elements for Counter-Notification

Under 17 U.S.C. § 512(g)(3), your counter-notification must include:

- **Identification of removed material:** Identification of the material that was removed and the location where it appeared before removal (provide the URL or reference number from our removal notice).

- **Statement under penalty of perjury:** A statement, under penalty of perjury, that you have a good faith belief the material was removed or disabled as a result of mistake or misidentification.

- **Your contact information:** Your full legal name, mailing address, and telephone number.

- **Consent to jurisdiction:** A statement that you consent to the jurisdiction of the Federal District Court for the District of Wyoming, and that you will accept service of process from the person who submitted the takedown notice.

- **Your signature:** Your physical or electronic signature.

### 3.2 Process After Counter-Notification

Upon receipt of a valid counter-notification:
- We will forward the counter-notification to the original complainant
- The complainant has 10–14 business days to file an action in federal court to prevent restoration
- If no court action is filed within that period, we will restore the removed content at our discretion

---

## 4. REPEAT INFRINGER POLICY

Consistent with the DMCA and other applicable law, CRAVR maintains a policy of terminating accounts of users and creators who are repeat copyright infringers in appropriate circumstances. We consider a "repeat infringer" to be a user who has received multiple valid DMCA takedown notices within a 12-month period.

---

## 5. GOOD FAITH & FAIR USE

We recognize that many situations involve complex questions of fair use, transformative works, and licensing. If you are unsure whether your use of material is infringing, we encourage you to consult with an attorney or visit copyright.gov for more information about fair use.

---

## 6. NON-COPYRIGHT VIOLATIONS

For content that violates our Terms of Service or Code of Conduct (harassment, illegal content, community standards) but does not constitute copyright infringement, please report using:
- In-platform "Report" button
- Email: support@cravr.fun

---

## 7. MODIFICATIONS

CRAVR reserves the right to modify this policy at any time. Changes will be posted on this page with an updated date.

---

**Contact:**
DMCA Agent: legal@cravr.fun
Legal: legal@cravr.fun
Address: 30 N Gould St Ste N, Sheridan, WY 82801, USA

© 2026 Cravr LLC All rights reserved.
    `,
  },

  refund: {
    title: "Refund Policy",
    content: `
# Cravr LLC REFUND POLICY

**Version:** 1.0
**Effective Date:** May 27, 2026
**Last Updated:** May 27, 2026

---

## OVERVIEW

This Refund Policy describes the circumstances under which Cravr LLC ("CRAVR," "we," "us") will issue refunds for purchases made on our platform. Please read this policy carefully before making any purchase.

---

## 1. GENERAL POLICY — NO REFUNDS ON VIRTUAL CURRENCY

All purchases of credits (virtual currency) are **final and non-refundable**, except in the specific circumstances described below. By completing a purchase, you acknowledge that:
- Credits are a virtual, non-monetary license to access platform features
- Credits have no cash value and cannot be exchanged for real currency
- Purchases are consumed immediately upon use

---

## 2. ELIGIBLE REFUND CIRCUMSTANCES

We will issue refunds in the following limited circumstances:

### 2.1 Technical Errors
If a verifiable technical error on our platform caused:
- Credits to be deducted without the corresponding feature being delivered
- A duplicate charge for the same transaction
- A payment being processed for a cancelled subscription

You must report the error within **7 days** of the transaction to support@cravr.fun with your transaction ID and a description of the issue.

### 2.2 Unauthorized Transactions
If your account was accessed without your authorization and charges were made, contact us immediately at support@cravr.fun (and legal@cravr.fun for billing disputes). We will investigate and, where confirmed, refund unauthorized charges. You must also:
- Change your password immediately
- Enable two-factor authentication
- File a report with your bank or card issuer if appropriate

### 2.3 Consumer Protection Law Requirements
Where applicable consumer protection laws in your jurisdiction mandate refund rights (e.g., EU/UK cooling-off periods for digital content), we will honor those rights. Note that for digital content that has been accessed or consumed, many such statutory rights may not apply. Contact legal@cravr.fun for jurisdiction-specific guidance.

### 2.4 Platform Termination
If CRAVR permanently shuts down the platform and you have an unused credit balance at the time of shutdown, we will refund the equivalent dollar value of your unused credits at the purchase exchange rate.

---

## 3. NON-ELIGIBLE CIRCUMSTANCES

We do **not** issue refunds for:
- Credits that have been used to tip, gift, or unlock content (consumed credits)
- Dissatisfaction with a creator's content (content is creator-controlled; see Section 5)
- Change of mind after purchase
- Account suspensions or terminations for Terms of Service violations
- Expired promotional or bonus credits
- Membership subscription fees for periods already accessed
- Boost packages that have already been applied to your profile

---

## 4. SUBSCRIPTION REFUNDS

### 4.1 Monthly Subscriptions
Monthly subscription fees are non-refundable for the current billing period. Cancellation takes effect at the end of the current billing period. You retain access to subscription benefits until the period ends.

### 4.2 Annual Subscriptions
Annual subscription fees are non-refundable after the first 7 days (cooling-off period). If you cancel an annual subscription within 7 days of the initial purchase and have not accessed premium features, you may request a pro-rated refund for the unused months.

### 4.3 How to Cancel
Cancel your subscription at any time from Account Settings → Billing → Subscriptions. Cancellations must be made at least 48 hours before the next renewal date to avoid being charged for the next period.

---

## 5. CREATOR CONTENT COMPLAINTS

If you believe a creator engaged in deceptive practices (e.g., promised specific content and delivered something materially different), contact support@cravr.fun within 72 hours of the interaction. We will review the complaint and may issue a credit refund at our sole discretion if deception is verified. We do not mediate subjective quality disputes.

---

## 6. HOW TO REQUEST A REFUND

**Step 1:** Contact support@cravr.fun with the subject line "Refund Request — [Transaction ID]"

**Step 2:** Include the following information:
- Your username and account email
- Transaction ID (found in Account Settings → Transactions)
- Date of transaction
- Amount paid
- Reason for refund request
- Any supporting evidence (screenshots, error messages)

**Step 3:** We will acknowledge your request within 2 business days and complete our review within 5–10 business days.

**Step 4:** If approved, refunds are issued to the original payment method within 5–10 business days (actual timing depends on your bank or card issuer).

---

## 7. CHARGEBACKS

If you initiate a chargeback with your bank or card issuer without first contacting us, your account will be suspended pending investigation. We encourage you to contact us first — we can typically resolve billing issues faster than the chargeback process. See Section 4.5 of our Terms of Service for the full chargeback policy.

---

## 8. CONTACT

For refund requests and billing inquiries:

**CRAVR Billing Team**
Email: support@cravr.fun
Address: 30 N Gould St Ste N, Sheridan, WY 82801, USA
Response time: 2 business days for acknowledgment; 5–10 business days for resolution

---

© 2026 Cravr LLC All rights reserved.
    `,
  },

  cookies: {
    title: "Cookie Policy",
    content: `
# Cravr LLC COOKIE POLICY

**Version:** 1.0
**Effective Date:** May 27, 2026
**Last Updated:** May 27, 2026

---

## OVERVIEW

Cravr LLC ("CRAVR," "we," "us") uses cookies and similar tracking technologies on our platform. This Cookie Policy explains what cookies are, how we use them, your choices regarding cookies, and how to contact us about this policy.

This policy should be read alongside our Privacy Policy.

---

## 1. WHAT ARE COOKIES?

Cookies are small text files placed on your device (computer, smartphone, tablet) when you visit a website. They are widely used to make websites work efficiently, remember your preferences, and provide information to site owners.

We also use similar technologies:
- **Local Storage / Session Storage:** Browser-based storage used for session data and preferences
- **Pixel Tags / Web Beacons:** Tiny image files embedded in pages or emails to track interactions
- **Device Fingerprinting:** Technical data used for fraud detection and age verification compliance

---

## 2. TYPES OF COOKIES WE USE

### 2.1 Strictly Necessary Cookies

These cookies are essential for the platform to function and cannot be switched off. They are set in response to actions you take (logging in, completing the age gate, filling in forms). You cannot opt out of these cookies.

| Cookie Name | Purpose | Duration |
|---|---|---|
| vl_age_gate_v1 | Records age gate acceptance | Session |
| vl_age_verify_v1 | Records verification status | 1 year |
| CRAVR_token | Authentication session | 7 days |
| CRAVR_user | User session data | 7 days |

### 2.2 Functional / Preference Cookies

These cookies remember your choices and preferences to provide an enhanced experience. You can opt out, but doing so may affect platform functionality.

| Cookie Name | Purpose | Duration |
|---|---|---|
| vl_credits_v1 | Credit balance storage | Persistent |
| vl_membership_v1 | Membership tier storage | Persistent |
| vl_saved_cards_v1 | Saved payment methods | Persistent |
| vl_active_boost_v1 | Active boost package | Persistent |

### 2.3 Analytics Cookies

We use analytics cookies to understand how users interact with our platform, helping us improve the experience. This data is aggregated and anonymized. You can opt out in the Cookie Preferences panel.

| Provider | Purpose | Duration |
|---|---|---|
| Internal Analytics | Page views, feature usage, session depth | 90 days |
| Performance Monitoring | Load times, error rates | 30 days |

### 2.4 Security & Fraud Prevention Cookies

These cookies help detect fraud, protect against unauthorized access, and ensure compliance with our age verification requirements. These cookies cannot be disabled.

| Cookie | Purpose | Duration |
|---|---|---|
| Session integrity | CSRF protection | Session |
| Fraud detection | Bot and fraud prevention | 30 days |

---

## 3. THIRD-PARTY COOKIES

We may allow limited third-party service providers to set cookies for the following purposes:
- **Payment processing:** Our payment processor may set cookies to facilitate secure transactions and fraud detection
- **Security services:** Anti-DDoS and bot detection services

We do **not** allow third-party advertising networks to set cookies on our platform. We do not use cookies for behavioral advertising or tracking across other websites.

---

## 4. YOUR COOKIE CHOICES

### 4.1 Cookie Consent Banner
When you first visit CRAVR (after age gate acceptance), we display a cookie consent banner. You can accept all cookies, accept only necessary cookies, or manage your preferences individually.

### 4.2 Managing Cookies in Your Browser

You can manage or delete cookies through your browser settings:
- **Chrome:** Settings → Privacy and Security → Cookies
- **Firefox:** Settings → Privacy & Security → Cookies and Site Data
- **Safari:** Settings → Privacy → Manage Website Data
- **Edge:** Settings → Privacy, Search, and Services → Cookies

Note: Deleting or blocking strictly necessary cookies will impair the platform's functionality.

### 4.3 Do Not Track (DNT)
Our platform currently responds to Do Not Track browser signals by limiting non-essential tracking. We support user privacy preferences.

### 4.4 Opt-Out of Analytics
To opt out of analytics cookies, adjust your preferences in the Cookie Preferences panel (accessible at /legal/cookies) or contact legal@cravr.fun.

---

## 5. COOKIES AND ADULT CONTENT PLATFORMS

As an age-restricted platform, we use certain cookies and storage specifically for compliance purposes:
- **Age gate and verification data** is stored to avoid requiring age confirmation on every visit
- This data is stored locally on your device and is not transmitted to third parties except as required for verification services
- If you use a shared device, we recommend clearing browser data after each session

---

## 6. INTERNATIONAL USERS

### 6.1 EU/EEA/UK (GDPR)
Our use of cookies is governed by Article 5(3) of the ePrivacy Directive and GDPR. We obtain your consent before placing non-essential cookies. You have the right to withdraw consent at any time through the Cookie Preferences panel.

### 6.2 California (CCPA)
Cookies that qualify as "personal information" under the CCPA are covered by our Privacy Policy. We do not sell personal information collected via cookies.

---

## 7. UPDATES TO THIS POLICY

We may update this Cookie Policy as our practices change or as required by law. We will notify you of material changes via a notice on the platform or by email. The "Last Updated" date at the top of this policy indicates when it was last revised.

---

## 8. CONTACT US

For questions about our use of cookies:

**CRAVR Privacy Team**
Email: legal@cravr.fun
Address: 30 N Gould St Ste N, Sheridan, WY 82801, USA

---

© 2026 Cravr LLC All rights reserved.
    `,
  },

  community: {
    title: "Community Guidelines",
    content: `
# Cravr LLC COMMUNITY GUIDELINES

**Version:** 1.0
**Effective Date:** May 27, 2026
**Last Updated:** May 27, 2026

---

## INTRODUCTION

CRAVR is an adult platform built on the principles of consent, safety, and respect. These Community Guidelines explain in plain terms what is and isn't allowed on CRAVR. All users — viewers and creators — must follow these guidelines. Violations may result in content removal, suspension, or permanent ban.

These guidelines work alongside our Terms of Service and Code of Conduct. Where they overlap, the more specific rule applies.

---

## WHAT WE STAND FOR

- **Consent:** Every interaction on CRAVR must be consensual. There is no exception.
- **Safety:** The safety of every person on our platform comes first.
- **Authenticity:** Be who you are. We don't allow fake personas created to deceive.
- **Respect:** Everyone here deserves basic dignity, regardless of their role on the platform.
- **Legality:** All content and conduct must comply with applicable law.

---

## SECTION 1: CONTENT GUIDELINES

### 1.1 What's Allowed
- Adult nudity and explicit content in designated premium/locked sections (creators only, verified accounts)
- Consensual adult roleplay and fantasy between verified adult performers
- Suggestive, flirtatious, or adult-themed content in public areas (non-explicit)
- Educational discussions about adult topics, health, and relationships
- Artistic and creative expression, including adult art, written content, and performance

### 1.2 What's Never Allowed
- **CSAM (Child Sexual Abuse Material):** Any sexualization of minors in any form. Zero tolerance. Immediately reported to NCMEC and law enforcement.
- **Non-consensual content:** Content depicting or simulating non-consensual sexual acts presented approvingly ("rape porn," "revenge porn")
- **Real violence or abuse:** Content depicting actual violence, injury, or abuse being inflicted on a person or animal
- **Bestiality:** Sexual content involving animals
- **Content facilitating trafficking:** Any content that promotes, advertises, or facilitates sex trafficking or prostitution (FOSTA-SESTA)
- **Deepfakes without consent:** AI-generated or manipulated content depicting real people in sexual situations without their documented consent

---

## SECTION 2: CREATOR-SPECIFIC GUIDELINES

### 2.1 Creator Standards
- You must be a verified adult (18+) to create content on CRAVR
- All individuals appearing in your content must be 18+ and have provided documented consent
- You must maintain 18 U.S.C. § 2257 records for all content featuring other individuals
- Your profile must accurately represent who you are — no impersonation of other creators or public figures
- Do not share other users' private information, including messages or personal details

### 2.2 Live Streaming Standards
- Public live streams must remain non-explicit (explicit content for paid/locked rooms only)
- Do not allow individuals under 18 to appear on camera during any stream
- Do not engage in or simulate real-world solicitation of sexual services
- Maintain control of your streaming environment — you are responsible for who and what appears on screen

### 2.3 Prohibited Creator Behavior
- Do not use the platform to solicit off-platform payments outside of CRAVR's system
- Do not threaten or blackmail viewers
- Do not promise exclusive off-platform contact as an inducement for payment
- Do not share or sell viewer personal data

---

## SECTION 3: VIEWER-SPECIFIC GUIDELINES

### 3.1 Viewer Standards
- Treat creators with respect; they are real people
- Respect creator boundaries — if a creator declines a request, accept it gracefully
- Do not attempt to discover or reveal a creator's real-world identity
- Do not record, screenshot, or redistribute creator content without explicit permission

### 3.2 Prohibited Viewer Behavior
- Do not repeatedly message a creator after being asked to stop (this is harassment)
- Do not make threats — explicit, implicit, or financial
- Do not use multiple accounts to evade bans or restrictions
- Do not offer or negotiate real-world sexual services through any feature
- Do not share creator content externally without written permission

---

## SECTION 4: MESSAGING & CHAT GUIDELINES

- All messages must comply with these guidelines
- Do not send unsolicited explicit images or videos
- Do not use messages to arrange real-world meetings or exchanges
- Do not engage in hate speech, slurs, or targeted harassment
- Mass-messaging for spam or solicitation purposes is prohibited

---

## SECTION 5: HATE SPEECH & DISCRIMINATION

We do not allow content that promotes, glorifies, or celebrates:
- Hatred toward people based on race, ethnicity, national origin, religion, sex, gender identity, sexual orientation, disability, or age
- Dehumanization of any group of people
- Calls for violence against individuals or groups

Consensual adult content exploring taboo or fantasy themes in a clearly fictional context is different from hate speech. Context matters, but if content primarily serves to demean or dehumanize real groups of people, it is not permitted.

---

## SECTION 6: TRANSPARENCY & AUTHENTICITY

- Do not misrepresent your identity for deceptive purposes
- Do not claim to be CRAVR staff unless you are
- Do not create fake profiles of real people without their consent
- Do not use manipulative tactics to extract payments (false scarcity, false emergency claims, etc.)

---

## SECTION 7: LEGAL CONTENT REQUIREMENTS

All creators and users must comply with:
- **18 U.S.C. § 2257** (age records for sexually explicit content)
- **FOSTA-SESTA** (no trafficking or solicitation)
- **DMCA** (respect copyright)
- **All applicable local, state, national, and international laws**

---

## SECTION 8: REPORTING VIOLATIONS

If you see content or behavior that violates these guidelines:

1. **In-platform:** Use the "Report" button on any profile, chat message, or stream
2. **Email:** support@cravr.fun
3. **Trafficking/minors:** legal@cravr.fun (escalated to authorities immediately)

Reports are confidential. We take every report seriously and respond within 24 hours.

---

## SECTION 9: APPEALS

If your content was removed or your account was suspended, you may appeal through our moderation appeal process. See our Code of Conduct (Section 8) for full appeal procedures, or email support@cravr.fun.

---

## UPDATES

These guidelines are updated as the platform evolves. Material changes will be communicated via email and platform notification.

---

**CRAVR Trust & Safety Team**
Email: support@cravr.fun
Community: support@cravr.fun
Address: 30 N Gould St Ste N, Sheridan, WY 82801, USA

---

© 2026 Cravr LLC All rights reserved.
    `,
  },
};

export default function LegalPages() {
  const params = useParams();
  const page = (params.page as string) || "terms";

  const legal = LEGAL_CONTENT[page];

  if (!legal) {
    return (
      <div className="min-h-screen py-12 px-4" style={{ background: "#09091a" }}>
        <div className="container max-w-4xl">
          <h1 className="text-4xl font-bold text-white mb-8">Legal Documents</h1>
          <div className="grid gap-4">
            {Object.entries(LEGAL_CONTENT).map(([key, { title }]) => (
              <Link key={key} href={`/legal/${key}`}>
                <div className="vl-card p-6 hover:border-teal-500 transition-colors cursor-pointer group flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white group-hover:text-teal-400 transition-colors">
                    {title}
                  </h3>
                  <ChevronRight className="w-5 h-5 text-teal-500" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const downloadDoc = LEGAL_DOCS[page];

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "#09091a" }}>
      <div className="container max-w-4xl">
        {/* Back Link */}
        <Link href="/legal" className="text-teal-400 hover:text-teal-300 mb-6 inline-flex items-center gap-2">
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Legal Centre
        </Link>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mt-4 mb-6">{legal.title}</h1>

        {/* Download bar — shown when a matching doc exists in legal-content.ts */}
        {downloadDoc && <LegalDownloadBar doc={downloadDoc} />}

        {/* Content */}
        <div className="vl-card p-8 prose prose-invert max-w-none">
          <div
            className="text-gray-300 leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{
              __html: (() => {
                const lines = legal.content.split("\n");
                const out: string[] = [];
                const md = (s: string) =>
                  s.replace(/\*\*(.*?)\*\*/g, "<strong class='text-white'>$1</strong>")
                   .replace(/\*(.*?)\*/g, "<em style='opacity:0.6'>$1</em>");
                let i = 0;
                while (i < lines.length) {
                  const line = lines[i];
                  if (line.startsWith("# ")) {
                    out.push(`<h2 class="text-2xl font-bold text-white mt-8 mb-4">${line.slice(2)}</h2>`);
                  } else if (line.startsWith("## ")) {
                    out.push(`<h3 class="text-xl font-bold text-white mt-6 mb-3">${line.slice(3)}</h3>`);
                  } else if (line.startsWith("### ")) {
                    out.push(`<h4 class="text-lg font-semibold mt-4 mb-2" style="color:#14b8a6">${line.slice(4)}</h4>`);
                  } else if (line.startsWith("- ")) {
                    out.push(`<li class="ml-4">${md(line.slice(2))}</li>`);
                  } else if (/^-{3,}$/.test(line.trim())) {
                    out.push('<hr class="my-8 border-slate-700" />');
                  } else if (line.trim() === "") {
                    // blank — skip
                  } else if (line.startsWith("|")) {
                    // ── Table block: collect all consecutive pipe lines (including |---|--- separator rows) ──
                    const tblLines: string[] = [];
                    while (i < lines.length && lines[i].startsWith("|")) {
                      tblLines.push(lines[i]);
                      i++;
                    }
                    // Drop separator rows (|---|:---|)
                    const rows = tblLines.filter(l => !/^\|\s*[-: |]+\s*\|$/.test(l));
                    const parseRow = (r: string) => r.split("|").slice(1, -1).map(c => c.trim());
                    const cellMd = (s: string) =>
                      s.replace(/\*\*(.*?)\*\*/g, "<strong style='color:#14b8a6'>$1</strong>")
                       .replace(/\*(.*?)\*/g, "<em style='opacity:0.55'>$1</em>");
                    let tbl = `<div style="overflow-x:auto;margin:1rem 0 1.5rem">` +
                      `<table style="width:100%;border-collapse:collapse;font-size:13px;line-height:1.6">`;
                    rows.forEach((row, ri) => {
                      const cells = parseRow(row);
                      if (ri === 0) {
                        tbl += `<thead><tr>${cells.map(c =>
                          `<th style="padding:10px 16px;text-align:left;background:rgba(20,184,166,0.1);` +
                          `border:1px solid rgba(20,184,166,0.2);color:#14b8a6;font-weight:700;white-space:nowrap">` +
                          `${cellMd(c)}</th>`).join("")}</tr></thead><tbody>`;
                      } else {
                        const bg = ri % 2 === 1 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.035)";
                        tbl += `<tr style="background:${bg}">${cells.map(c =>
                          `<td style="padding:9px 16px;border:1px solid rgba(255,255,255,0.07);color:rgba(255,255,255,0.82)">` +
                          `${cellMd(c)}</td>`).join("")}</tr>`;
                      }
                    });
                    tbl += `</tbody></table></div>`;
                    out.push(tbl);
                    continue; // i already advanced past the table block
                  } else {
                    out.push(`<p>${md(line)}</p>`);
                  }
                  i++;
                }
                return out.join("");
              })()
            }}
          />
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
          <p>© 2026 Cravr LLC · 30 N Gould St Ste N, Sheridan, WY 82801, USA · EIN 42-2815300</p>
          <p className="mt-2">
            Legal inquiries:{" "}
            <a href="mailto:legal@cravr.fun" className="hover:underline" style={{ color: "#14b8a6" }}>
              legal@cravr.fun
            </a>
            {" · "}
            <Link href="/legal" className="hover:underline" style={{ color: "rgba(255,255,255,0.4)" }}>
              Legal Centre
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
