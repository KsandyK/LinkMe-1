import React, { useState } from 'react';

const CreatorOnboarding = () => {
  const [step, setStep] = useState(1);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '0.5rem' }}>Become a Creator</h1>
        <p style={{ textAlign: 'center', color: '#a3a3a3', marginBottom: '3rem' }}>Join thousands of creators earning on VibeLink</p>

        {/* Age Verification Banner */}
        <div style={{ backgroundColor: '#3b0764', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#f87171', fontSize: '1.5rem' }}>⚠️</span>
          <div>
            <strong>Age Verification Required</strong>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>You must verify your age before applying to become a creator.</p>
          </div>
          <button style={{ marginLeft: 'auto', backgroundColor: '#ec4899', color: 'white', padding: '0.75rem 2rem', borderRadius: '9999px', whiteSpace: 'nowrap' }}>
            Verify Age Now →
          </button>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', backgroundColor: '#1a1a1a', padding: '1rem', borderRadius: '9999px' }}>
          <div onClick={() => setStep(1)} style={{ flex: 1, padding: '1rem', textAlign: 'center', borderRadius: '9999px', backgroundColor: step === 1 ? '#a855f7' : '#111', cursor: 'pointer' }}>
            1. Profile Info
          </div>
          <div onClick={() => setStep(2)} style={{ flex: 1, padding: '1rem', textAlign: 'center', borderRadius: '9999px', backgroundColor: step === 2 ? '#a855f7' : '#111', cursor: 'pointer' }}>
            2. Identity
          </div>
          <div onClick={() => setStep(3)} style={{ flex: 1, padding: '1rem', textAlign: 'center', borderRadius: '9999px', backgroundColor: step === 3 ? '#a855f7' : '#111', cursor: 'pointer' }}>
            3. Banking
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div style={{ backgroundColor: '#111111', padding: '2.5rem', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>Creator Profile</h2>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a3a3a3' }}>Display Name</label>
              <input type="text" placeholder="Your creator name" style={{ width: '100%', padding: '1rem', backgroundColor: '#1a1a1a', border: '1px solid #a855f7', borderRadius: '12px', color: 'white' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a3a3a3' }}>Bio</label>
              <textarea placeholder="Tell viewers about yourself..." rows={4} style={{ width: '100%', padding: '1rem', backgroundColor: '#1a1a1a', border: '1px solid #a855f7', borderRadius: '12px', color: 'white', resize: 'vertical' }} />
            </div>
            <button onClick={() => setStep(2)} style={{ marginTop: '3rem', width: '100%', padding: '1.2rem', backgroundColor: '#22d3ee', color: '#000', fontWeight: 700, borderRadius: '9999px' }}>
              Continue to Identity Verification
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ backgroundColor: '#111111', padding: '2.5rem', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Identity Verification</h2>
            <p style={{ color: '#a3a3a3', marginBottom: '2rem' }}>Required by law for all content creators. All creators must be verified adults (18+).</p>
            
            <div style={{ backgroundColor: '#1a1a1a', padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
              <h3>Government-Issued Photo ID</h3>
              <div style={{ border: '2px dashed #a855f7', borderRadius: '12px', padding: '3rem', textAlign: 'center', marginTop: '1rem' }}>
                Click to upload
              </div>
            </div>

            <div style={{ backgroundColor: '#1a1a1a', padding: '2rem', borderRadius: '16px' }}>
              <h3>Selfie Holding Your ID</h3>
              <div style={{ border: '2px dashed #a855f7', borderRadius: '12px', padding: '3rem', textAlign: 'center', marginTop: '1rem' }}>
                Click to upload
              </div>
            </div>

            <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: '1rem', backgroundColor: '#1a1a1a', borderRadius: '9999px' }}>Back</button>
              <button onClick={() => setStep(3)} style={{ flex: 1, padding: '1rem', backgroundColor: '#22d3ee', color: '#000', fontWeight: 700, borderRadius: '9999px' }}>Continue to Banking</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ backgroundColor: '#111111', padding: '2.5rem', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Payout Information</h2>
            <div style={{ backgroundColor: '#1a1a1a', padding: '2rem', borderRadius: '16px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Account Holder Name</label>
              <input type="text" placeholder="Legal name on account" style={{ width: '100%', padding: '1rem', backgroundColor: '#222', border: 'none', borderRadius: '12px', color: 'white' }} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Routing Number</label>
                  <input type="text" placeholder="9-digit routing number" style={{ width: '100%', padding: '1rem', backgroundColor: '#222', border: 'none', borderRadius: '12px', color: 'white' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Account Number</label>
                  <input type="text" placeholder="Bank account number" style={{ width: '100%', padding: '1rem', backgroundColor: '#222', border: 'none', borderRadius: '12px', color: 'white' }} />
                </div>
              </div>
            </div>
            <button style={{ marginTop: '3rem', width: '100%', padding: '1.2rem', backgroundColor: '#22d3ee', color: '#000', fontWeight: 700, borderRadius: '9999px' }}>
              Submit Application
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorOnboarding;
