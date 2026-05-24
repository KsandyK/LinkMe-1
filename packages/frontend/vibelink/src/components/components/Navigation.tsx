/**
 * VIBELINK — Navigation Component
 * Velvet Dark Design System
 * Top navigation bar with mobile menu support.
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { Menu, X, Zap, MessageCircle, Users, Radio, ShoppingBag, Crown, User, LayoutDashboard, ChevronDown } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: null },
  { href: "/profiles", label: "Creators", icon: Users },
  { href: "/live", label: "Live", icon: Radio, badge: "LIVE" },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/credits", label: "Credits", icon: Zap },
  { href: "/vip-lounge", label: "VIP", icon: Crown },
];

export function Navigation() {
  const { ageGateAccepted, credits, ageVerificationStatus } = useApp();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  if (!ageGateAccepted) return null;

  return (
    <nav className="sticky top-0 z-50 vl-glass border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="container">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663496736475/iocsuczeEqfyUdtEzAFeTS/vibelink-icon-neUNxmofy3E6uibRvANW8R.webp" alt="VibeLink" className="w-8 h-8" />
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.35rem", fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>VibeLink</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => {
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href}>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${isActive ? "text-white" : "text-gray-400 hover:text-white"}`}
                    style={{ background: isActive ? "rgba(20,184,166,0.12)" : "transparent" }}>
                    {link.icon && <link.icon className="w-3.5 h-3.5" />}
                    {link.label}
                    {link.badge && (
                      <span className="vl-badge-live" style={{ fontSize: "0.55rem", padding: "1px 5px" }}>{link.badge}</span>
                    )}
                    {isActive && <div className="w-1 h-1 rounded-full" style={{ background: "#14b8a6" }} />}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Credits */}
            <Link href="/credits">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold cursor-pointer transition-all duration-200 hover:bg-white/5"
                style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)" }}>
                <Zap className="w-3.5 h-3.5" style={{ color: "#14b8a6" }} />
                <span style={{ color: "#14b8a6", fontFamily: "'DM Mono', monospace" }}>{credits.toLocaleString()}</span>
              </div>
            </Link>

            {/* Verify badge */}
            {ageVerificationStatus !== "verified" && (
              <Link href="/verify-age">
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-200"
                  style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)", color: "#fbbf24" }}>
                  🛡️ Verify Age
                </div>
              </Link>
            )}

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-200 hover:bg-white/5"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white" }}>U</div>
                <ChevronDown className="w-3.5 h-3.5 hidden sm:block" style={{ color: "rgba(255,255,255,0.4)" }} />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl overflow-hidden z-50 animate-fade-up"
                  style={{ background: "#0f1a1a", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
                  {[
                    { href: "/account", label: "My Account", icon: User },
                    { href: "/creator", label: "Creator Dashboard", icon: LayoutDashboard },
                    { href: "/billing", label: "Billing", icon: ShoppingBag },
                    { href: "/become-creator", label: "Become a Creator", icon: Crown },
                  ].map(item => (
                    <Link key={item.href} href={item.href}>
                      <div onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium cursor-pointer transition-all duration-150 hover:bg-white/5"
                        style={{ color: "rgba(255,255,255,0.7)" }}>
                        <item.icon className="w-4 h-4" style={{ color: "#14b8a6" }} />
                        {item.label}
                      </div>
                    </Link>
                  ))}
                  <div className="h-px mx-3 my-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <Link href="/register">
                    <div onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium cursor-pointer transition-all duration-150 hover:bg-white/5"
                      style={{ color: "rgba(255,255,255,0.4)" }}>
                      Sign Out
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-1.5 rounded-lg hover:bg-white/5 transition-all">
              {mobileOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t animate-fade-up" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0a0a14" }}>
          <div className="container py-3 space-y-1">
            {NAV_LINKS.map(link => {
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href}>
                  <div onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
                    style={{ background: isActive ? "rgba(20,184,166,0.1)" : "transparent", color: isActive ? "#14b8a6" : "rgba(255,255,255,0.6)" }}>
                    {link.icon && <link.icon className="w-4 h-4" />}
                    {link.label}
                    {link.badge && <span className="vl-badge-live ml-auto">{link.badge}</span>}
                  </div>
                </Link>
              );
            })}
            <div className="pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 px-3 py-2">
                <Zap className="w-4 h-4" style={{ color: "#14b8a6" }} />
                <span className="text-sm font-bold" style={{ color: "#14b8a6", fontFamily: "'DM Mono', monospace" }}>{credits.toLocaleString()} credits</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
