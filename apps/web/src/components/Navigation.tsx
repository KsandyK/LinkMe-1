import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { Menu, X, Zap, Users, Radio, Crown, User, LayoutDashboard, ChevronDown, Shield, MessageCircle, ShoppingBag, Bell, Gift } from "lucide-react";
import { MOCK_PROFILES } from "@/lib/mock-data";
import { isRewardAvailable } from "@/lib/streak";

const LOCAL_CONVS_KEY = "vl_local_convs_v1";
const NOTIFS_SEEN_KEY = "vl_notifs_seen_v1";

interface AppNotif {
  id: string;
  icon: "live" | "message" | "reward";
  title: string;
  sub: string;
  accent: string;
  href: string;
}

function buildNotifs(unread: number, loggedIn: boolean): AppNotif[] {
  const out: AppNotif[] = [];
  // Live creators (from the catalogue's live set) — the core re-engagement pull
  MOCK_PROFILES.filter(p => p.isLive).slice(0, 4).forEach(p => {
    out.push({
      id: `live-${p.username}`,
      icon: "live",
      title: `${p.displayName ?? p.username} is live now`,
      sub: p.location ? `Streaming from ${p.location}` : "Tap to watch",
      accent: "#ef4444",
      href: `/profile/${p.id}`,
    });
  });
  if (unread > 0) {
    out.push({
      id: `msg-${unread}`,
      icon: "message",
      title: `${unread} new message${unread !== 1 ? "s" : ""}`,
      sub: "Creators are waiting to hear back",
      accent: "#14b8a6",
      href: "/messages",
    });
  }
  if (loggedIn && isRewardAvailable()) {
    out.push({
      id: `reward-${new Date().toISOString().slice(0, 10)}`,
      icon: "reward",
      title: "Daily reward ready",
      sub: "Claim your bonus credits on the homepage",
      accent: "#f5a623",
      href: "/",
    });
  }
  return out;
}

function loadSeen(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(NOTIFS_SEEN_KEY) ?? "[]")); } catch { return new Set(); }
}

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
  { href: "/credits",  label: "Store",    icon: ShoppingBag },
  { href: "/vip-lounge", label: "VIP",    icon: Crown },
];

export function Navigation() {
  const { ageGateAccepted, credits, ageVerificationStatus, user, isLoggedIn, logout, showToast } = useApp();
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // ── Notification bell ──────────────────────────────────────────────────────
  const [bellOpen, setBellOpen] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(loadSeen);
  const bellRef = useRef<HTMLDivElement>(null);
  const notifs = buildNotifs(unreadMessages, isLoggedIn);
  const unseenCount = notifs.filter(n => !seen.has(n.id)).length;

  const toggleBell = () => {
    const willOpen = !bellOpen;
    setBellOpen(willOpen);
    if (willOpen && notifs.length > 0) {
      const next = new Set(seen);
      notifs.forEach(n => next.add(n.id));
      setSeen(next);
      try { localStorage.setItem(NOTIFS_SEEN_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
    }
  };

  const openNotif = (href: string) => {
    setBellOpen(false);
    navigate(href);
  };

  // Close the bell dropdown on outside click
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bellOpen]);

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

            {/* Notification bell — only when signed in */}
            {isLoggedIn && (
              <div className="relative" ref={bellRef}>
                <button onClick={toggleBell}
                  className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:bg-white/5"
                  aria-label="Notifications">
                  <Bell className="w-4 h-4" style={{ color: bellOpen ? "#14b8a6" : "rgba(255,255,255,0.6)" }} />
                  {unseenCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-[#09091a]"
                      style={{ background: "#ef4444" }}>
                      {unseenCount}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-80 rounded-xl overflow-hidden z-50 animate-fade-up"
                    style={{ background: "#0f1622", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
                    <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      <span className="text-sm font-bold text-white">Notifications</span>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{notifs.length}</span>
                    </div>
                    {notifs.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-7 h-7 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>You're all caught up</p>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        {notifs.map(n => (
                          <button key={n.id} onClick={() => openNotif(n.href)}
                            className="w-full flex items-start gap-3 px-4 py-3 text-left transition-all hover:bg-white/5 border-b last:border-b-0"
                            style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: `${n.accent}1a`, border: `1px solid ${n.accent}33` }}>
                              {n.icon === "live"    && <Radio className="w-4 h-4" style={{ color: n.accent }} />}
                              {n.icon === "message" && <MessageCircle className="w-4 h-4" style={{ color: n.accent }} />}
                              {n.icon === "reward"  && <Gift className="w-4 h-4" style={{ color: n.accent }} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-white truncate">{n.title}</p>
                              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{n.sub}</p>
                            </div>
                            {n.icon === "live" && (
                              <span className="vl-badge-live flex items-center gap-1 mt-1 flex-shrink-0">
                                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />LIVE
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    <Link href="/live">
                      <div onClick={() => setBellOpen(false)}
                        className="px-4 py-2.5 text-center text-xs font-semibold cursor-pointer transition-all hover:bg-white/5 border-t"
                        style={{ color: "#14b8a6", borderColor: "rgba(255,255,255,0.06)" }}>
                        View all live streams →
                      </div>
                    </Link>
                  </div>
                )}
              </div>
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
                      // Staff-only: link to the admin hub (queues + tools).
                      ...(user?.role === "ADMIN" || user?.role === "MODERATOR"
                        ? [{ href: "/admin", label: "Admin", icon: Shield }]
                        : [{ href: "/become-creator", label: "Become a Cravr", icon: Crown }]),
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
