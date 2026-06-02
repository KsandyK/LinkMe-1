import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { Menu, X, Zap, Users, Radio, Crown, User, LayoutDashboard, ChevronDown, Shield, MessageCircle } from "lucide-react";

const LOCAL_CONVS_KEY = "vl_local_convs_v1";

function getUnreadCount(): number {
  try {
    const convs: { lastReadAt: string | null; lastMessage: { createdAt: string; senderId?: string } | null }[] =
      JSON.parse(localStorage.getItem(LOCAL_CONVS_KEY) ?? "[]");
    const userId = (() => { try { return JSON.parse(localStorage.getItem("cravr_user") ?? "{}").id ?? null; } catch { return null; } })();
    return convs.filter(c => {
      if (!c.lastMessage) return false;
      // Don't count messages the current user sent themselves
      if (userId && c.lastMessage.senderId === userId) return false;
      if (!c.lastReadAt) return true;
      return new Date(c.lastMessage.createdAt) > new Date(c.lastReadAt);
    }).length;
  } catch {
    return 0;
  }
}

const NAV_LINKS = [
  { href: "/profiles", label: "Creators", icon: Users },
  { href: "/live",     label: "Live",     icon: Radio, badge: "LIVE" },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/credits",  label: "Credits",  icon: Zap   },
  { href: "/vip-lounge", label: "VIP",    icon: Crown },
];

export function Navigation() {
  const { ageGateAccepted, credits, ageVerificationStatus, user, isLoggedIn, logout, showToast } = useApp();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Refresh unread count on route change and on a 30s poll
  useEffect(() => {
    setUnreadMessages(getUnreadCount());
    const id = setInterval(() => setUnreadMessages(getUnreadCount()), 30_000);
    return () => clearInterval(id);
  }, [location]);

  const handleSignOut = () => {
    setUserMenuOpen(false);
    logout();
    showToast({ title: "Signed out", description: "You have been signed out successfully." });
    // Hard navigation to register screen — guarantees all in-memory state is reset
    window.location.href = "/register";
  };

  if (!ageGateAccepted) return null;

  return (
    <nav className="sticky top-0 z-50" style={{ background: "rgba(9,9,26,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="container">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <img src="/Cravr.jpg" alt="CRAVR" className="w-8 h-8 rounded-full object-cover" style={{ objectPosition: "center 20%" }} />
              <span className="font-bold text-lg text-white tracking-tight">CRAVR</span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(link => {
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
              const hasUnread = link.href === "/messages" && unreadMessages > 0;
              return (
                <Link key={link.href} href={link.href}>
                  <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${isActive ? "text-white bg-white/8" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                    <span className="relative">
                      <link.icon className="w-3.5 h-3.5" />
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 border border-[#09091a]" />
                      )}
                    </span>
                    {link.label}
                    {hasUnread && (
                      <span className="text-xs font-bold px-1 py-0 rounded-full"
                        style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", fontSize: "0.6rem" }}>
                        {unreadMessages}
                      </span>
                    )}
                    {link.badge && (
                      <span className={link.badge === "LIVE" ? "vl-badge-live" : undefined}
                        style={link.badge === "NEW"
                          ? { fontSize: "0.55rem", padding: "1px 4px", borderRadius: "4px", background: "rgba(139,92,246,0.3)", color: "#a78bfa", fontWeight: 700, lineHeight: 1.4 }
                          : { fontSize: "0.55rem", padding: "1px 4px" }}>
                        {link.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Credits pill — only when signed in */}
            {isLoggedIn && (
              <Link href="/credits">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold cursor-pointer transition-all hover:bg-white/5"
                  style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)" }}>
                  <Zap className="w-3.5 h-3.5" style={{ color: "#14b8a6" }} />
                  <span style={{ color: "#14b8a6", fontFamily: "monospace" }}>{credits.toLocaleString()}</span>
                </div>
              </Link>
            )}

            {/* Verify Age — only when signed in and not yet verified */}
            {isLoggedIn && ageVerificationStatus !== "verified" && (
              <Link href="/verify-age">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all"
                  style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.25)", color: "#5eead4" }}>
                  <Shield className="w-3.5 h-3.5" />
                  Verify Age
                </div>
              </Link>
            )}

            {isLoggedIn ? (
              /* Signed-in user menu */
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all hover:bg-white/5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white" }}>
                    {user?.username?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 hidden sm:block" style={{ color: "rgba(255,255,255,0.35)" }} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl overflow-hidden z-50 animate-fade-up"
                    style={{ background: "#0f1622", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
                    {[
                      { href: "/account", label: "My Account", icon: User },
                      { href: "/creator", label: "Creator Dashboard", icon: LayoutDashboard },
                      { href: "/become-creator", label: "Become a Cravr", icon: Crown },
                    ].map(item => (
                      <Link key={item.href} href={item.href}>
                        <div onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium cursor-pointer transition-all hover:bg-white/5"
                          style={{ color: "rgba(255,255,255,0.7)" }}>
                          <item.icon className="w-4 h-4" style={{ color: "#14b8a6" }} />
                          {item.label}
                        </div>
                      </Link>
                    ))}
                    <div className="h-px mx-3 my-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium cursor-pointer transition-all hover:bg-white/5"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Signed-out — explicit Sign In / Register, no fake account */
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login">
                  <div className="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-white/5"
                    style={{ color: "rgba(255,255,255,0.7)" }}>
                    Sign In
                  </div>
                </Link>
                <Link href="/register">
                  <div className="px-3.5 py-1.5 rounded-lg text-sm font-bold cursor-pointer transition-all"
                    style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white" }}>
                    Register
                  </div>
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
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
              const hasUnread = link.href === "/messages" && unreadMessages > 0;
              return (
                <Link key={link.href} href={link.href}>
                  <div onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all"
                    style={{ background: isActive ? "rgba(20,184,166,0.08)" : "transparent", color: isActive ? "#14b8a6" : "rgba(255,255,255,0.6)" }}>
                    <span className="relative">
                      <link.icon className="w-4 h-4" />
                      {hasUnread && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 border border-[#0a0a14]" />}
                    </span>
                    {link.label}
                    {hasUnread && (
                      <span className="ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
                        {unreadMessages}
                      </span>
                    )}
                    {link.badge && <span className="vl-badge-live ml-auto">{link.badge}</span>}
                  </div>
                </Link>
              );
            })}
            <div className="pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {isLoggedIn ? (
                <div className="flex items-center gap-2 px-3 py-2">
                  <Zap className="w-4 h-4" style={{ color: "#14b8a6" }} />
                  <span className="text-sm font-bold font-mono" style={{ color: "#14b8a6" }}>{credits.toLocaleString()} credits</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2">
                  <Link href="/login">
                    <div onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium cursor-pointer"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)" }}>
                      Sign In
                    </div>
                  </Link>
                  <Link href="/register">
                    <div onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-bold cursor-pointer"
                      style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "white" }}>
                      Register
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
