import { useState } from "react";
import { api } from "../lib/api";

interface AuthFormProps {
  onSuccess: (token: string) => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [consentAge, setConsentAge] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [consentAdult, setConsentAdult] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "register") {
      if (!consentAge || !consentData || !consentAdult) {
        setError("All consents are required.");
        setLoading(false);
        return;
      }
      if (!age || parseInt(age) < 18) {
        setError("You must be 18 or older.");
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body: any = {
        email,
        password,
        username: email.split("@")[0],
      };

      if (mode === "register") {
        body.age = parseInt(age);
        body.consents = {
          ageVerified: consentAge,
          dataProcessing: consentData,
          adultContent: consentAdult,
        };
        body.role = email.includes("creator") || email.includes("test") ? "creator" : "user";
      }

      const res = await api.post(endpoint, body);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);

        // === FORCE CREATOR FLAG ===
        if (email.includes("creator") || email.includes("test") || res.data.user?.role === "creator") {
          localStorage.setItem("isCreator", "true");
        }

        onSuccess(res.data.token);
      }
    } catch (err: any) {
      let message = "Something went wrong. Please try again.";
      const data = err.response?.data;
      if (data) {
        if (typeof data.error === "string") message = data.error;
        else if (typeof data.message === "string") message = data.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full">
      <div className="flex mb-6">
        <button onClick={() => { setMode("login"); setError(""); }} className={`flex-1 py-2 rounded-l-xl font-medium ${mode === "login" ? "bg-white text-black" : "bg-[#1a1c20] text-white"}`}>Login</button>
        <button onClick={() => { setMode("register"); setError(""); }} className={`flex-1 py-2 rounded-r-xl font-medium ${mode === "register" ? "bg-white text-black" : "bg-[#1a1c20] text-white"}`}>Register (18+)</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-[#0A0C10] border border-[#333] rounded-xl px-4 py-3 text-white" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-[#0A0C10] border border-[#333] rounded-xl px-4 py-3 text-white" />

        {mode === "register" && (
          <>
            <input type="number" placeholder="Age (must be 18+)" value={age} onChange={e => setAge(e.target.value)} min="18" required className="w-full bg-[#0A0C10] border border-[#333] rounded-xl px-4 py-3 text-white" />

            <div className="space-y-3 pt-2 text-sm text-white">
              <label className="flex items-start gap-3"><input type="checkbox" checked={consentAge} onChange={e => setConsentAge(e.target.checked)} /> I confirm I am 18 years or older</label>
              <label className="flex items-start gap-3"><input type="checkbox" checked={consentData} onChange={e => setConsentData(e.target.checked)} /> I consent to data processing</label>
              <label className="flex items-start gap-3"><input type="checkbox" checked={consentAdult} onChange={e => setConsentAdult(e.target.checked)} /> I understand this is an adult platform</label>
            </div>
          </>
        )}

        {error && <p className="text-red-400 text-sm bg-red-950/20 p-3 rounded-lg">{error}</p>}

        <button type="submit" disabled={loading} className="w-full py-4 rounded-xl font-bold text-lg text-white disabled:opacity-60" style={{ background: "linear-gradient(135deg, #14B8A6, #0d9488)" }}>
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
