/**
 * LINKME — Stripe Checkout Modal
 *
 * Gated behind VITE_STRIPE_ENABLED=true + VITE_STRIPE_PUBLIC_KEY.
 * When Stripe is not configured (no public key), the modal simply does not render
 * and the calling page falls back to its existing demo/CCBill flow.
 *
 * Usage:
 *   import { StripeCheckoutModal, isStripeEnabled } from "@/components/StripeCheckoutModal";
 *
 *   {isStripeEnabled && showModal && (
 *     <StripeCheckoutModal pkg={pkg} finalPrice={discountedPrice} onSuccess={handleSuccess} onClose={() => setShowModal(false)} />
 *   )}
 */
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { credits as creditsApi } from "@/lib/api";
import { X, Lock, Loader2, CheckCircle } from "lucide-react";

// ── Stripe setup ─────────────────────────────────────────────────────────────

const STRIPE_PK: string | undefined = (import.meta as any).env?.VITE_STRIPE_PUBLIC_KEY;

/**
 * True only when VITE_STRIPE_PUBLIC_KEY is configured.
 * Use this to conditionally render the Stripe checkout path.
 */
export const isStripeEnabled = Boolean(STRIPE_PK);

// Singleton promise — created once, shared across all Elements instances
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

// ── CardElement styles ────────────────────────────────────────────────────────

const CARD_ELEMENT_OPTIONS: Parameters<typeof CardElement>[0]["options"] = {
  style: {
    base: {
      color: "#ffffff",
      fontSize: "15px",
      fontFamily: "'Inter', sans-serif",
      fontSmoothing: "antialiased",
      "::placeholder": { color: "rgba(255,255,255,0.28)" },
      iconColor: "#14b8a6",
    },
    invalid: { color: "#f87171", iconColor: "#f87171" },
  },
  hidePostalCode: true,
};

// ── Package shape (matches CreditsStore PACKAGES entries) ─────────────────────

export interface CheckoutPkg {
  id: string;
  name: string;
  emoji: string;
  credits: number;
  bonusCredits: number;
  price: number;
}

// ── Inner form component (must live inside <Elements>) ────────────────────────

interface FormProps {
  pkg: CheckoutPkg;
  finalPrice: number;
  onSuccess: (creditsEarned: number) => void;
  onClose: () => void;
}

function StripeCardForm({ pkg, finalPrice, onSuccess, onClose }: FormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || processing) return;
    setProcessing(true);
    setError(null);

    const card = elements.getElement(CardElement);
    if (!card) { setProcessing(false); return; }

    try {
      // Step 1: tokenise the card locally (no raw PAN ever touches our server)
      const { paymentMethod, error: pmErr } = await stripe.createPaymentMethod({
        type: "card",
        card,
      });
      if (pmErr) throw new Error(pmErr.message ?? "Card validation failed");

      // Step 2: backend creates a PaymentIntent and (optionally) confirms it
      const result = await creditsApi.purchaseWithStripe(pkg.id, paymentMethod!.id);

      // Step 3: if 3D Secure is required, confirm client-side
      if (result.clientSecret) {
        const { error: confirmErr } = await stripe.confirmCardPayment(result.clientSecret);
        if (confirmErr) throw new Error(confirmErr.message ?? "3D Secure authentication failed");
      }

      // Step 4: success — use server-reported credit amount or calculate locally
      const earned = result.credits ?? (pkg.credits + pkg.bonusCredits);
      setSucceeded(true);
      // Brief celebration delay, then resolve
      setTimeout(() => onSuccess(earned), 1400);
    } catch (err: any) {
      setError(err.message ?? "Payment failed. Please check your card and try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <div className="py-8 flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.3)" }}>
          <CheckCircle className="w-7 h-7" style={{ color: "#14b8a6" }} />
        </div>
        <p className="text-lg font-bold text-white">Payment successful!</p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          {(pkg.credits + pkg.bonusCredits).toLocaleString()} credits added to your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Order summary */}
      <div className="rounded-xl p-4 flex items-center justify-between"
        style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.15)" }}>
        <div>
          <p className="text-sm font-bold text-white">{pkg.emoji} {pkg.name} Package</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            {pkg.credits.toLocaleString()} credits
            {pkg.bonusCredits > 0 && ` + ${pkg.bonusCredits} bonus`}
          </p>
        </div>
        <p className="text-xl font-black" style={{ color: "#14b8a6" }}>${finalPrice}</p>
      </div>

      {/* Card element */}
      <div>
        <label className="block text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
          Card Details
        </label>
        <div className="px-4 py-3.5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        {error && (
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "#f87171" }}>
            <span>⚠</span> {error}
          </p>
        )}
      </div>

      {/* Security notice */}
      <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
        <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#14b8a6" }} />
        Secured by Stripe — your card never touches our servers.
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} disabled={processing}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" }}>
          Cancel
        </button>
        <button type="submit" disabled={!stripe || processing}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)" }}>
          {processing
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
            : `Pay $${finalPrice}`}
        </button>
      </div>
    </form>
  );
}

// ── Public modal component ────────────────────────────────────────────────────

interface ModalProps extends FormProps {}

/**
 * Full-screen Stripe checkout modal.
 * Renders nothing when Stripe is not configured (no VITE_STRIPE_PUBLIC_KEY).
 */
export function StripeCheckoutModal({ pkg, finalPrice, onSuccess, onClose }: ModalProps) {
  if (!stripePromise) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="relative w-full max-w-md rounded-2xl p-6"
        style={{
          background: "#0f1622",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 25px 70px rgba(0,0,0,0.8)",
        }}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-all hover:bg-white/10"
          style={{ color: "rgba(255,255,255,0.4)" }}>
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <h3 className="text-lg font-bold text-white">Complete Purchase</h3>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            Powered by Stripe — PCI DSS Level 1
          </p>
        </div>

        <Elements stripe={stripePromise} options={{ appearance: { theme: "night", variables: { colorPrimary: "#14b8a6" } } }}>
          <StripeCardForm pkg={pkg} finalPrice={finalPrice} onSuccess={onSuccess} onClose={onClose} />
        </Elements>
      </div>
    </div>
  );
}
