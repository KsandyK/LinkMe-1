import { Link } from "wouter";
import { FileText, Shield, UserCheck, Users, ChevronRight, Mail, Copyright, RotateCcw, Cookie } from "lucide-react";

const LEGAL_DOCS = [
  {
    href: "/legal/terms",
    icon: FileText,
    title: "Terms of Service",
    desc: "Binding agreement governing your use of the platform, credits, content, arbitration clause, and dispute resolution.",
    updated: "May 27, 2026",
    color: "#14b8a6",
  },
  {
    href: "/legal/privacy",
    icon: Shield,
    title: "Privacy Policy",
    desc: "How we collect, use, store, and protect your personal data. Includes full GDPR & CCPA rights.",
    updated: "May 27, 2026",
    color: "#a78bfa",
  },
  {
    href: "/legal/creator",
    icon: UserCheck,
    title: "Creator Agreement",
    desc: "Terms for creators — revenue share tiers, payout conditions, § 2257 compliance, FOSTA-SESTA, NDA.",
    updated: "May 27, 2026",
    color: "#e8a87c",
  },
  {
    href: "/legal/conduct",
    icon: Users,
    title: "Code of Conduct",
    desc: "Community standards, prohibited behaviour, enforcement tiers, and content moderation appeal process.",
    updated: "May 27, 2026",
    color: "#ec4899",
  },
  {
    href: "/legal/dmca",
    icon: Copyright,
    title: "DMCA Policy",
    desc: "Copyright takedown procedures, counter-notification process, and repeat infringer policy.",
    updated: "May 27, 2026",
    color: "#f97316",
  },
  {
    href: "/legal/refund",
    icon: RotateCcw,
    title: "Refund Policy",
    desc: "Eligible refund circumstances, subscription cancellation rules, and how to request a refund.",
    updated: "May 27, 2026",
    color: "#38bdf8",
  },
  {
    href: "/legal/cookies",
    icon: Cookie,
    title: "Cookie Policy",
    desc: "What cookies we use, why we use them, your opt-out options, and GDPR / CCPA cookie rights.",
    updated: "May 27, 2026",
    color: "#f59e0b",
  },
  {
    href: "/legal/community",
    icon: Users,
    title: "Community Guidelines",
    desc: "Plain-language rules for creators and viewers — what's allowed, what's not, and why it matters.",
    updated: "May 27, 2026",
    color: "#8b5cf6",
  },
];

const CONTACTS = [
  { label: "General Support",    email: "support@LinkMe.com" },
  { label: "Legal Department",   email: "legal@LinkMe.com" },
  { label: "Privacy & Data",     email: "privacy@LinkMe.com" },
  { label: "DMCA / Copyright",   email: "dmca@LinkMe.com" },
  { label: "Safety & Reporting", email: "safety@LinkMe.com" },
  { label: "Billing",            email: "billing@LinkMe.com" },
  { label: "Creator Support",    email: "creators@LinkMe.com" },
  { label: "Community & Trust",  email: "community@LinkMe.com" },
  { label: "GDPR — EU",          email: "gdpr@LinkMe.com" },
  { label: "Appeals",            email: "appeals@LinkMe.com" },
  { label: "Compliance (§2257)", email: "compliance@LinkMe.com" },
  { label: "Law Enforcement",    email: "law-enforcement@LinkMe.com" },
];

export default function LegalHub() {
  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "#09091a" }}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-bold tracking-widest mb-3" style={{ color: "#14b8a6" }}>LINKME INC.</p>
          <h1 className="text-4xl font-black text-white mb-2">Legal Centre</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            All legal documents, policies, and contact information in one place.
            Last reviewed: May 27, 2026.
          </p>
        </div>

        {/* Documents */}
        <div className="space-y-3 mb-10">
          {LEGAL_DOCS.map(doc => (
            <Link key={doc.href} href={doc.href}>
              <div className="flex items-center gap-4 p-5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01]"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${doc.color}18`, border: `1px solid ${doc.color}30` }}>
                  <doc.icon className="w-5 h-5" style={{ color: doc.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{doc.title}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{doc.desc}</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>Updated {doc.updated}</p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }} />
              </div>
            </Link>
          ))}
        </div>

        {/* Contact Directory */}
        <div className="p-6 rounded-xl border" style={{ background: "rgba(20,184,166,0.04)", borderColor: "rgba(20,184,166,0.2)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4" style={{ color: "#14b8a6" }} />
            <h2 className="text-sm font-bold text-white">Contact Directory</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CONTACTS.map(c => (
              <div key={c.email} className="flex items-center justify-between gap-2 py-1.5 px-3 rounded-lg"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{c.label}</span>
                <a href={`mailto:${c.email}`} className="text-xs font-mono hover:underline"
                  style={{ color: "#14b8a6" }}>{c.email}</a>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-xs text-center mt-8" style={{ color: "rgba(255,255,255,0.2)" }}>
          © 2026 LinkMe Inc. · 1234 Platform Way, Wilmington, DE 19801, USA
        </p>
      </div>
    </div>
  );
}
