import { LegalDownloadBar } from "@/components/LegalDownloadBar";
import { TERMS_OF_SERVICE } from "@/lib/legal-content";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="text-4xl mb-3">ðŸ“œ</div>
          <h1 className="text-3xl font-black text-foreground mb-1">Terms of Service</h1>
          <p className="text-muted-foreground text-sm">Last updated: March 27, 2026 | Effective: March 27, 2026 | Version 2.0</p>
        </div>

        <LegalDownloadBar doc={TERMS_OF_SERVICE} />

        <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">

          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5">
            <p className="text-destructive font-bold text-sm">âš ï¸ IMPORTANT LEGAL NOTICE â€” READ CAREFULLY</p>
            <p className="mt-2 text-sm">LinkMe is an adult platform restricted to users 18 years of age or older. By accessing this Service you are entering into a legally binding contract. If you do not agree to all Terms below, you must immediately cease using the Service. Access by minors is strictly prohibited and may constitute a criminal offense.</p>
          </div>

          {[
            {
              title: "1. Acceptance of Terms & Binding Agreement",
              content: `1.1 By accessing, registering for, or using LinkMe ("Platform," "Service," "we," "us," or "our"), you ("User," "you") agree to be legally bound by these Terms of Service ("Terms"), our Privacy Policy, and our Code of Conduct, all of which are incorporated herein by reference.

1.2 These Terms constitute a legally binding agreement between you and LinkMe Inc., a Delaware corporation ("Company"). If you do not agree, you have no right to use the Service.

1.3 Electronic Acceptance: Clicking "I Agree," checking the age-confirmation box, creating an account, or continuing to use the Service after any update to these Terms constitutes your full legal acceptance. You waive any defense that an electronic agreement is unenforceable.

1.4 Capacity: You represent that you have the legal capacity to enter contracts in your jurisdiction, are at least 18 years old, and are not prohibited by any law from using the Service.

1.5 We reserve the right to modify these Terms at any time. Continued use after posting changes constitutes acceptance. Material changes will be communicated via email or platform notice.`,
            },
            {
              title: "2. Eligibility & Age Restriction",
              content: `2.1 Minimum Age: You MUST be at least 18 years of age to use this Service. No exceptions.

2.2 You represent and warrant under penalty of perjury that:
â€¢ You are 18 years of age or older
â€¢ You are legally permitted to access adult content in your jurisdiction
â€¢ You are not accessing this Service from a jurisdiction where adult content is prohibited

2.3 Minors: If LinkMe discovers or has reason to believe any user is under 18, we will immediately terminate their account, report the matter to relevant authorities, and preserve all relevant evidence for law enforcement. Attempts to circumvent age verification may constitute criminal fraud.

2.4 You acknowledge that LinkMe employs technical, procedural, and contractual measures to prevent minor access, and that your affirmative representation of age is the foundational layer of this system. Providing false age information is a material breach of these Terms.`,
            },
            {
              title: "3. Description of Service & No Guarantee",
              content: `3.1 LinkMe is a premium hybrid adult dating and live interaction platform providing:
â€¢ Live streaming rooms and interactive broadcasts
â€¢ Creator profiles with optional locked/premium content
â€¢ Virtual gift and tipping systems
â€¢ Credit-based messaging and interaction
â€¢ VIP Lounge exclusive sessions
â€¢ Profile boost and visibility features
â€¢ Membership subscription plans

3.2 THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." LinkMe MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.

3.3 We do not guarantee uninterrupted service, error-free operation, or that the Service will meet your expectations. Scheduled and unscheduled downtime may occur without notice or compensation.

3.4 Creator Content: Creators are independent contractors. LinkMe does not endorse, validate, or guarantee the accuracy, quality, or appropriateness of creator content beyond our moderation standards.`,
            },
            {
              title: "4. Credits, Virtual Currency & Purchases",
              content: `4.1 Credits are a virtual currency with no cash value, not exchangeable for real currency, and non-transferable between accounts. Credits are a limited license to access features on the Platform.

4.2 All credit and subscription purchases are FINAL AND NON-REFUNDABLE, except:
â€¢ Where required by applicable consumer protection law
â€¢ At LinkMe's sole discretion in cases of demonstrable technical error

4.3 Credits do not expire while your account remains in good standing. Upon account termination for cause, all unused credits are forfeited without compensation.

4.4 Pricing is in USD and subject to change with 7 days' notice for subscriptions. We reserve the right to modify credit-to-dollar ratios at any time.

4.5 Chargebacks & Disputes: Initiating a chargeback or payment dispute without first exhausting LinkMe's internal dispute resolution process (support@LinkMe.com) constitutes a breach of these Terms. In such cases:
â€¢ Your account will be immediately suspended pending investigation
â€¢ You will be liable for the disputed amount plus a $50 processing fee
â€¢ LinkMe reserves the right to pursue collection through any lawful means
â€¢ Accounts with fraudulent chargebacks may be permanently banned

4.6 Bonus Credits: Bonus credits issued through membership plans, promotions, or referrals are revocable at LinkMe's discretion and are the last credits spent from your balance.

4.7 Membership subscriptions auto-renew unless cancelled at least 48 hours before the renewal date. Cancellation takes effect at the end of the current billing period.`,
            },
            {
              title: "5. User Conduct & Prohibited Activities",
              content: `5.1 You agree NOT to, and represent that you will not:

â€¢ Access or use the Service if under 18 years of age
â€¢ Harass, stalk, threaten, intimidate, or harm any user, creator, or LinkMe employee
â€¢ Attempt to arrange in-person meetings with creators through the platform
â€¢ Screenshot, record, download, copy, or distribute any content from the platform without explicit written permission
â€¢ Use bots, scripts, crawlers, scrapers, or automated tools to interact with the platform
â€¢ Reverse engineer, decompile, or attempt to extract source code from the platform
â€¢ Impersonate any person, entity, or LinkMe staff member
â€¢ Create multiple accounts to evade suspension or restrictions
â€¢ Use VPN, proxy, or other tools to circumvent geo-restrictions or age verification
â€¢ Upload, transmit, or share malware, viruses, or harmful code
â€¢ Engage in any activity that interferes with platform operations or other users' enjoyment
â€¢ Attempt to manipulate credit systems, exploit bugs, or conduct fraud
â€¢ Use the platform to facilitate prostitution, trafficking, or any illegal exchange of services

5.2 Enforcement: Violations may result in: content removal, account suspension, permanent ban, forfeiture of credits without refund, and/or referral to law enforcement. LinkMe is the sole arbiter of violations and its decisions are final.`,
            },
            {
              title: "6. Content, Intellectual Property & License",
              content: `6.1 All platform content not owned by creators (UI, branding, algorithms, software) is the exclusive property of LinkMe Inc. and protected by copyright, trademark, and trade secret law.

6.2 Creator Content: Creators retain copyright in their original content. Purchasing or unlocking access to content grants you a personal, non-exclusive, non-transferable, revocable license to view that content within the Platform only.

6.3 Prohibited Content Actions: You may not download, export, record, screenshot, or reproduce any platform content. Violation constitutes copyright infringement and may expose you to civil liability of up to $150,000 per work under 17 U.S.C. Â§ 504, plus attorney's fees.

6.4 DMCA: If you believe content infringes your copyright, send a DMCA notice to: dmca@LinkMe.com. Repeat infringers' accounts will be terminated.

6.5 User Content License: By submitting any content (messages, profile information, reviews), you grant LinkMe a perpetual, irrevocable, royalty-free, worldwide license to use, store, display, and moderate that content for platform operations.`,
            },
            {
              title: "7. Privacy & Data",
              content: `Your use of the Service is governed by our Privacy Policy, incorporated herein by reference. You consent to our data practices including:

â€¢ Collection of account, usage, and device data
â€¢ Payment processing through CCBill (subject to CCBill's privacy policy)
â€¢ Use of cookies and tracking technologies
â€¢ Storage and processing of data in the United States

Billing Discretion: All charges appear as "CCBILL*LinkMe" or similar neutral descriptor on your bank statement. We never use explicit descriptors in billing.`,
            },
            {
              title: "8. DISCLAIMER OF WARRANTIES",
              content: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:

THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. LinkMe EXPRESSLY DISCLAIMS ALL WARRANTIES INCLUDING:

â€¢ IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
â€¢ WARRANTIES THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE
â€¢ WARRANTIES AS TO THE ACCURACY, RELIABILITY, OR COMPLETENESS OF ANY CONTENT
â€¢ WARRANTIES THAT DEFECTS WILL BE CORRECTED

YOUR USE OF THE SERVICE IS ENTIRELY AT YOUR OWN RISK.`,
            },
            {
              title: "9. LIMITATION OF LIABILITY & INDEMNIFICATION",
              content: `9.1 LIMITATION: TO THE MAXIMUM EXTENT PERMITTED BY LAW, LinkMe, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

9.2 CAP: IN NO EVENT SHALL LinkMe'S AGGREGATE LIABILITY EXCEED THE LESSER OF: (A) THE AMOUNT YOU PAID TO LinkMe IN THE NINETY (90) DAYS PRECEDING THE CLAIM, OR (B) ONE HUNDRED DOLLARS ($100.00).

9.3 INDEMNIFICATION: You agree to defend, indemnify, and hold harmless LinkMe Inc. and its affiliates, officers, agents, employees, and partners from any claim, demand, loss, liability, or expense (including reasonable attorney's fees) arising from: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third-party rights; or (d) any content you submit to the platform.`,
            },
            {
              title: "10. Arbitration, Class Action Waiver & Governing Law",
              content: `10.1 MANDATORY ARBITRATION: ANY DISPUTE, CLAIM, OR CONTROVERSY ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL BE RESOLVED EXCLUSIVELY BY FINAL AND BINDING ARBITRATION, NOT IN COURT, under the American Arbitration Association Commercial Arbitration Rules.

10.2 CLASS ACTION WAIVER: YOU WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION. All claims must be brought in your individual capacity only.

10.3 JURY TRIAL WAIVER: YOU WAIVE YOUR CONSTITUTIONAL RIGHT TO A JURY TRIAL TO THE FULLEST EXTENT PERMITTED BY LAW.

10.4 Exceptions: Either party may seek emergency injunctive relief in court to prevent irreparable harm pending arbitration.

10.5 Governing Law: These Terms are governed by the laws of the State of Delaware, without regard to conflict of law principles.

10.6 Venue: For any claims not subject to arbitration, you consent to exclusive jurisdiction in the state and federal courts of New Castle County, Delaware.

10.7 Time Limitation: ANY CLAIM MUST BE BROUGHT WITHIN ONE (1) YEAR OF THE CAUSE OF ACTION ARISING, OR BE FOREVER BARRED.`,
            },
            {
              title: "11. Sanctions, Export Control & Compliance",
              content: `11.1 You represent that you are not (a) located in a country subject to US government embargo, (b) on any US government list of prohibited persons or entities (including OFAC SDN list), or (c) prohibited by any applicable law from using the Service.

11.2 LinkMe complies with applicable anti-money laundering (AML) regulations. We reserve the right to report suspicious financial activity to relevant authorities and to freeze accounts under investigation.

11.3 You agree to comply with all applicable local, state, national, and international laws in connection with your use of the Service.`,
            },
            {
              title: "12. Account Suspension, Termination & Force Majeure",
              content: `12.1 LinkMe may suspend or terminate your account at any time, with or without notice, for any violation of these Terms. Suspension does not entitle you to a refund of credits or fees.

12.2 Upon termination, your license to use the Service immediately terminates. Sections 6, 8, 9, 10, and all payment obligations survive termination.

12.3 Force Majeure: LinkMe shall not be liable for any failure or delay in performance resulting from causes beyond its reasonable control, including natural disasters, war, terrorism, government actions, pandemics, internet outages, or cyberattacks.

12.4 Account Inactivity: Accounts inactive for 24+ consecutive months may be deactivated. Remaining credits may be forfeited with 30 days' prior email notice.`,
            },
            {
              title: "13. Miscellaneous",
              content: `13.1 Severability: If any provision of these Terms is found unenforceable, it will be modified to the minimum extent necessary and the remaining provisions continue in full force.

13.2 Waiver: Failure to enforce any provision is not a waiver of future enforcement.

13.3 Entire Agreement: These Terms, the Privacy Policy, and Code of Conduct constitute the entire agreement between you and LinkMe regarding the Service and supersede all prior agreements.

13.4 Assignment: You may not assign your rights or obligations under these Terms. LinkMe may freely assign its rights.

13.5 Contact:
LinkMe Inc. â€” Legal Department
legal@LinkMe.com
1234 Platform Way, Wilmington, DE 19801, USA`,
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
