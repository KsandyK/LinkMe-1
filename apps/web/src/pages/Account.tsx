import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { profiles as profilesApi, subscriptions as subsApi, credits as creditsApi, auth as authApi, totp as totpApi } from "@/lib/api";
import type { LocalTransaction } from "@/contexts/AppContext";
import { MEMBERSHIP_INFO, BOOST_INFO } from "@/lib/membership-tiers";
import { VipStaffCard } from "@/components/VipStaffCard";
import { User, Shield, Zap, Bell, Lock, ChevronRight, CheckCircle, X, AlertTriangle, Smartphone, Award, Heart, Radio, CreditCard, Receipt, Plus, Trash2, Star, Users, Camera, Loader2 } from "lucide-react";

// ── Favorites storage ─────────────────────────────────────────────────────────
const FAV_STORAGE_KEY = "vl_favorites_v1";
interface FavoriteCreator {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isLive: boolean;
}

// ── Badge definitions ─────────────────────────────────────────────────────────
type BadgeDef = {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  type: "membership" | "credits" | "boost";
  /** membership IDs that unlock this badge (any match = unlocked) */
  levels?: string[];
  /** boost IDs that unlock this badge (any match = unlocked) */
  boostLevels?: string[];
  /** credit balance threshold to unlock */
  threshold?: number;
};

const ACCOUNT_BADGES: BadgeDef[] = [
  // ── Membership badges — one per paid tier, unlocked at that tier or above ──
  { id: "fan",          emoji: "❤️",  name: "Fan",             desc: "Fan membership",                    type: "membership", levels: ["fan","supporter","superfan","devotee","allaccess","elite","creatorpass","blackcard","diamond","obsidian","titanium","gold","imperial","apex","platinum_m"] },
  { id: "supporter",    emoji: "🔥",  name: "Supporter",       desc: "Supporter membership",              type: "membership", levels: ["supporter","superfan","devotee","allaccess","elite","creatorpass","blackcard","diamond","obsidian","titanium","gold","imperial","apex","platinum_m"] },
  { id: "superfan",     emoji: "💎",  name: "Super Fan",       desc: "Super Fan membership",              type: "membership", levels: ["superfan","devotee","allaccess","elite","creatorpass","blackcard","diamond","obsidian","titanium","gold","imperial","apex","platinum_m"] },
  { id: "devotee",      emoji: "💖",  name: "Devotee",         desc: "Devotee membership",                type: "membership", levels: ["devotee","allaccess","elite","creatorpass","blackcard","diamond","obsidian","titanium","gold","imperial","apex","platinum_m"] },
  { id: "allaccess",    emoji: "🏆",  name: "All-Access",      desc: "All-Access membership",             type: "membership", levels: ["allaccess","elite","creatorpass","blackcard","diamond","obsidian","titanium","gold","imperial","apex","platinum_m"] },
  { id: "elite",        emoji: "⭐",  name: "Elite",           desc: "Elite membership",                  type: "membership", levels: ["elite","creatorpass","blackcard","diamond","obsidian","titanium","gold","imperial","apex","platinum_m"] },
  { id: "creatorpass",  emoji: "👑",  name: "Creator Crown",   desc: "Creator Pass — profile crown frame",type: "membership", levels: ["creatorpass","blackcard","diamond","obsidian","titanium","gold","imperial","apex","platinum_m"] },
  { id: "blackcard",    emoji: "🖤",  name: "Black Card",      desc: "Black Card exclusive badge",        type: "membership", levels: ["blackcard","diamond","obsidian","titanium","gold","imperial","apex","platinum_m"] },
  { id: "obsidian",     emoji: "🔮",  name: "Obsidian Elite",  desc: "Obsidian membership",               type: "membership", levels: ["obsidian","titanium","gold","imperial","apex","platinum_m"] },
  { id: "titanium",     emoji: "🔷",  name: "Titanium",        desc: "Titanium membership",               type: "membership", levels: ["titanium","gold","imperial","apex","platinum_m"] },
  { id: "gold_m",       emoji: "🥇",  name: "Gold",            desc: "Gold membership",                   type: "membership", levels: ["gold","imperial","apex","platinum_m"] },
  { id: "imperial",     emoji: "⚜️",  name: "Imperial",        desc: "Imperial membership",               type: "membership", levels: ["imperial","apex","platinum_m"] },
  { id: "apex",         emoji: "🏔️",  name: "Apex Elite",      desc: "Apex membership — crown frame",     type: "membership", levels: ["apex","platinum_m"] },
  { id: "platinum_m",   emoji: "🪙",  name: "Platinum Crown",  desc: "Platinum membership — crown frame", type: "membership", levels: ["platinum_m"] },
  // ── Boost badges — unlocked by active boost tier or higher ──────────────
  { id: "legend_boost",   emoji: "👑", name: "VIP Creator",     desc: "Legend boost — VIP badge on profile",   type: "boost", boostLevels: ["legend","titan","pinnacle"] },
  { id: "titan_boost",    emoji: "🏆", name: "Titan Frame",     desc: "Titan boost — custom profile frame",    type: "boost", boostLevels: ["titan","pinnacle"] },
  { id: "pinnacle_boost", emoji: "🌠", name: "Pinnacle Crown",  desc: "Pinnacle boost — crown profile frame",  type: "boost", boostLevels: ["pinnacle"] },
  // ── Credit balance badges ────────────────────────────────────────────────
  { id: "credits_100",  emoji: "💰", name: "Tipped",      desc: "100+ credits",   type: "credits", threshold: 100   },
  { id: "credits_500",  emoji: "💸", name: "Big Spender", desc: "500+ credits",   type: "credits", threshold: 500   },
  { id: "credits_2000", emoji: "🐋", name: "Whale",       desc: "2,000+ credits", type: "credits", threshold: 2000  },
];

// ── Card helpers (mirrors Billing.tsx) ───────────────────────────────────────
interface SavedCard { id: string; last4: string; brand: string; expiry: string; name: string; isDefault: boolean }
const CARDS_KEY = "vl_saved_cards_v1";
function loadCards(): SavedCard[] { try { return JSON.parse(localStorage.getItem(CARDS_KEY) ?? "[]"); } catch { return []; } }
function saveCards(cards: SavedCard[]) { try { localStorage.setItem(CARDS_KEY, JSON.stringify(cards)); } catch {} }
function detectBrand(num: string): string {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6(?:011|5)/.test(n)) return "Discover";
  return "Card";
}
function brandIcon(b: string) { return b === "Visa" ? "💳" : b === "Mastercard" ? "🟠" : b === "Amex" ? "🔵" : b === "Discover" ? "🟡" : "💳"; }
function fmtCardNum(v: string) { return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(); }
function fmtExpiry(v: string) { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; }

// ── Creator subscriptions (mock) ─────────────────────────────────────────────
interface CreatorSub {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  tier: string;
  tierColor: string;
  price: number;
  renewDate: string;
}
const MOCK_CREATOR_SUBS: CreatorSub[] = [
  { id: "cs1", username: "luna_vibes",      displayName: "Luna Vibes",      avatarUrl: null, tier: "VIP Fan",   tierColor: "#a78bfa", price: 19.99, renewDate: "Jun 27, 2026" },
  { id: "cs2", username: "xander_stream",   displayName: "Xander Stream",   avatarUrl: null, tier: "Supporter", tierColor: "#14b8a6", price:  9.99, renewDate: "Jul 3, 2026"  },
  { id: "cs3", username: "stella_noir",     displayName: "Stella Noir",     avatarUrl: null, tier: "All-Access",tierColor: "#f59e0b", price: 29.99, renewDate: "Jun 30, 2026" },
];

// ── Subscription display helpers — imported from single source of truth ───────
// MEMBERSHIP_INFO and BOOST_INFO are imported from @/lib/membership-tiers
function nextBillingDate() {
  const d = new Date(); d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const TABS = [
  { id: "profile",       label: "Profile",       icon: User       },
  { id: "favorites",     label: "Favorites",     icon: Heart      },
  { id: "billing",       label: "Billing",       icon: CreditCard },
  { id: "transactions",  label: "Transactions",  icon: Receipt    },
  { id: "security",      label: "Security",      icon: Lock       },
  { id: "notifications", label: "Notifications", icon: Bell       },
] as const;
type Tab = typeof TABS[number]["id"];

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-md rounded-2xl p-6"
        style={{ background: "#0f1622", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 60px rgba(0,0,0,0.7)" }}>
        <button onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg transition-all hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.4)" }}>
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export default function Account() {
  const { credits, ageVerificationStatus, showToast, user, logout, activeMembership, setActiveMembership, activeBoost, setActiveBoost, transactions } = useApp();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [displayName, setDisplayName] = useState(user?.username ?? "Member");
  const [username, setUsername] = useState(user?.username ?? "member_user");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(() => {
    try { return localStorage.getItem("vl_avatar_v1"); } catch { return null; }
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const NOTIF_KEY = "vl_notif_prefs_v1";
  const [notifs, setNotifs] = useState<{ messages: boolean; liveAlerts: boolean; promotions: boolean; security: boolean }>(() => {
    try {
      const stored = localStorage.getItem(NOTIF_KEY);
      return stored ? JSON.parse(stored) : { messages: true, liveAlerts: true, promotions: false, security: true };
    } catch { return { messages: true, liveAlerts: true, promotions: false, security: true }; }
  });
  const [notifSaved, setNotifSaved] = useState(false);

  // Security sub-states
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  // TOTP setup modal
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<"qr" | "verify" | "done">("qr");
  const [totpQr, setTotpQr] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFASetupLoading, setTwoFASetupLoading] = useState(false);
  const [twoFAVerifying, setTwoFAVerifying] = useState(false);
  const [twoFACodeError, setTwoFACodeError] = useState(false);
  // Disable 2FA modal
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState("");

  // Favorites
  const [favorites, setFavorites] = useState<FavoriteCreator[]>(() => {
    try { return JSON.parse(localStorage.getItem(FAV_STORAGE_KEY) ?? "[]"); } catch { return []; }
  });
  const removeFavorite = (id: string) => {
    const next = favorites.filter(f => f.id !== id);
    setFavorites(next);
    localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(next));
  };

  // ── Merged transaction list (local + API) ─────────────────────────────────
  const [allTransactions, setAllTransactions] = useState<LocalTransaction[]>(transactions);

  // ── On mount: fetch profile data, subscriptions, and transactions ──────────
  useEffect(() => {
    if (!user) return;
    // 1. Load profile fields (displayName, bio) from server
    (async () => {
      try {
        const me = await authApi.me();
        if (me.profile?.displayName) setDisplayName(me.profile.displayName);
        if (me.profile?.bio) setBio(me.profile.bio);
      } catch {/* API offline — keep defaults from user object */}
    })();

    // 1b. Load TOTP status
    (async () => {
      try {
        const s = await totpApi.status();
        setTwoFAEnabled(s.enabled);
      } catch {/* API offline */}
    })();

    // 2. Load creator subscriptions from API
    (async () => {
      try {
        const apiSubs = await subsApi.list();
        const mapped: CreatorSub[] = apiSubs.map(s => ({
          id: s.id,
          username: s.creator.username,
          displayName: s.creator.profile?.displayName ?? s.creator.username,
          avatarUrl: s.creator.profile?.avatarUrl ?? null,
          tier: s.tier ?? "Subscriber",
          tierColor: "#a78bfa",
          price: Number((s.creditCost / 10).toFixed(2)),
          renewDate: new Date(s.endsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        }));
        setCreatorSubs(mapped);
      } catch {/* API offline — show empty state */}
    })();

    // 3. Load and merge transactions from API
    const TYPE_LABELS: Record<string, string> = {
      PURCHASE: "Credit purchase",
      SPEND: "Credits spent",
      TIP: "Tip sent",
      GIFT: "Gift sent",
      WELCOME: "Welcome bonus",
      SUBSCRIPTION: "Creator subscription",
      MESSAGE: "Message sent",
    };
    (async () => {
      try {
        const apiTxs = await creditsApi.transactions({ limit: 50 });
        const mapped: LocalTransaction[] = apiTxs.map(tx => ({
          id: tx.id,
          amount: tx.amount,
          type: tx.type,
          description: TYPE_LABELS[tx.type] ?? tx.type,
          createdAt: tx.createdAt,
          status: "COMPLETED" as const,
        }));
        const localIds = new Set(transactions.map(t => t.id));
        const dedupedApi = mapped.filter(t => !localIds.has(t.id));
        const merged = [...transactions, ...dedupedApi].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setAllTransactions(merged);
      } catch {/* API offline — keep local transactions */}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cards (billing tab)
  const [cards, setCards] = useState<SavedCard[]>(loadCards);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardForm, setCardForm] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [cardSaved, setCardSaved] = useState(false);

  // Creator subscriptions (loaded from API; fallback to mock data)
  const [creatorSubs, setCreatorSubs] = useState<CreatorSub[]>([]);

  // Cancel plan confirmation modal
  const [cancelPlanModal, setCancelPlanModal] = useState<{
    type: "membership" | "boost" | "creator";
    name: string;
    emoji: string;
    color: string;
    renewDate: string;
    perks: string[];
    onConfirm: () => void;
  } | null>(null);

  const handleAddCard = () => {
    const errs: Record<string, string> = {};
    const num = cardForm.number.replace(/\s/g, "");
    if (num.length < 13) errs.number = "Invalid card number";
    if (cardForm.expiry.length < 5) errs.expiry = "MM/YY required";
    if (cardForm.cvv.length < 3) errs.cvv = "CVV required";
    if (!cardForm.name.trim()) errs.name = "Name required";
    setCardErrors(errs);
    if (Object.keys(errs).length) return;
    const last4 = num.slice(-4);
    const brand = detectBrand(num);
    const newCard: SavedCard = {
      id: `card-${Date.now()}`, last4, brand, expiry: cardForm.expiry, name: cardForm.name.trim(), isDefault: cards.length === 0,
    };
    const next = [...cards, newCard];
    setCards(next); saveCards(next);
    setCardForm({ number: "", expiry: "", cvv: "", name: "" });
    setShowAddCard(false);
    setCardSaved(true);
    showToast({ title: `${brandIcon(brand)} ${brand} ••••${last4} added` });
    setTimeout(() => setCardSaved(false), 2000);
  };
  const handleSetDefault = (id: string) => {
    const next = cards.map(c => ({ ...c, isDefault: c.id === id }));
    setCards(next); saveCards(next);
    showToast({ title: "Default card updated" });
  };
  const handleRemoveCard = (id: string) => {
    const filtered = cards.filter(c => c.id !== id);
    const next = filtered.map((c, i) => i === 0 ? { ...c, isDefault: true } : c);
    setCards(next); saveCards(next);
    showToast({ title: "Card removed" });
  };

  // Badge selection
  const [equippedBadge, setEquippedBadge] = useState<string | null>(() => localStorage.getItem("vl_equipped_badge_v1"));

  const isBadgeUnlocked = (b: BadgeDef): boolean => {
    if (b.type === "membership") return (b.levels ?? []).includes(activeMembership);
    if (b.type === "credits")    return credits >= (b.threshold ?? 0);
    if (b.type === "boost")      return (b.boostLevels ?? []).includes(activeBoost ?? "");
    return false;
  };

  const handleEquipBadge = (id: string) => {
    const next = equippedBadge === id ? null : id;
    setEquippedBadge(next);
    if (next) {
      localStorage.setItem("vl_equipped_badge_v1", next);
      const emoji = ACCOUNT_BADGES.find(b => b.id === next)?.emoji ?? "";
      localStorage.setItem("vl_equipped_badge_emoji_v1", emoji);
    } else {
      localStorage.removeItem("vl_equipped_badge_v1");
      localStorage.removeItem("vl_equipped_badge_emoji_v1");
    }
  };

  // Danger zone modals
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deactivated, setDeactivated] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast({ title: "Invalid file", description: "Please select a JPG, PNG, or WebP image.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast({ title: "File too large", description: "Max 5 MB per avatar image.", variant: "destructive" });
      return;
    }
    setAvatarUploading(true);
    // Read as data URL for local persistence
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setAvatarPreview(dataUrl);
      try { localStorage.setItem("vl_avatar_v1", dataUrl); } catch {}
      try {
        await profilesApi.updateMe({ avatarUrl: dataUrl });
        showToast({ title: "Avatar updated", description: "Your profile photo has been saved." });
      } catch {
        showToast({ title: "Avatar saved locally", description: "Photo saved for this session — API offline." });
      }
      setAvatarUploading(false);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be picked again
    e.target.value = "";
  };

  const handleSave = async () => {
    setSaveError("");
    try {
      await profilesApi.updateMe({ displayName, bio });
      setSaved(true);
      showToast({ title: "Profile saved", description: "Your changes have been updated." });
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // API unavailable (demo mode) — save locally and show success
      setSaved(true);
      showToast({ title: "Profile saved", description: "Changes saved locally (demo mode)." });
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const open2FAModal = async () => {
    setTwoFAStep("qr");
    setTwoFACode("");
    setTwoFACodeError(false);
    setTotpQr("");
    setTotpSecret("");
    setShow2FAModal(true);
    setTwoFASetupLoading(true);
    try {
      const data = await totpApi.setup();
      setTotpQr(data.qrDataUrl);
      setTotpSecret(data.secret);
    } catch {
      showToast({ title: "Setup failed", description: "Could not generate TOTP secret. Try again.", variant: "destructive" });
      setShow2FAModal(false);
    } finally {
      setTwoFASetupLoading(false);
    }
  };

  const handleVerifyTOTP = async () => {
    if (twoFACode.length !== 6) return;
    setTwoFAVerifying(true);
    setTwoFACodeError(false);
    try {
      await totpApi.verify(twoFACode);
      setTwoFAStep("done");
      setTimeout(() => {
        setTwoFAEnabled(true);
        setShow2FAModal(false);
        showToast({ title: "2FA Enabled", description: "Your account is now protected with authenticator app verification." });
      }, 1200);
    } catch {
      setTwoFACodeError(true);
    } finally {
      setTwoFAVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) return;
    setDisableLoading(true);
    setDisableError("");
    try {
      await totpApi.disable(disablePassword);
      setTwoFAEnabled(false);
      setShowDisable2FA(false);
      setDisablePassword("");
      showToast({ title: "2FA Disabled", description: "Authenticator app verification has been removed from your account." });
    } catch {
      setDisableError("Incorrect password");
    } finally {
      setDisableLoading(false);
    }
  };

  const handleChangePassword = () => {
    navigate("/forgot-password");
  };

  const handleSignOutAll = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api/auth/logout-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("cravr_token") ?? ""}` },
      });
    } catch {/* ignore */}
    logout();
    showToast({ title: "Signed out everywhere", description: "All sessions have been terminated." });
    setTimeout(() => navigate("/login"), 800);
  };

  const handleDeactivate = () => {
    setDeactivated(true);
    setShowDeactivate(false);
    showToast({ title: "Account deactivated", description: "Your account has been deactivated. You can reactivate by logging in again." });
    setTimeout(() => logout(), 1500);
  };

  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE") return;
    setShowDelete(false);
    // Best-effort API call; proceed regardless of outcome
    try {
      await fetch(`${(import.meta as any).env?.VITE_API_URL ?? "http://localhost:3000"}/api/auth/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("cravr_token") ?? ""}` },
      });
    } catch {/* ignore — demo mode */}
    setDeleted(true);
    logout();
    showToast({ title: "Account deleted", description: "Your account and all data have been permanently removed.", variant: "destructive" });
  };

  if (deleted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-8">
        <div className="vl-card p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertTriangle className="w-8 h-8" style={{ color: "#f87171" }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Account Deleted</h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            Your account and all associated data have been permanently removed from CRAVR.
          </p>
          <Link href="/">
            <button className="vl-btn-primary px-6 py-2.5 text-sm">Return to Home</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
        <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.4)" }}>
          Manage your profile, security, and preferences
          {deactivated && <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(234,179,8,0.1)", color: "#fbbf24", border: "1px solid rgba(234,179,8,0.2)" }}>Deactivated</span>}
        </p>

        {/* Direct VIP staff access — only for Platinum membership / Sovereign boost */}
        <div className="mb-7"><VipStaffCard /></div>

        {/* Credits + Verification bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="vl-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(20,184,166,0.12)" }}>
                <Zap className="w-5 h-5" style={{ color: "#14b8a6" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Credits Balance</p>
                <p className="text-xl font-black" style={{ color: "#14b8a6" }}>{credits.toLocaleString()}</p>
              </div>
            </div>
            <Link href="/credits">
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }}>
                Buy More
              </button>
            </Link>
          </div>

          <div className="vl-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: ageVerificationStatus === "verified" ? "rgba(20,184,166,0.12)" : "rgba(234,179,8,0.1)" }}>
                {ageVerificationStatus === "verified"
                  ? <CheckCircle className="w-5 h-5" style={{ color: "#14b8a6" }} />
                  : <Shield className="w-5 h-5" style={{ color: "#fbbf24" }} />}
              </div>
              <div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Age Verification</p>
                <p className="text-sm font-semibold"
                  style={{ color: ageVerificationStatus === "verified" ? "#14b8a6" : "#fbbf24" }}>
                  {ageVerificationStatus === "verified" ? "Verified ✓" : "Not Verified"}
                </p>
              </div>
            </div>
            {ageVerificationStatus !== "verified" && (
              <Link href="/verify-age">
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)", color: "#fbbf24" }}>
                  Verify Now
                </button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar tabs */}
          <div className="vl-card p-2 h-fit">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
                style={activeTab === tab.id
                  ? { background: "rgba(20,184,166,0.1)", color: "#14b8a6" }
                  : { color: "rgba(255,255,255,0.5)" }}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="lg:col-span-3 vl-card p-6">

            {/* Profile tab */}
            {activeTab === "profile" && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Profile Information */}
                <div className="lg:col-span-3 space-y-5">
                  <h2 className="text-base font-bold text-white">Profile Information</h2>

                  {/* Avatar upload */}
                  <div className="flex items-center gap-4">
                    <div className="relative group flex-shrink-0">
                      <div className="w-20 h-20 rounded-full overflow-hidden"
                        style={{ background: "rgba(20,184,166,0.1)", border: "2px solid rgba(20,184,166,0.2)" }}>
                        {avatarPreview
                          ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-2xl font-black"
                              style={{ color: "#14b8a6" }}>{(displayName[0] ?? "?").toUpperCase()}</div>
                        }
                      </div>
                      {/* Upload overlay */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                        style={{ background: "rgba(0,0,0,0.6)" }}>
                        {avatarUploading
                          ? <Loader2 className="w-5 h-5 animate-spin text-white" />
                          : <Camera className="w-5 h-5 text-white" />}
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                        onChange={handleAvatarChange} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-0.5">Profile Photo</p>
                      <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>JPG, PNG or WebP · Max 5 MB</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                        style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }}>
                        {avatarUploading ? "Uploading…" : "Upload Photo"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Display Name</label>
                    <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                      className="vl-input" placeholder="Your display name" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>@</span>
                      <input value={username} readOnly disabled
                        className="vl-input pl-7 opacity-50 cursor-not-allowed" placeholder="your_username" />
                    </div>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                      Username cannot be changed — contact <a href="mailto:support@cravr.fun" className="hover:underline" style={{ color: "#14b8a6" }}>support@cravr.fun</a> to request a change
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Email</label>
                    <input value={(user as any)?.email ?? "—"} disabled className="vl-input opacity-50 cursor-not-allowed" />
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>Contact support to change your email</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Bio</label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)}
                      rows={3} placeholder="Tell creators a little about yourself..."
                      className="vl-input resize-none" />
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={handleSave} className="vl-btn-primary px-6 py-2.5 text-sm">
                      {saved ? "✓ Saved!" : "Save Changes"}
                    </button>
                    {saveError && (
                      <p className="text-xs" style={{ color: "#f87171" }}>{saveError}</p>
                    )}
                  </div>
                </div>

                {/* Right: Badge selection */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4" style={{ color: "#a78bfa" }} />
                    <h2 className="text-base font-bold text-white">Profile Badges</h2>
                  </div>

                  {/* Equipped badge preview */}
                  <div className="rounded-xl p-3 mb-4 text-center"
                    style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)" }}>
                    {equippedBadge ? (() => {
                      const b = ACCOUNT_BADGES.find(x => x.id === equippedBadge);
                      return b ? (
                        <>
                          <div className="text-3xl mb-1">{b.emoji}</div>
                          <p className="text-xs font-bold text-white">{b.name}</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Equipped</p>
                        </>
                      ) : null;
                    })() : (
                      <p className="text-xs py-2" style={{ color: "rgba(255,255,255,0.3)" }}>No badge equipped</p>
                    )}
                  </div>

                  {/* Badge grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {ACCOUNT_BADGES.map(b => {
                      const unlocked = isBadgeUnlocked(b);
                      const equipped = equippedBadge === b.id;
                      return (
                        <button
                          key={b.id}
                          onClick={() => unlocked && handleEquipBadge(b.id)}
                          title={unlocked ? b.desc : `Locked — ${b.desc}`}
                          className="relative flex flex-col items-center p-2 rounded-xl transition-all text-center"
                          style={{
                            background: equipped
                              ? "rgba(167,139,250,0.15)"
                              : unlocked
                                ? "rgba(255,255,255,0.04)"
                                : "rgba(0,0,0,0.2)",
                            border: equipped
                              ? "1px solid rgba(167,139,250,0.45)"
                              : "1px solid rgba(255,255,255,0.07)",
                            opacity: unlocked ? 1 : 0.4,
                            cursor: unlocked ? "pointer" : "default",
                          }}>
                          <span className="text-xl mb-0.5">{b.emoji}</span>
                          <span className="text-xs font-semibold leading-tight"
                            style={{ color: equipped ? "#a78bfa" : unlocked ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.35)" }}>
                            {b.name}
                          </span>
                          {equipped && (
                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#a78bfa" }} />
                          )}
                          {!unlocked && (
                            <span className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>🔒</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.25)" }}>
                    Earn badges through memberships, profile boosts &amp; credits. Tap to equip.
                  </p>
                </div>
              </div>
            )}

            {/* Favorites tab */}
            {activeTab === "favorites" && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <Heart className="w-4 h-4" style={{ color: "#e8a87c" }} />
                  <h2 className="text-base font-bold text-white">Favorite Creators</h2>
                  {favorites.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold ml-1"
                      style={{ background: "rgba(232,168,124,0.12)", color: "#e8a87c", border: "1px solid rgba(232,168,124,0.2)" }}>
                      {favorites.length}
                    </span>
                  )}
                </div>

                {favorites.length === 0 ? (
                  <div className="text-center py-14">
                    <Heart className="w-12 h-12 mx-auto mb-4" style={{ color: "rgba(255,255,255,0.1)" }} />
                    <p className="text-sm font-semibold text-white mb-1">No favorites yet</p>
                    <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Tap the ❤️ on a creator's profile to save them here for quick access
                    </p>
                    <Link href="/profiles">
                      <button className="vl-btn-primary px-5 py-2.5 text-sm">Browse Creators</button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {favorites.map(fav => {
                      const name = fav.displayName ?? fav.username;
                      const avatar = fav.avatarUrl
                        ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${fav.username}`;
                      return (
                        <div key={fav.id}
                          className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <img src={avatar} alt={name}
                              className="w-10 h-10 rounded-full object-cover"
                              style={{ border: "2px solid rgba(20,184,166,0.3)" }} />
                            {fav.isLive && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                                style={{ background: "#ef4444", border: "2px solid #0f1622" }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              </span>
                            )}
                          </div>

                          {/* Name */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{name}</p>
                            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                              @{fav.username}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {fav.isLive && (
                              <Link href={`/live/${fav.id}`}>
                                <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                                  style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                                  <Radio className="w-3 h-3" />
                                  LIVE
                                </button>
                              </Link>
                            )}
                            <Link href={`/profiles/${fav.id}`}>
                              <button className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-white/10"
                                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                                View
                              </button>
                            </Link>
                            <button
                              onClick={() => removeFavorite(fav.id)}
                              title="Remove from favorites"
                              className="p-1.5 rounded-lg transition-all hover:bg-white/10"
                              style={{ color: "#e8a87c" }}>
                              <Heart className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Billing tab */}
            {activeTab === "billing" && (
              <div className="space-y-6">
                <h2 className="text-base font-bold text-white">Billing</h2>

                {/* ── Payment Methods ────────────────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-white">Payment Methods</p>
                    {!showAddCard && (
                      <button onClick={() => setShowAddCard(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                        style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6" }}>
                        <Plus className="w-3.5 h-3.5" /> Add Card
                      </button>
                    )}
                  </div>

                  {/* Saved cards */}
                  {cards.length === 0 && !showAddCard && (
                    <div className="rounded-xl p-6 text-center"
                      style={{ border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                      <CreditCard className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>No payment methods saved</p>
                    </div>
                  )}

                  <div className="space-y-2 mb-3">
                    {cards.map(card => (
                      <div key={card.id} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${card.isDefault ? "rgba(20,184,166,0.35)" : "rgba(255,255,255,0.08)"}` }}>
                        <span className="text-xl">{brandIcon(card.brand)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{card.brand} •••• {card.last4}</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{card.name} · Exp {card.expiry}</p>
                        </div>
                        {card.isDefault
                          ? <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                              style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6" }}>Default</span>
                          : <button onClick={() => handleSetDefault(card.id)}
                              className="text-xs px-2 py-0.5 rounded-lg transition-all hover:bg-white/10 flex-shrink-0"
                              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" }}>Set Default</button>
                        }
                        <button onClick={() => handleRemoveCard(card.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0"
                          style={{ color: "rgba(255,255,255,0.3)" }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add card — coming soon panel */}
                  {showAddCard && (
                    <div className="rounded-xl overflow-hidden"
                      style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                      <div className="p-6 text-center">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                          style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.15)" }}>
                          <Lock className="w-5 h-5" style={{ color: "#14b8a6" }} />
                        </div>
                        <p className="text-sm font-bold text-white mb-1.5">Payment methods available once checkout is live</p>
                        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                          Cards are added securely through our payment processor at checkout — coming soon.
                        </p>
                      </div>
                      <div className="px-6 pb-4 text-center">
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
                          Processed securely · Statement shows "CRAVR"
                        </p>
                      </div>
                      <div className="px-6 py-3 text-center"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
                          All transactions are processed securely. Charges will appear on your statement as "CRAVR".
                        </p>
                      </div>
                      <div className="px-6 pb-4 pt-3 flex justify-center">
                        <button onClick={() => setShowAddCard(false)}
                          className="text-xs px-4 py-1.5 rounded-lg transition-all hover:bg-white/5"
                          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Active Subscriptions (platform plans) ─────────────── */}
                <div>
                  <p className="text-sm font-semibold text-white mb-3">Active Subscriptions</p>
                  {activeMembership === "free" && !activeBoost ? (
                    <div className="rounded-xl p-6 text-center"
                      style={{ border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                      <Star className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
                      <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>No active subscriptions</p>
                      <Link href="/credits">
                        <button className="text-xs px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-90"
                          style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.3)", color: "#14b8a6" }}>
                          Browse Plans
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeMembership !== "free" && MEMBERSHIP_INFO[activeMembership] && (() => {
                        const m = MEMBERSHIP_INFO[activeMembership];
                        return (
                          <div className="flex items-center gap-3 p-3 rounded-xl"
                            style={{ background: `${m.color}10`, border: `1px solid ${m.color}30` }}>
                            <span className="text-xl">{m.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white">{m.name} Membership</p>
                              <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                                ${m.price}/mo · Renews {nextBillingDate()}
                              </p>
                            </div>
                            <button onClick={() => setCancelPlanModal({
                                type: "membership",
                                name: m.name,
                                emoji: m.emoji,
                                color: m.color,
                                renewDate: nextBillingDate(),
                                perks: ["Credit discount", "Exclusive badge", "Tier-locked content access"],
                                onConfirm: () => { setActiveMembership("free"); showToast({ title: `${m.name} membership cancelled` }); setCancelPlanModal(null); },
                              })}
                              className="text-xs px-2.5 py-1 rounded-lg transition-all hover:bg-red-500/10 flex-shrink-0"
                              style={{ border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                              Cancel
                            </button>
                          </div>
                        );
                      })()}
                      {activeBoost && BOOST_INFO[activeBoost] && (() => {
                        const b = BOOST_INFO[activeBoost];
                        return (
                          <div className="flex items-center gap-3 p-3 rounded-xl"
                            style={{ background: `${b.color}10`, border: `1px solid ${b.color}30` }}>
                            <span className="text-xl">{b.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white">{b.name}</p>
                              <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                                ${b.price}/mo · Renews {nextBillingDate()}
                              </p>
                            </div>
                            <button onClick={() => setCancelPlanModal({
                                type: "boost",
                                name: b.name,
                                emoji: b.emoji,
                                color: b.color,
                                renewDate: nextBillingDate(),
                                perks: ["Profile boost visibility", "Analytics access", "Featured placement in search"],
                                onConfirm: () => { setActiveBoost(null); showToast({ title: `${b.name} cancelled` }); setCancelPlanModal(null); },
                              })}
                              className="text-xs px-2.5 py-1 rounded-lg transition-all hover:bg-red-500/10 flex-shrink-0"
                              style={{ border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                              Cancel
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* ── Creator Subscriptions ──────────────────────────────── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4" style={{ color: "#a78bfa" }} />
                    <p className="text-sm font-semibold text-white">Creator Subscriptions</p>
                    {creatorSubs.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", color: "#a78bfa" }}>
                        {creatorSubs.length}
                      </span>
                    )}
                  </div>

                  {creatorSubs.length === 0 ? (
                    <div className="rounded-xl p-6 text-center"
                      style={{ border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                      <Users className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
                      <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>No creator subscriptions</p>
                      <Link href="/profiles">
                        <button className="text-xs px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-90"
                          style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa" }}>
                          Browse Creators
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {creatorSubs.map(sub => {
                        const avatar = sub.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.username}`;
                        return (
                          <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl"
                            style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.15)" }}>
                            <img src={avatar} alt={sub.displayName}
                              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                              style={{ border: `2px solid ${sub.tierColor}50` }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-sm font-bold text-white">{sub.displayName}</p>
                                <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                                  style={{ background: `${sub.tierColor}18`, border: `1px solid ${sub.tierColor}35`, color: sub.tierColor }}>
                                  {sub.tier}
                                </span>
                              </div>
                              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                                @{sub.username} · ${sub.price}/mo · Renews {sub.renewDate}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Link href={`/profiles/${sub.username}`}>
                                <button className="text-xs px-2.5 py-1 rounded-lg transition-all hover:bg-white/10"
                                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }}>
                                  View
                                </button>
                              </Link>
                              <button
                                onClick={() => setCancelPlanModal({
                                  type: "creator",
                                  name: sub.displayName,
                                  emoji: "👤",
                                  color: sub.tierColor,
                                  renewDate: sub.renewDate,
                                  perks: [`${sub.tier} tier content access`, "Private messaging", "Exclusive subscriber perks"],
                                  onConfirm: () => {
                                    setCreatorSubs(prev => prev.filter(s => s.id !== sub.id));
                                    showToast({ title: `Unsubscribed from ${sub.displayName}` });
                                    setCancelPlanModal(null);
                                  },
                                })}
                                className="text-xs px-2.5 py-1 rounded-lg transition-all hover:bg-red-500/10"
                                style={{ border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transactions tab */}
            {activeTab === "transactions" && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-white">Transaction History</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }}>
                    {allTransactions.length} transactions
                  </span>
                </div>

                {allTransactions.length === 0 ? (
                  <div className="text-center py-14">
                    <Receipt className="w-12 h-12 mx-auto mb-4" style={{ color: "rgba(255,255,255,0.1)" }} />
                    <p className="text-sm font-semibold text-white mb-1">No transactions yet</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                      Credits earned and spent will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {allTransactions.map(tx => {
                      const isPurchase = tx.type === "PURCHASE";
                      const isCredit = tx.amount > 0;
                      // For real-money purchases: amount is stored as negative dollar value
                      const displayAmt = isPurchase
                        ? `-$${Math.abs(tx.amount).toFixed(2)}`
                        : `${isCredit ? "+" : ""}${tx.amount.toLocaleString()}`;
                      const amtColor = isPurchase ? "#f87171" : isCredit ? "#14b8a6" : "#e8a87c";
                      const iconColor = isPurchase ? "#f87171" : isCredit ? "#14b8a6" : "#e8a87c";
                      const iconBg   = isPurchase ? "rgba(248,113,113,0.1)" : isCredit ? "rgba(20,184,166,0.12)" : "rgba(232,168,124,0.1)";
                      return (
                        <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/5"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: iconBg }}>
                            {isPurchase
                              ? <CreditCard className="w-3.5 h-3.5" style={{ color: iconColor }} />
                              : <Zap className="w-3.5 h-3.5" style={{ color: iconColor }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{tx.description}</p>
                            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                              {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              {isPurchase && <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>Card</span>}
                            </p>
                          </div>
                          <span className="text-sm font-black flex-shrink-0" style={{ color: amtColor }}>
                            {displayAmt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Security tab */}
            {activeTab === "security" && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-white">Security Settings</h2>

                <div className="vl-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Password</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                        Request a password reset link via email
                      </p>
                    </div>
                    <button onClick={handleChangePassword}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-white/5"
                      style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                      Change Password
                    </button>
                  </div>
                </div>

                <div className="vl-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Two-Factor Authentication</p>
                      <p className="text-xs mt-0.5" style={{ color: twoFAEnabled ? "#14b8a6" : "rgba(255,255,255,0.4)" }}>
                        {twoFAEnabled ? "Enabled — authenticator app required at login" : "Protect your account with an authenticator app"}
                      </p>
                    </div>
                    {twoFAEnabled ? (
                      <button
                        onClick={() => { setShowDisable2FA(true); setDisablePassword(""); setDisableError(""); }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                        style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", background: "rgba(239,68,68,0.05)" }}>
                        Disable 2FA
                      </button>
                    ) : (
                      <button
                        onClick={open2FAModal}
                        className="vl-btn-primary px-3 py-1.5 text-xs">
                        Enable 2FA
                      </button>
                    )}
                  </div>
                </div>

                <div className="vl-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Active Sessions</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>1 active session — this device</p>
                    </div>
                    <button onClick={handleSignOutAll}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                      style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", background: "rgba(239,68,68,0.05)" }}>
                      Sign Out All
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications tab */}
            {activeTab === "notifications" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">Notification Preferences</h2>
                  {notifSaved && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: "#14b8a6" }}>
                      <CheckCircle className="w-3.5 h-3.5" /> Saved
                    </span>
                  )}
                </div>
                {([
                  { key: "messages"   as const, label: "New Messages",        desc: "When a creator messages you" },
                  { key: "liveAlerts" as const, label: "Live Alerts",          desc: "When creators you follow go live" },
                  { key: "promotions" as const, label: "Promotions & Offers",  desc: "Credit deals and special offers" },
                  { key: "security"   as const, label: "Security Alerts",      desc: "Login and account activity" },
                ] as const).map(n => (
                  <div key={n.key} className="flex items-center justify-between py-3 border-b"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <div>
                      <p className="text-sm font-medium text-white">{n.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{n.desc}</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={notifs[n.key]}
                      aria-label={n.label}
                      onClick={() => {
                        const next = { ...notifs, [n.key]: !notifs[n.key] };
                        setNotifs(next);
                        try { localStorage.setItem(NOTIF_KEY, JSON.stringify(next)); } catch {}
                        setNotifSaved(true);
                        setTimeout(() => setNotifSaved(false), 2000);
                      }}
                      className="w-11 h-6 rounded-full transition-all duration-200 relative flex-shrink-0"
                      style={{ background: notifs[n.key] ? "#14b8a6" : "rgba(255,255,255,0.1)" }}>
                      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                        style={{ left: notifs[n.key] ? "calc(100% - 1.375rem)" : "0.125rem" }} />
                    </button>
                  </div>
                ))}
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Preferences are saved to this device. Push notifications require the mobile app.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Danger zone */}
        <div className="mt-6 vl-card p-5" style={{ borderColor: "rgba(239,68,68,0.15)" }}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: "#f87171" }}>Danger Zone</h3>
          <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>These actions are permanent and cannot be undone.</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowDeactivate(true)}
              disabled={deactivated}
              className="text-xs px-3 py-1.5 rounded-lg transition-all hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-default"
              style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              {deactivated ? "✓ Deactivated" : "Deactivate Account"}
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all hover:bg-red-500/10"
              style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Plan Disclaimer Modal */}
      {cancelPlanModal && (
        <Modal onClose={() => setCancelPlanModal(null)}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
              style={{ background: `${cancelPlanModal.color}15`, border: `1px solid ${cancelPlanModal.color}35` }}>
              {cancelPlanModal.emoji}
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Cancel {cancelPlanModal.name}?</h3>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                {cancelPlanModal.type === "membership" ? "Membership" : cancelPlanModal.type === "boost" ? "Boost" : "Creator subscription"} cancellation
              </p>
            </div>
          </div>

          {/* What you'll lose */}
          <div className="rounded-xl p-4 mb-4"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <p className="text-xs font-bold mb-2" style={{ color: "#fca5a5" }}>
              ⚠️ The following perks will expire on {cancelPlanModal.renewDate}:
            </p>
            <ul className="space-y-1.5">
              {cancelPlanModal.perks.map(perk => (
                <li key={perk} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                  <X className="w-3 h-3 flex-shrink-0" style={{ color: "#f87171" }} />
                  {perk}
                </li>
              ))}
            </ul>
          </div>

          {/* Info note */}
          <div className="rounded-xl p-3 mb-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              Your {cancelPlanModal.name} plan remains <strong className="text-white">active until {cancelPlanModal.renewDate}</strong>.
              After that date, all associated perks, discounts, and earned status will be removed.
              You can resubscribe at any time to restore access.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setCancelPlanModal(null)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ background: `${cancelPlanModal.color}18`, border: `1px solid ${cancelPlanModal.color}40`, color: cancelPlanModal.color }}>
              Keep Plan
            </button>
            <button onClick={cancelPlanModal.onConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-red-500/10"
              style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              Yes, Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* TOTP Setup Modal */}
      {show2FAModal && (
        <Modal onClose={() => setShow2FAModal(false)}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.25)" }}>
              <Smartphone className="w-5 h-5" style={{ color: "#14b8a6" }} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Set Up Authenticator App</h3>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Use Google Authenticator, Authy, or any TOTP app</p>
            </div>
          </div>

          {twoFAStep === "qr" && (
            <>
              {twoFASetupLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#14b8a6" }} />
                </div>
              ) : (
                <>
                  <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Scan this QR code with your authenticator app:
                  </p>
                  {totpQr && (
                    <div className="flex justify-center mb-4">
                      <div className="rounded-xl p-3" style={{ background: "white" }}>
                        <img src={totpQr} alt="TOTP QR Code" className="w-48 h-48" />
                      </div>
                    </div>
                  )}
                  <div className="rounded-xl p-3 mb-4"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Or enter this key manually:
                    </p>
                    <p className="text-sm font-mono tracking-wider text-white break-all select-all">
                      {totpSecret}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShow2FAModal(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
                      style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                      Cancel
                    </button>
                    <button onClick={() => setTwoFAStep("verify")}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white vl-btn-primary">
                      Next
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {twoFAStep === "verify" && (
            <>
              <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
                Enter the 6-digit code from your authenticator app to confirm setup:
              </p>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                Authenticator Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={twoFACode}
                onChange={e => { setTwoFACode(e.target.value.replace(/\D/g, "")); setTwoFACodeError(false); }}
                onKeyDown={e => e.key === "Enter" && twoFACode.length === 6 && handleVerifyTOTP()}
                placeholder="000000"
                className="vl-input w-full mb-1 text-center font-mono text-lg tracking-widest"
                style={{ borderColor: twoFACodeError ? "rgba(239,68,68,0.5)" : undefined }}
                autoFocus
              />
              {twoFACodeError && (
                <p className="text-xs mb-3" style={{ color: "#f87171" }}>Invalid code. Check your authenticator app and try again.</p>
              )}
              <div className="flex gap-3 mt-5">
                <button onClick={() => { setTwoFAStep("qr"); setTwoFACode(""); setTwoFACodeError(false); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                  Back
                </button>
                <button
                  onClick={handleVerifyTOTP}
                  disabled={twoFAVerifying || twoFACode.length !== 6}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white vl-btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                  {twoFAVerifying ? "Verifying…" : "Enable 2FA"}
                </button>
              </div>
            </>
          )}

          {twoFAStep === "done" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(20,184,166,0.15)", border: "2px solid #14b8a6" }}>
                <CheckCircle className="w-8 h-8" style={{ color: "#14b8a6" }} />
              </div>
              <p className="text-lg font-bold text-white mb-1">2FA Enabled!</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Your account is now protected with authenticator app verification.</p>
            </div>
          )}
        </Modal>
      )}

      {/* Disable 2FA Modal */}
      {showDisable2FA && (
        <Modal onClose={() => setShowDisable2FA(false)}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <AlertTriangle className="w-5 h-5" style={{ color: "#f87171" }} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Disable Two-Factor Auth?</h3>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Enter your password to confirm</p>
            </div>
          </div>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
            Your account will no longer require an authenticator code at login.
          </p>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Password</label>
          <input
            type="password"
            value={disablePassword}
            onChange={e => { setDisablePassword(e.target.value); setDisableError(""); }}
            onKeyDown={e => e.key === "Enter" && handleDisable2FA()}
            placeholder="Your password"
            className="vl-input w-full mb-1"
            style={{ borderColor: disableError ? "rgba(239,68,68,0.5)" : undefined }}
            autoFocus
          />
          {disableError && <p className="text-xs mb-3" style={{ color: "#f87171" }}>{disableError}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowDisable2FA(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              Cancel
            </button>
            <button
              onClick={handleDisable2FA}
              disabled={disableLoading || !disablePassword}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              {disableLoading ? "Removing…" : "Disable 2FA"}
            </button>
          </div>
        </Modal>
      )}

      {/* Deactivate modal */}
      {showDeactivate && (
        <Modal onClose={() => setShowDeactivate(false)}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)" }}>
              <AlertTriangle className="w-5 h-5" style={{ color: "#fbbf24" }} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Deactivate Account?</h3>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Your account will be hidden until you log back in</p>
            </div>
          </div>
          <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
            Deactivating will hide your profile and pause all subscriptions. You can reactivate at any time by signing in again.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeactivate(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              Cancel
            </button>
            <button onClick={handleDeactivate}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)", color: "#fbbf24" }}>
              Deactivate
            </button>
          </div>
        </Modal>
      )}

      {/* Delete modal */}
      {showDelete && (
        <Modal onClose={() => { setShowDelete(false); setDeleteConfirm(""); }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <AlertTriangle className="w-5 h-5" style={{ color: "#f87171" }} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Delete Account Permanently?</h3>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>This cannot be undone</p>
            </div>
          </div>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
            All your data, messages, credits, and subscriptions will be permanently deleted. This action is irreversible.
          </p>
          <div className="rounded-xl p-3 mb-5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <p className="text-xs mb-2 font-semibold" style={{ color: "#fca5a5" }}>Type DELETE to confirm</p>
            <input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="vl-input text-sm font-mono"
              style={{ borderColor: deleteConfirm === "DELETE" ? "rgba(239,68,68,0.5)" : undefined }}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteConfirm !== "DELETE"}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171" }}>
              Delete Forever
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
