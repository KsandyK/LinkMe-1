import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";

export function Footer() {
  const { ageGateAccepted } = useApp();
  if (!ageGateAccepted) return null;

  return (
    <footer style={{ background: "#070710", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/vibelink-icon.png" alt="CRAVR" className="w-6 h-6" />
              <span className="font-bold text-white">CRAVR</span>
            </div>
            <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
              Premium adult live interaction platform. All content is consensual and created by verified adult performers.
            </p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}>18+</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", color: "#5eead4" }}>🔒 SSL</span>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>Platform</h4>
            <ul className="space-y-2">
              {[
                { href: "/profiles", label: "Browse Creators" },
                { href: "/live", label: "Live Streams" },
                { href: "/credits", label: "Credits Store" },
                { href: "/gifts", label: "Gifts" },
                { href: "/vip-lounge", label: "VIP Lounge" },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href}>
                    <span className="text-xs cursor-pointer transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Creators */}
          <div>
            <h4 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>Creators</h4>
            <ul className="space-y-2">
              {[
                { href: "/become-creator", label: "Become a Creator" },
                { href: "/creator", label: "Creator Dashboard" },
                { href: "/boosts", label: "Boost Your Profile" },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href}>
                    <span className="text-xs cursor-pointer transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>Legal</h4>
            <Link href="/legal">
              <span className="text-xs cursor-pointer transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Legal Centre</span>
            </Link>
          </div>
        </div>

        {/* 2257 Statement */}
        <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.22)" }}>
            <strong style={{ color: "rgba(255,255,255,0.38)" }}>18 U.S.C. § 2257 Record-Keeping Requirements Compliance Statement:</strong>{" "}
            All models, actors, actresses, and other persons who appear in any visual depiction of actual or simulated sexually explicit conduct appearing or otherwise contained in this website were over the age of eighteen (18) years at the time of the creation of such depictions. Records required by 18 U.S.C. § 2257 are kept by the Custodian of Records at the registered business address.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
            © {new Date().getFullYear()} CRAVR. All rights reserved. For adults 18+ only.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>🔒 Secure & Encrypted</span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>🛡️ Privacy Protected</span>
            <span className="text-xs font-bold" style={{ color: "rgba(239,68,68,0.45)" }}>18+ ONLY</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
