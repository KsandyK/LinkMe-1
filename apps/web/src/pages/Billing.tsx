import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Link } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { Zap, Lock, CreditCard, Receipt, Star, ChevronRight, X, Plus, CheckCircle, Loader2 } from "lucide-react";
import { isStripeEnabled } from "@/components/StripeCheckoutModal";

// Stripe singleton (undefined if not configured)
const STRIPE_PK: string | undefined = (import.meta as any).env?.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

// ── Saved card helpers ────────────────────────────────────────────────────────
interface SavedCard { id: string; last4: string; brand: string; expiry: string; name: string; isDefault: boolean }

const CARDS_KEY = "vl_saved_cards_v1";
function loadCards(): SavedCard[] {
  try { return JSON.parse(localStorage.getItem(CARDS_KEY) ?? "[]"); } catch { return []; }
}
function saveCards(cards: SavedCard[]) {
  try { localStorage.setItem(CARDS_KEY, JSON.stringify(cards)); } catch {}
}

function detectBrand(num: string): string {
  const n = num.replace(/\s/g, "");
  if (n.startsWith("4"))  return "Visa";
  if (n.startsWith("5") || n.startsWith("2")) return "Mastercard";
  if (n.startsWith("34") || n.startsWith("37")) return "Amex";
  if (n.startsWith("6"))  return "Discover";
  return "Card";
}

function brandIcon(brand: string) {
  const icons: Record<string, string> = { Visa: "💳", Mastercard: "🟠", Amex: "🔵", Discover: "🟡" };
  return icons[brand] ?? "💳";
}

function fmtCardNum(val: string) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function fmtExpiry(val: string) {
  const d = val.replace(/\D/g, "").slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

// ── Lookup tables (mirrors BoostsPage data) ───────────────────────────────────
const MEMBERSHIP_INFO: Record<string, { name: string; price: number; credits: number; color: string; emoji: string }> = {
  fan:        { name: "Fan",          price: 4.99,   credits: 50,     color: "#f43f5e", emoji: "❤️"  },
  supporter:  { name: "Supporter",    price: 9.99,   credits: 150,    color: "#f97316", emoji: "🔥"  },
  superfan:   { name: "Super Fan",    price: 14.99,  credits: 200,    color: "#8b5cf6", emoji: "💫"  },
  devotee:    { name: "Devotee",      price: 19.99,  credits: 300,    color: "#ec4899", emoji: "💖"  },
  allaccess:  { name: "All-Access",   price: 24.99,  credits: 400,    color: "#f59e0b", emoji: "👑"  },
  elite:      { name: "Elite",        price: 39.99,  credits: 750,    color: "#6366f1", emoji: "⚡"  },
  creatorpass:{ name: "Creator Pass", price: 49.99,  credits: 1000,   color: "#14B8A6", emoji: "🎬"  },
  blackcard:  { name: "Black Card",   price: 99.99,  credits: 2500,   color: "#d4af37", emoji: "🃏"  },
  diamond:    { name: "Diamond",      price: 500,    credits: 20000,  color: "#00d4ff", emoji: "💎"  },
  obsidian:   { name: "Obsidian",     price: 1000,   credits: 40000,  color: "#7c3aed", emoji: "🌑"  },
  platinum_m: { name: "Platinum",     price: 2500,   credits: 250000, color: "#e2e8f0", emoji: "🏆"  },
};

const BOOST_INFO: Record<string, { name: string; price: number; boosts: number; color: string; emoji: string }> = {
  starter:  { name: "Starter",   price: 4.99,   boosts: 2,   color: "#64748b", emoji: "✨" },
  spark:    { name: "Spark",     price: 9.99,   boosts: 4,   color: "#06b6d4", emoji: "⚡" },
  flame:    { name: "Flame",     price: 19.99,  boosts: 8,   color: "#14B8A6", emoji: "🔥" },
  blaze:    { name: "Blaze",     price: 29.99,  boosts: 14,  color: "#f97316", emoji: "💥" },
  inferno:  { name: "Inferno",   price: 39.99,  boosts: 22,  color: "#ef4444", emoji: "🌋" },
  legend:   { name: "Legend",    price: 59.99,  boosts: 36,  color: "#f59e0b", emoji: "👑" },
  titan:    { name: "Titan",     price: 99.99,  boosts: 50,  color: "#a78bfa", emoji: "🏆" },
  supernova:{ name: "Supernova", price: 500,    boosts: 70,  color: "#00d4ff", emoji: "🌟" },
  colossus: { name: "Colossus",  price: 1000,   boosts: 95,  color: "#7c3aed", emoji: "💫" },
  sovereign:{ name: "Sovereign", price: 2500,   boosts: 120, color: "#e2e8f0", emoji: "🔱" },
};

function fmtPrice(p: number) {
  return p % 1 === 0 ? `$${p.toLocaleString()}` : `$${p.toFixed(2)}`;
}

// Next billing date: first day of next month
function nextBillingDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  return d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

// ── Stripe "Add Card" sub-component (only used when Stripe is enabled) ─────────

const CARD_STYLE: Parameters<typeof CardElement>[0]["options"] = {
  style: {
    base: {
      color: "#ffffff", fontSize: "15px", fontSmoothing: "antialiased",
      "::placeholder": { color: "rgba(255,255,255,0.28)" }, iconColor: "#14b8a6",
    },
    invalid: { color: "#f87171", iconColor: "#f87171" },
  },
  hidePostalCode: true,
};

interface StripeAddCardProps {
  onSuccess: (card: SavedCard) => void;
  onCancel: () => void;
}

function StripeAddCardForm({ onSuccess, onCancel }: StripeAddCardProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [name, setName] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setNameErr("Name on card is required"); return; }
    if (!stripe || !elements || processing) return;
    setProcessing(true);
    setError(null);
    const card = elements.getElement(CardElement);
    if (!card) { setProcessing(false); return; }
    try {
      // Create a SetupIntent-less PaymentMethod to tokenise the card for future use
      const { paymentMethod, error: pmErr } = await stripe.createPaymentMethod({
        type: "card", card,
        billing_details: { name: name.trim() },
      });
      if (pmErr) throw new Error(pmErr.message);
      // In production: POST paymentMethod.id to /api/billing/cards so the backend
      // attaches it to the Stripe Customer. For now we store a mock local record.
      const last4 = paymentMethod!.card?.last4 ?? "????";
      const brand = paymentMethod!.card?.brand ?? "card";
      const brandName = brand.charAt(0).toUpperCase() + brand.slice(1);
      const exp_month = paymentMethod!.card?.exp_month ?? 0;
      const exp_year  = paymentMethod!.card?.exp_year  ?? 0;
      const expiry = `${String(exp_month).padStart(2, "0")}/${String(exp_year).slice(-2)}`;
      const newCard: SavedCard = {
        id: paymentMethod!.id, // Stripe PM ID
        last4, brand: brandName, expiry, name: name.trim(), isDefault: false,
      };
      onSuccess(newCard);
    } catch (err: any) {
      setError(err.message ?? "Card setup failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>Name on Card</label>
        <input
          type="text" placeholder="As it appears on your card" value={name}
          onChange={e => { setName(e.target.value); setNameErr(""); }}
          className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${nameErr ? "#f87171" : "rgba(255,255,255,0.1)"}`, color: "white" }}
        />
        {nameErr && <p className="text-xs mt-1" style={{ color: "#f87171" }}>{nameErr}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>Card Details</label>
        <div className="px-4 py-3.5 rounded-lg"
          style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${error ? "#f87171" : "rgba(255,255,255,0.1)"}` }}>
          <CardElement options={CARD_STYLE} />
        </div>
        {error && <p className="text-xs mt-1" style={{ color: "#f87171" }}>{error}</p>}
      </div>
      <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
        <Lock className="w-3.5 h-3.5" style={{ color: "#14b8a6" }} />
        Secured by Stripe — card data never reaches our servers
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} disabled={processing}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" }}>Cancel</button>
        <button type="submit" disabled={!stripe || processing}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)" }}>
          {processing ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : "Save Card"}
        </button>
      </div>
      <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
        🔒 Processed securely via Stripe · Your full card number is never stored
      </p>
    </form>
  );
}

export default function Billing() {
  const { credits, isLoggedIn, transactions, activeMembership, setActiveMembership, activeBoost, setActiveBoost, showToast } = useApp();
  // Real card vaulting requires a live processor (CCBill/Stripe). Until then,
  // adding a card is disabled in production (the old flow saved a fake card to
  // localStorage). Demo entry still works in local dev.
  const cardEntryEnabled = import.meta.env.DEV;

  // Build active subscription list from AppContext state
  const activeSubs: { id: string; type: "membership" | "boost"; name: string; price: number; detail: string; color: string; emoji: string }[] = [];
  if (activeMembership && activeMembership !== "free") {
    const m = MEMBERSHIP_INFO[activeMembership];
    if (m) activeSubs.push({ id: activeMembership, type: "membership", name: m.name, price: m.price, detail: `${m.credits.toLocaleString()} credits/month`, color: m.color, emoji: m.emoji });
  }
  if (activeBoost) {
    const b = BOOST_INFO[activeBoost];
    if (b) activeSubs.push({ id: activeBoost, type: "boost", name: `${b.name} Boost`, price: b.price, detail: `${b.boosts} profile boosts/month`, color: b.color, emoji: b.emoji });
  }
  const [activeTab, setActiveTab] = useState<"methods" | "history" | "subscriptions">("methods");

  // ── Payment methods state ──────────────────────────────────────────────────
  const [cards, setCards] = useState<SavedCard[]>(loadCards);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardForm, setCardForm] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [cardSaved, setCardSaved] = useState(false);

  const handleSaveCard = () => {
    if (!cardEntryEnabled) {
      setShowAddCard(false);
      showToast({ title: "Coming soon", description: "Saved payment methods will be available once checkout is live.", variant: "destructive" });
      return;
    }
    const errs: Record<string, string> = {};
    const rawNum = cardForm.number.replace(/\s/g, "");
    if (rawNum.length < 13) errs.number = "Enter a valid card number";
    const parts = cardForm.expiry.split("/");
    const mm = parts[0]; const yy = parts[1] ?? "";
    if (!mm || parseInt(mm) < 1 || parseInt(mm) > 12 || yy.length < 2) errs.expiry = "Enter a valid expiry (MM/YY)";
    if (cardForm.cvv.replace(/\D/g, "").length < 3) errs.cvv = "Enter a valid CVV";
    if (!cardForm.name.trim()) errs.name = "Enter the cardholder name";
    setCardErrors(errs);
    if (Object.keys(errs).length) return;

    const brand = detectBrand(rawNum);
    const last4 = rawNum.slice(-4);
    const newCard: SavedCard = {
      id: `card-${Date.now()}`,
      last4, brand,
      expiry: cardForm.expiry,
      name: cardForm.name.trim(),
      isDefault: cards.length === 0,
    };
    const next = [...cards, newCard];
    setCards(next);
    saveCards(next);
    setCardForm({ number: "", expiry: "", cvv: "", name: "" });
    setCardErrors({});
    setShowAddCard(false);
    setCardSaved(true);
    setTimeout(() => setCardSaved(false), 3000);
  };

  const handleRemoveCard = (id: string) => {
    const next = cards.filter(c => c.id !== id).map((c, i) => ({ ...c, isDefault: i === 0 }));
    setCards(next);
    saveCards(next);
  };

  const handleSetDefault = (id: string) => {
    const next = cards.map(c => ({ ...c, isDefault: c.id === id }));
    setCards(next);
    saveCards(next);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-5xl">
        <h1 className="text-3xl font-bold text-white mb-2">Billing & Payments</h1>
        <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.4)" }}>Manage your payment methods, view transactions, and control subscriptions.</p>

        {/* Balance + Security row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
          <div className="vl-card p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(20,184,166,0.12)" }}>
                <Zap className="w-5 h-5" style={{ color: "#14b8a6" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Credits Balance</p>
                <p className="text-2xl font-black" style={{ color: "#14b8a6" }}>{credits.toLocaleString()}</p>
              </div>
            </div>
            <Link href="/credits">
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }}>
                Buy More
              </button>
            </Link>
          </div>

          <div className="vl-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4" style={{ color: "#14b8a6" }} />
              <p className="text-xs font-bold" style={{ color: "#14b8a6" }}>Your Data is Fully Protected</p>
            </div>
            <div className="space-y-1">
              {["PCI DSS Level 1 certified processing", "TLS 1.3 encryption on all transactions", "Tokenized storage — full card numbers never stored"].map(item => (
                <p key={item} className="text-xs flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  <span style={{ color: "#14b8a6" }}>✓</span> {item}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 vl-card p-1.5 w-fit mb-6">
          {([
            { id: "methods" as const, label: "Payment Methods", icon: CreditCard },
            { id: "history" as const, label: "Transactions", icon: Receipt },
            { id: "subscriptions" as const, label: "Subscriptions", icon: Star },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={activeTab === tab.id
                ? { background: "rgba(20,184,166,0.15)", color: "#14b8a6" }
                : { color: "rgba(255,255,255,0.45)" }
              }>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "methods" && (
          <div className="space-y-4">

            {/* Saved card success flash */}
            {cardSaved && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.25)", color: "#14b8a6" }}>
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                Card saved successfully.
              </div>
            )}

            {/* Existing cards */}
            {cards.map(card => (
              <div key={card.id} className="vl-card p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {brandIcon(card.brand)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-white">{card.brand} •••• {card.last4}</p>
                      {card.isDefault && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: "rgba(20,184,166,0.12)", color: "#14b8a6", border: "1px solid rgba(20,184,166,0.2)" }}>
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {card.name} · Expires {card.expiry}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  {!card.isDefault && (
                    <button onClick={() => handleSetDefault(card.id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                      Set Default
                    </button>
                  )}
                  <button onClick={() => handleRemoveCard(card.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                    <X className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>
            ))}

            {/* Add card form */}
            {showAddCard ? (
              <div className="vl-card p-5 space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h3 className="text-sm font-bold text-white">Add a Card</h3>
                    {isStripeEnabled && (
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        Secured by Stripe
                      </p>
                    )}
                  </div>
                  <button onClick={() => { setShowAddCard(false); setCardErrors({}); }}
                    className="p-1 rounded-lg hover:bg-white/10 transition-all"
                    style={{ color: "rgba(255,255,255,0.4)" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Route to Stripe CardElement or manual form */}
                {isStripeEnabled && stripePromise ? (
                  <Elements stripe={stripePromise} options={{ appearance: { theme: "night", variables: { colorPrimary: "#14b8a6" } } }}>
                    <StripeAddCardForm
                      onSuccess={newCard => {
                        const next = [...cards, { ...newCard, isDefault: cards.length === 0 }];
                        setCards(next); saveCards(next);
                        setShowAddCard(false);
                        setCardSaved(true);
                        setTimeout(() => setCardSaved(false), 3000);
                      }}
                      onCancel={() => { setShowAddCard(false); setCardErrors({}); }}
                    />
                  </Elements>
                ) : (
                  <>
                    {/* Card number */}
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                        Card Number
                      </label>
                      <input
                        type="text" inputMode="numeric" placeholder="1234 5678 9012 3456"
                        value={cardForm.number}
                        onChange={e => setCardForm(f => ({ ...f, number: fmtCardNum(e.target.value) }))}
                        className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${cardErrors.number ? "#f87171" : "rgba(255,255,255,0.1)"}`, color: "white" }}
                      />
                      {cardErrors.number && <p className="text-xs mt-1" style={{ color: "#f87171" }}>{cardErrors.number}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>Expiry (MM/YY)</label>
                        <input
                          type="text" inputMode="numeric" placeholder="MM/YY" maxLength={5}
                          value={cardForm.expiry}
                          onChange={e => setCardForm(f => ({ ...f, expiry: fmtExpiry(e.target.value) }))}
                          className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none"
                          style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${cardErrors.expiry ? "#f87171" : "rgba(255,255,255,0.1)"}`, color: "white" }}
                        />
                        {cardErrors.expiry && <p className="text-xs mt-1" style={{ color: "#f87171" }}>{cardErrors.expiry}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>CVV</label>
                        <input
                          type="password" inputMode="numeric" placeholder="•••" maxLength={4}
                          value={cardForm.cvv}
                          onChange={e => setCardForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                          className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none"
                          style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${cardErrors.cvv ? "#f87171" : "rgba(255,255,255,0.1)"}`, color: "white" }}
                        />
                        {cardErrors.cvv && <p className="text-xs mt-1" style={{ color: "#f87171" }}>{cardErrors.cvv}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>Name on Card</label>
                      <input
                        type="text" placeholder="As it appears on your card"
                        value={cardForm.name}
                        onChange={e => setCardForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${cardErrors.name ? "#f87171" : "rgba(255,255,255,0.1)"}`, color: "white" }}
                      />
                      {cardErrors.name && <p className="text-xs mt-1" style={{ color: "#f87171" }}>{cardErrors.name}</p>}
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button onClick={() => { setShowAddCard(false); setCardErrors({}); }}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" }}>
                        Cancel
                      </button>
                      <button onClick={handleSaveCard}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)" }}>
                        Save Card
                      </button>
                    </div>

                    <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
                      🔒 Processed securely · Your card details are encrypted and never stored on our servers
                    </p>
                  </>
                )}
              </div>
            ) : (
              cardEntryEnabled ? (
                <button onClick={() => setShowAddCard(true)}
                  className="w-full vl-card p-4 flex items-center justify-center gap-2 text-sm font-semibold transition-all hover:border-white/20"
                  style={{ color: "#14b8a6", borderStyle: "dashed" }}>
                  <Plus className="w-4 h-4" />
                  Add Payment Method
                </button>
              ) : (
                <div className="vl-card p-4 text-center" style={{ borderStyle: "dashed" }}>
                  <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Payment methods available once checkout is live
                  </p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Cards are added securely through our payment processor at checkout — coming soon.
                  </p>
                </div>
              )
            )}

            {cards.length === 0 && !showAddCard && (
              <p className="text-xs text-center mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>
                Processed securely · Statement shows "CRAVR"
              </p>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="vl-card p-5">
            <h3 className="text-sm font-bold text-white mb-5">Transaction History</h3>
            {!isLoggedIn ? (
              <p className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.4)" }}>
                Sign in to view your transaction history.
              </p>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.4)" }}>No transactions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {["Description", "Date", "Credits", "Status"].map(h => (
                        <th key={h} className={`py-2.5 text-xs font-semibold ${h !== "Description" ? "text-right" : "text-left"}`}
                          style={{ color: "rgba(255,255,255,0.35)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => {
                      const isCredit = tx.amount > 0;
                      return (
                        <tr key={tx.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td className="py-3 text-sm text-white">{tx.description}</td>
                          <td className="py-3 text-right text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                            {new Date(tx.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="py-3 text-right text-xs font-mono"
                            style={{ color: isCredit ? "#14b8a6" : "#f87171" }}>
                            {isCredit ? "+" : ""}{tx.amount.toLocaleString()}
                          </td>
                          <td className="py-3 text-right">
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(20,184,166,0.1)", color: "#14b8a6" }}>
                              completed
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div className="space-y-4">
            {activeSubs.length === 0 ? (
              <div className="vl-card p-10 text-center">
                <Star className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
                <p className="font-bold text-white mb-1">No Active Subscriptions</p>
                <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>Upgrade your plan to unlock bonus credits, boosts, and exclusive content.</p>
                <Link href="/credits">
                  <button className="vl-btn-primary px-6 py-2.5 text-sm">Browse Plans</button>
                </Link>
              </div>
            ) : (
              <>
                {activeSubs.map(sub => (
                  <div key={sub.id} className="vl-card p-5 flex items-center justify-between gap-4 flex-wrap"
                    style={{ borderColor: `${sub.color}33` }}>
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: `${sub.color}18`, border: `1px solid ${sub.color}33` }}>
                        {sub.emoji}
                      </div>
                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-base font-bold text-white">{sub.name}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: "rgba(20,184,166,0.12)", color: "#14b8a6", border: "1px solid rgba(20,184,166,0.2)" }}>
                            Active
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                          {sub.type === "membership" ? "Membership Plan" : "Profile Boost Package"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                          {sub.detail} · Renews {nextBillingDate()}
                        </p>
                      </div>
                    </div>
                    {/* Right side */}
                    <div className="flex items-center gap-4 ml-auto">
                      <div className="text-right">
                        <p className="text-base font-black text-white">{fmtPrice(sub.price)}</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>/month</p>
                      </div>
                      <button
                        onClick={() => {
                          if (sub.type === "membership") setActiveMembership("free");
                          else setActiveBoost(null);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </div>
                ))}

                {/* Upgrade prompt if not at max */}
                <div className="vl-card p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Want to upgrade or add a plan?</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                      Browse memberships in the Store, or manage boosts in your Creator Dashboard.
                    </p>
                  </div>
                  <Link href="/credits">
                    <button className="text-xs font-bold px-4 py-2 rounded-lg flex-shrink-0"
                      style={{ background: "rgba(20,184,166,0.12)", color: "#14b8a6", border: "1px solid rgba(20,184,166,0.2)" }}>
                      Browse Plans <ChevronRight className="inline w-3 h-3 -mt-0.5" />
                    </button>
                  </Link>
                </div>
              </>
            )}
          </div>
        )}

        <p className="text-xs mt-6" style={{ color: "rgba(255,255,255,0.25)" }}>
          All transactions are processed securely. Charges will appear on your statement as "CRAVR".
        </p>
      </div>
    </div>
  );
}
