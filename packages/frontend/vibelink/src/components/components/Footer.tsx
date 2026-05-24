/**
 * VIBELINK — Footer Component
 * Velvet Dark Design System
 * Compliance footer with legal links, 18+ notice, 2257 statement.
 * No CCBill references. No AI watermarks.
 */
import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";

export function Footer() {
  const { ageGateAccepted } = useApp();
  if (!ageGateAccepted) return null;

  return (
    <footer style={{ background: "#070710", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="container py-10">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)" }}>💎</div>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", fontWeight: 700, color: "white" }}>VibeLink</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
              Premium adult live interaction platform. All content is consensual and created by verified adult performers.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="px-2 py-1 rounded text-xs font-bold" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>18+</div>
              <div className="px-2 py-1 rounded text-xs font-bold" style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", color: "#5eead4" }}>🔒 SSL</div>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Platform</h4>
            <ul className="space-y-2">
              {[
                { href: "/profiles", label: "Browse Creators" },
                { href: "/live", label: "Live Streams" },
                { href: "/credits", label: "Credits Store" },
                { href: "/gifts", label: "Gifts" },
                { href: "/vip-lounge", label: "VIP Lounge" },
              ].map(l => (
                <li key={l.href}><Link href={l.href}><span className="text-xs cursor-pointer hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>{l.label}</span></Link></li>
              ))}
            </ul>
          </div>

          {/* Creators */}
          <div>
            <h4 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Creators</h4>
            <ul className="space-y-2">
              {[
                { href: "/become-creator", label: "Become a Creator" },
                { href: "/creator", label: "Creator Dashboard" },
                { href: "/legal/creator-agreement", label: "Creator Agreement" },
                { href: "/boosts", label: "Boost Your Profile" },
              ].map(l => (
                <li key={l.href}><Link href={l.href}><span className="text-xs cursor-pointer hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>{l.label}</span></Link></li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Legal</h4>
            <ul className="space-y-2">
              {[
                { href: "/legal/terms", label: "Terms of Service" },
                { href: "/legal/privacy", label: "Privacy Policy" },
                { href: "/legal/conduct", label: "Code of Conduct" },
                { href: "/legal/2257", label: "18 U.S.C. § 2257" },
                { href: "/legal/dmca", label: "DMCA Policy" },
              ].map(l => (
                <li key={l.href}><Link href={l.href}><span className="text-xs cursor-pointer hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>{l.label}</span></Link></li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2257 Statement */}
        <div className="rounded-xl p-4 mb-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.25)" }}>
            <strong style={{ color: "rgba(255,255,255,0.4)" }}>18 U.S.C. § 2257 Record-Keeping Requirements Compliance Statement:</strong>{" "}
            All models, actors, actresses, and other persons who appear in any visual depiction of actual or simulated sexually explicit conduct appearing or otherwise contained in this website were over the age of eighteen (18) years at the time of the creation of such depictions. Records required by 18 U.S.C. § 2257 are kept by the Custodian of Records at the registered business address. All content on this platform is user-generated and all creators have verified their age and identity prior to posting content.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
            © {new Date().getFullYear()} VibeLink. All rights reserved. For adults 18+ only.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>🔒 Secure & Encrypted</span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>🛡️ Privacy Protected</span>
            <span className="text-xs font-bold" style={{ color: "rgba(239,68,68,0.5)" }}>18+ ONLY</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
