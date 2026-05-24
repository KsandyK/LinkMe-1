import React from "react";
import { useLocation } from "wouter";
import { CheckCircle } from "lucide-react";

const BecomeCreator = () => {
  const [, navigate] = useLocation();

  // Simple JWT payload decoder (no extra dependencies)
  const getUserFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload;
    } catch {
      return null;
    }
  };

  const user = getUserFromToken();

  // Auto-redirect approved test creators
  React.useEffect(() => {
    if (user?.role === "creator" && user?.approved === true) {
      console.log("✅ Test creator (dev only) detected — redirecting to dashboard");
      navigate("/creator/dashboard");
      return;
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" 
             style={{ background: "rgba(20,184,166,0.15)", border: "2px solid #14b8a6", boxShadow: "0 0 30px rgba(20,184,166,0.3)" }}>
          <CheckCircle className="w-10 h-10" style={{ color: "#14b8a6" }} />
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 700, color: "white", marginBottom: "0.5rem" }}>
          Application Submitted!
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "1.5rem" }}>
          Thank you. Our team will review your application and ID within 24–48 hours. You will receive an email once verification is complete.
        </p>

        {/* Test button — only visible during development */}
        {user?.role === "creator" && (
          <button 
            onClick={() => navigate("/creator/dashboard")}
            className="mt-6 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg text-sm"
          >
            🚀 Skip to Creator Dashboard (Test Mode)
          </button>
        )}

        <button 
          onClick={() => navigate("/")} 
          className="vl-btn-primary px-6 py-3 text-sm mt-4"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default BecomeCreator;
