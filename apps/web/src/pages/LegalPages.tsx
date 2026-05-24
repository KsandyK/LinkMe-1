/**
 * LINKME — Legal Pages
 * Comprehensive legal documents with Terms of Service, Privacy Policy, Creator Agreement, Code of Conduct
 * No CCBill references. No AI watermarks.
 */
import { useParams } from "wouter";
import { ChevronRight } from "lucide-react";

const LEGAL_CONTENT: Record<string, { title: string; content: string }> = {
  terms: {
    title: "Terms of Service",
    content: `
# LINKME INC. TERMS OF SERVICE

**Version:** 2.0  
**Effective Date:** March 27, 2026  
**Last Updated:** March 27, 2026

LINKME INC.  
1234 Platform Way  
Wilmington, DE 19801, USA

Legal Department: legal@LINKME.com

---

## IMPORTANT LEGAL NOTICE — READ CAREFULLY

LINKME is an adult platform restricted to users 18 years of age or older. By accessing this Service you are entering into a legally binding contract. If you do not agree to all Terms below, you must immediately cease using the Service. Access by minors is strictly prohibited and may constitute a criminal offense.

---

## 1. ACCEPTANCE OF TERMS & BINDING AGREEMENT

1.1 By accessing, registering for, or using LINKME ("Platform," "Service," "we," "us," or "our"), you ("User," "you") agree to be legally bound by these Terms of Service ("Terms"), our Privacy Policy, and our Code of Conduct, all of which are incorporated herein by reference.

1.2 These Terms constitute a legally binding agreement between you and LINKME INC., a Delaware corporation ("Company"). If you do not agree, you have no right to use the Service.

1.3 Electronic Acceptance: Clicking "I Agree," checking the age-confirmation box, creating an account, or continuing to use the Service after any update to these Terms constitutes your full legal acceptance. You waive any defense that an electronic agreement is unenforceable.

1.4 Capacity: You represent that you have the legal capacity to enter contracts in your jurisdiction, are at least 18 years old, and are not prohibited by any law from using the Service.

1.5 We reserve the right to modify these Terms at any time. Continued use after posting changes constitutes acceptance. Material changes will be communicated via email or platform notice.

---

## 2. ELIGIBILITY & AGE RESTRICTION

2.1 **Minimum Age:** You MUST be at least 18 years of age to use this Service. No exceptions.

2.2 You represent and warrant under penalty of perjury that:
- You are 18 years of age or older
- You are legally permitted to access adult content in your jurisdiction
- You are not accessing this Service from a jurisdiction where adult content is prohibited

2.3 **Minors:** If LINKME discovers or has reason to believe any user is under 18, we will immediately terminate their account, report the matter to relevant authorities, and preserve all relevant evidence for law enforcement. Attempts to circumvent age verification may constitute criminal fraud.

2.4 You acknowledge that LINKME employs technical, procedural, and contractual measures to prevent minor access, and that your affirmative representation of age is the foundational layer of this system. Providing false age information is a material breach of these Terms.

---

## 3. DESCRIPTION OF SERVICE & NO GUARANTEE

3.1 LINKME is a premium hybrid adult dating and live interaction platform providing:
- Live streaming rooms and interactive broadcasts
- Creator profiles with optional locked/premium content
- Virtual gift and tipping systems
- Credit-based messaging and interaction
- VIP Lounge exclusive sessions
- Profile boost and visibility features
- Membership subscription plans

3.2 **THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE."** LINKME MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.

3.3 We do not guarantee uninterrupted service, error-free operation, or that the Service will meet your expectations. Scheduled and unscheduled downtime may occur without notice or compensation.

3.4 **Creator Content:** Creators are independent contractors. LINKME does not endorse, validate, or guarantee the accuracy, quality, or appropriateness of creator content beyond our moderation standards.

---

## 4. CREDITS, VIRTUAL CURRENCY & PURCHASES

4.1 Credits are a virtual currency with no cash value, not exchangeable for real currency, and non-transferable between accounts. Credits are a limited license to access features on the Platform.

4.2 All credit and subscription purchases are **FINAL AND NON-REFUNDABLE**, except:
- Where required by applicable consumer protection law
- At LINKME's sole discretion in cases of demonstrable technical error

4.3 Credits do not expire while your account remains in good standing. Upon account termination for cause, all unused credits are forfeited without compensation.

4.4 Pricing is in USD and subject to change with 7 days' notice for subscriptions. We reserve the right to modify credit-to-dollar ratios at any time.

4.5 **Chargebacks & Disputes:** Initiating a chargeback or payment dispute without first exhausting LINKME's internal dispute resolution process (support@LINKME.com) constitutes a breach of these Terms. In such cases:
- Your account will be immediately suspended pending investigation
- You will be liable for the disputed amount plus a $50 processing fee
- LINKME reserves the right to pursue collection through any lawful means
- Accounts with fraudulent chargebacks may be permanently banned

4.6 **Bonus Credits:** Bonus credits issued through membership plans, promotions, or referrals are revocable at LINKME's discretion and are the last credits spent from your balance.

4.7 **Membership Subscriptions:** Auto-renew unless cancelled at least 48 hours before the renewal date. Cancellation takes effect at the end of the current billing period.

---

## 5. USER CONDUCT & PROHIBITED ACTIVITIES

5.1 You agree NOT to, and represent that you will not:
- Access or use the Service if under 18 years of age
- Harass, stalk, threaten, intimidate, or harm any user, creator, or LINKME employee
- Attempt to arrange in-person meetings with creators through the platform
- Screenshot, record, download, copy, or distribute any content from the platform without explicit written permission
- Use bots, scripts, crawlers, scrapers, or automated tools to interact with the platform
- Reverse engineer, decompile, or attempt to extract source code from the platform
- Impersonate any person, entity, or LINKME staff member
- Create multiple accounts to evade suspension or restrictions
- Use VPN, proxy, or other tools to circumvent geo-restrictions or age verification
- Upload, transmit, or share malware, viruses, or harmful code
- Engage in any activity that interferes with platform operations or other users' enjoyment
- Attempt to manipulate credit systems, exploit bugs, or conduct fraud
- Use the platform to facilitate prostitution, trafficking, or any illegal exchange of services

5.2 **Enforcement:** Violations may result in: content removal, account suspension, permanent ban, forfeiture of credits without refund, and/or referral to law enforcement. LINKME is the sole arbiter of violations and its decisions are final.

---

## 6. CONTENT, INTELLECTUAL PROPERTY & LICENSE

6.1 All platform content not owned by creators (UI, branding, algorithms, software) is the exclusive property of LINKME INC. and protected by copyright, trademark, and trade secret law.

6.2 **Creator Content:** Creators retain copyright in their original content. Purchasing or unlocking access to content grants you a personal, non-exclusive, non-transferable, revocable license to view that content within the Platform only.

6.3 **Prohibited Content Actions:** You may not download, export, record, screenshot, or reproduce any platform content. Violation constitutes copyright infringement and may expose you to civil liability of up to $150,000 per work under 17 U.S.C. § 504, plus attorney's fees.

6.4 **DMCA:** If you believe content infringes your copyright, send a DMCA notice to: dmca@LINKME.com. Repeat infringers' accounts will be terminated.

6.5 **User Content License:** By submitting any content (messages, profile information, reviews), you grant LINKME a perpetual, irrevocable, royalty-free, worldwide license to use, store, display, and moderate that content for platform operations.

---

## 7. PRIVACY & DATA

Your use of the Service is governed by our Privacy Policy, incorporated herein by reference. You consent to our data practices including:
- Collection of account, usage, and device data
- Payment processing through secure payment processors
- Use of cookies and tracking technologies
- Storage and processing of data in the United States

**Billing Discretion:** All charges appear as "LINKME" or similar neutral descriptor on your bank statement. We never use explicit descriptors in billing.

---

## 8. LIMITATION OF LIABILITY & INDEMNIFICATION

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, LINKME SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOST DATA, OR LOST BUSINESS OPPORTUNITY, EVEN IF LINKME HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

---

## 9. TERMINATION

LINKME may terminate or suspend your account at any time, with or without cause, with or without notice. Upon termination, your right to use the Service immediately ceases. All unused credits are forfeited.

---

## 10. GOVERNING LAW

These Terms are governed by the laws of the State of Delaware, without regard to its conflict of law principles. You consent to the exclusive jurisdiction of the courts located in Delaware.

---

© 2026 LINKME INC. All rights reserved.
    `,
  },
  privacy: {
    title: "Privacy Policy",
    content: `
# LINKME INC. PRIVACY POLICY

**Version:** 1.0  
**Effective Date:** March 27, 2026  
**Last Updated:** March 27, 2026

---

## PRIVACY NOTICE

LINKME INC. ("we," "us," "our," or "Company") respects your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and platform (the "Service").

---

## 1. INFORMATION WE COLLECT

### 1.1 Information You Provide Directly

- **Account Registration:** Name, email address, date of birth, username, password
- **Age Verification:** Government-issued ID, selfie, and verification data
- **Payment Information:** Credit card, bank account details (processed through secure payment processors)
- **Profile Information:** Bio, photos, interests, location, preferences
- **Communications:** Messages, support tickets, feedback, reports
- **Content:** Live streams, photos, videos, text, and other user-generated content

### 1.2 Information Collected Automatically

- **Device Information:** IP address, device type, operating system, browser type
- **Usage Data:** Pages visited, time spent, features used, interactions
- **Cookies & Tracking:** Session cookies, analytics cookies, third-party tracking pixels
- **Location Data:** Approximate location based on IP address (not GPS)

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
- Comply with legal obligations
- Conduct analytics and research
- Personalize your experience
- Send marketing communications (with your consent)

---

## 3. DATA SECURITY

We implement industry-standard security measures including:
- **AES-256 Encryption** for sensitive data at rest
- **TLS 1.3** for data in transit
- **PCI DSS Level 1 Compliance** for payment processing
- **Regular Security Audits** and penetration testing
- **Access Controls** limiting employee access to sensitive data

However, no security system is impenetrable. We cannot guarantee absolute security.

---

## 4. DATA RETENTION

- **Account Data:** Retained for the duration of your account plus 1 year after termination
- **Payment Records:** Retained for 7 years (tax/legal requirements)
- **Age Verification Data:** Retained for 5 years or as required by law
- **Deleted Content:** Permanently deleted within 30 days (except where legally required to retain)

---

## 5. SHARING YOUR INFORMATION

We do NOT sell your personal information. We may share information with:
- **Service Providers:** Payment processors, hosting providers, analytics services
- **Law Enforcement:** When legally required or to prevent illegal activity
- **Legal Proceedings:** When required by court order or subpoena
- **Business Transfers:** In case of merger, acquisition, or asset sale

---

## 6. YOUR RIGHTS & CHOICES

### 6.1 Access & Portability
You have the right to request a copy of your personal data in a portable format.

### 6.2 Correction & Deletion
You may request correction of inaccurate data or deletion of your account and associated data (subject to legal retention requirements).

### 6.3 Opt-Out
You may opt out of marketing communications at any time. You cannot opt out of essential service communications.

### 6.4 Cookie Management
You can control cookies through your browser settings. Note that disabling cookies may affect platform functionality.

---

## 7. CHILDREN'S PRIVACY

LINKME is not intended for users under 18 years of age. We do not knowingly collect information from minors. If we discover a minor has provided information, we will immediately delete it and report to authorities.

---

## 8. INTERNATIONAL DATA TRANSFERS

Your information may be transferred to, stored in, and processed in the United States or other countries. By using the Service, you consent to such transfers.

---

## 9. CONTACT US

For privacy inquiries, contact:

**LINKME Privacy Team**  
Email: privacy@LINKME.com  
Address: 1234 Platform Way, Wilmington, DE 19801, USA

---

© 2026 LINKME INC. All rights reserved.
    `,
  },
  creator: {
    title: "Creator Agreement & NDA",
    content: `
# LINKME INC. CREATOR AGREEMENT & NDA

**Version:** 2.0  
**Effective Date:** March 27, 2026  
**Last Updated:** March 27, 2026

---

## LEGALLY BINDING AGREEMENT — READ EVERY SECTION

This Creator Agreement and Non-Disclosure Agreement ("Agreement") is a legally binding contract between you ("Creator," "you") and LINKME INC., a Delaware corporation ("Company," "LINKME," "we"). By registering as a Creator, uploading content, going live, or receiving any payment through the platform, you fully accept all terms below. This Agreement supersedes all prior understandings. If you do not agree, do not register as a Creator.

---

## PART I — CREATOR SERVICES AGREEMENT

---

## 1. CREATOR STATUS — INDEPENDENT CONTRACTOR

1.1 You are an independent contractor, not an employee, agent, joint venture partner, or franchisee of LINKME INC. This Agreement does not create any employment relationship.

1.2 As an independent contractor, you:
- Are solely responsible for your own federal, state, local, and international taxes
- Are not entitled to any employee benefits
- Control your own schedule, content, and creative decisions within platform guidelines
- Must provide your own equipment, software, and internet connection
- May engage in other business activities unless prohibited by a separately signed exclusivity agreement

1.3 **Tax Reporting:** LINKME will issue Form 1099-NEC to US-based Creators earning $600 or more in a calendar year. Non-US creators must complete IRS Form W-8BEN or W-8BEN-E.

1.4 You agree to indemnify and hold LINKME harmless from any tax liability, penalty, or fine arising from your failure to report or pay taxes on earnings.

---

## 2. REVENUE SHARE, PAYMENTS & PROCESSING FEE DISCLAIMER

2.1 **Revenue Tiers:** Your creator revenue share is determined by your verified monthly gross platform earnings:

- **Starter Tier** ($0–$2,500/mo gross): Creator 75% | Platform 25%
- **Rising Tier** ($2,501–$5,000/mo gross): Creator 78% | Platform 22%
- **Established Tier** ($5,001–$15,000/mo gross): Creator 80% | Platform 20%
- **Elite Tier** ($15,001–$25,000/mo gross): Creator 83% | Platform 17%
- **Partner Tier** ($25,001–$75,000/mo gross): Creator 90% | Platform 10%
- **Top Partner Tier** ($75,001+/mo gross): Creator 95% | Platform 5%

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

2.7 LINKME reserves the right to adjust revenue tier thresholds and percentages upon 30 days' written notice.

2.8 Earnings estimates are informational only and do not constitute guarantees of income.

---

## 3. CONTENT OWNERSHIP, LICENSE & IP RIGHTS

3.1 You retain copyright ownership of all original content you create ("Creator Content"), subject to the license granted herein.

3.2 **Platform License:** By uploading or streaming any Creator Content, you grant LINKME an irrevocable, non-exclusive, royalty-free, sublicensable, worldwide license to:
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

## 4. AGE VERIFICATION & § 2257 RECORD-KEEPING (MANDATORY)

4.1 Compliance with 18 U.S.C. § 2257 is MANDATORY for all Creators producing sexually explicit content.

4.2 You must maintain records verifying the age (18+) of every individual depicted in sexually explicit content, including yourself. Required documentation:
- Government-issued photo ID showing legal name and date of birth
- One additional form of identification if the primary ID does not include a photo

4.3 You must maintain these records for a minimum of 5 years and make them available upon lawful demand from law enforcement or LINKME compliance officers.

4.4 Failure to maintain or produce 2257 records upon demand will result in immediate content removal and account suspension pending investigation.

---

## 5. CONTENT STANDARDS & PROHIBITED CONTENT

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
- Content that promotes or facilitates trafficking

---

## 6. TERMINATION & SUSPENSION

6.1 LINKME may terminate this Agreement and suspend your account at any time for:
- Violation of this Agreement or Terms of Service
- Violation of applicable laws
- Failure to maintain 2257 compliance
- Involvement in fraud, trafficking, or illegal activity
- Repeated Code of Conduct violations

6.2 Upon termination, all unpaid earnings are forfeited, and your content may be removed from the platform.

---

## PART II — NON-DISCLOSURE AGREEMENT

---

## 7. CONFIDENTIAL INFORMATION

7.1 You acknowledge that during your use of the platform, you may access confidential information including:
- Platform algorithms and technical infrastructure
- Creator earnings data and payment processing details
- Other creators' personal information
- LINKME's business strategies and financial information

7.2 You agree to maintain the confidentiality of all such information and not disclose it to any third party without LINKME's written consent.

7.3 This obligation survives termination of this Agreement indefinitely.

---

## 8. GOVERNING LAW

This Agreement is governed by the laws of the State of Delaware, without regard to its conflict of law principles.

---

© 2026 LINKME INC. All rights reserved.
    `,
  },
  conduct: {
    title: "Code of Conduct",
    content: `
# LINKME INC. CODE OF CONDUCT

**Version:** 1.0  
**Effective Date:** March 27, 2026  
**Last Updated:** March 27, 2026

---

## PURPOSE

This Code of Conduct establishes community standards for all LINKME users and creators. Our goal is to maintain a safe, respectful, and legal platform for all participants.

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
- Do not harass, stalk, threaten, intimidate, or abuse any user, creator, or LINKME employee
- Do not engage in cyberbullying, doxxing, or coordinated harassment campaigns
- Do not send unsolicited explicit content or unwanted sexual advances
- Do not impersonate others or create fake accounts to harass

### 2.2 Illegal Activity
- Do not use the platform to facilitate prostitution, trafficking, or illegal services
- Do not engage in fraud, scams, or financial crimes
- Do not distribute illegal drugs or controlled substances
- Do not facilitate or promote any illegal activity

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
- Email: safety@LINKME.com
- For emergencies involving minors: law-enforcement@LINKME.com (escalated to authorities)

All reports are anonymous. We review every report within 24 hours.

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

LINKME maintains a **ZERO TOLERANCE POLICY** for child sexual abuse material (CSAM). Any content, communication, or activity involving minors in a sexual context will result in:
- Immediate account termination
- Permanent ban from the platform
- Preservation of all evidence
- Immediate report to the National Center for Missing & Exploited Children (NCMEC)
- Referral to law enforcement

---

## 7. MODIFICATIONS & UPDATES

LINKME reserves the right to modify this Code of Conduct at any time. Continued use of the platform constitutes acceptance of any updates.

---

## CONTACT & SUPPORT

For questions about this Code of Conduct:

**LINKME Community Team**  
Email: community@LINKME.com  
Address: 1234 Platform Way, Wilmington, DE 19801, USA

---

© 2026 LINKME INC. All rights reserved.
    `,
  },
};

export default function LegalPages() {
  const params = useParams();
  const page = (params.page as string) || "terms";

  const legal = LEGAL_CONTENT[page];

  if (!legal) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pt-24 pb-12">
        <div className="container max-w-4xl">
          <h1 className="text-4xl font-bold text-white mb-8">Legal Documents</h1>
          <div className="grid gap-4">
            {Object.entries(LEGAL_CONTENT).map(([key, { title }]) => (
              <a
                key={key}
                href={`/legal/${key}`}
                className="vl-card p-6 hover:border-teal-500 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white group-hover:text-teal-400 transition-colors">
                    {title}
                  </h3>
                  <ChevronRight className="w-5 h-5 text-teal-500" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pt-24 pb-12">
      <div className="container max-w-4xl">
        {/* Back Link */}
        <a href="/legal" className="text-teal-400 hover:text-teal-300 mb-6 inline-flex items-center gap-2">
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Legal
        </a>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-8">{legal.title}</h1>

        {/* Content */}
        <div className="vl-card p-8 prose prose-invert max-w-none">
          <div
            className="text-gray-300 leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{
              __html: legal.content
                .split("\n")
                .map((line) => {
                  // Headers
                  if (line.startsWith("# ")) {
                    return `<h2 class="text-2xl font-bold text-white mt-8 mb-4">${line.replace("# ", "")}</h2>`;
                  }
                  if (line.startsWith("## ")) {
                    return `<h3 class="text-xl font-bold text-white mt-6 mb-3">${line.replace("## ", "")}</h3>`;
                  }
                  if (line.startsWith("### ")) {
                    return `<h4 class="text-lg font-semibold text-teal-400 mt-4 mb-2">${line.replace("### ", "")}</h4>`;
                  }
                  // Bold text
                  if (line.startsWith("- ")) {
                    return `<li class="ml-4">${line.replace("- ", "")}</li>`;
                  }
                  // Horizontal rule
                  if (line.includes("---")) {
                    return '<hr class="my-8 border-slate-700" />';
                  }
                  // Empty lines
                  if (line.trim() === "") {
                    return "";
                  }
                  // Regular paragraph
                  return `<p>${line.replace(/\*\*(.*?)\*\*/g, "<strong class='text-white'>$1</strong>")}</p>`;
                })
                .join(""),
            }}
          />
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-400 text-sm">
          <p>© 2026 LINKME INC. All rights reserved.</p>
          <p className="mt-2">
            For legal inquiries, contact: <span className="text-teal-400">legal@LINKME.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
