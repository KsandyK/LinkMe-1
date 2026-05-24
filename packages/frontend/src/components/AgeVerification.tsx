import React, { useState } from 'react';

const AgeVerification = () => {
  const [step, setStep] = useState(1);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '0.5rem' }}>Verify Your Age</h1>
        <p style={{ textAlign: 'center', color: '#a3a3a3', marginBottom: '3rem' }}>Required to access all platform features. Your data is encrypted and protected.</p>

        {/* Stepper */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '3rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: '#22d3ee', color: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>1</div>
            <div style={{ fontSize: '0.9rem', color: '#22d3ee' }}>Overview</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: '#1a1a1a', border: '2px solid #a855f7', color: '#a3a3a3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>2</div>
            <div style={{ fontSize: '0.9rem', color: '#a3a3a3' }}>Date of Birth</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: '#1a1a1a', border: '2px solid #a855f7', color: '#a3a3a3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>3</div>
            <div style={{ fontSize: '0.9rem', color: '#a3a3a3' }}>ID Upload</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: '#1a1a1a', border: '2px solid #a855f7', color: '#a3a3a3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>4</div>
            <div style={{ fontSize: '0.9rem', color: '#a3a3a3' }}>Review</div>
          </div>
        </div>

        {/* Protected Info Box */}
        <div style={{ backgroundColor: '#1a1a1a', borderRadius: '16px', padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ color: '#22d3ee', fontSize: '1.5rem' }}>🔒</span>
            <strong>Your Personal Information is Protected</strong>
          </div>
          <p style={{ color: '#a3a3a3', lineHeight: '1.5' }}>
            All verification data is encrypted with AES-256 and transmitted over TLS 1.3. We do not store raw ID images after verification. Your PII is processed in compliance with GDPR, CCPA, and applicable privacy laws.
          </p>
        </div>

        {/* Why We Verify Age */}
        <div style={{ backgroundColor: '#1a1a1a', borderRadius: '16px', padding: '2rem', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Why We Verify Age</h2>
          <p style={{ color: '#a3a3a3', lineHeight: '1.6' }}>
            VibeLink is an adult platform that takes its legal and ethical obligations seriously. Age verification ensures that all users are adults and protects minors from accessing age-restricted content. This is required by law in many jurisdictions.
          </p>
        </div>

        {/* Date of Birth Step */}
        {step === 1 && (
          <div style={{ backgroundColor: '#111111', borderRadius: '16px', padding: '2.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Enter Your Date of Birth</h2>
            <p style={{ color: '#a3a3a3', marginBottom: '2rem' }}>You must be 18 years or older to access this platform.</p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a3a3a3' }}>Month</label>
                <input type="text" placeholder="MM" style={{ width: '100%', padding: '1rem', backgroundColor: '#1a1a1a', border: '1px solid #a855f7', borderRadius: '12px', color: 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a3a3a3' }}>Day</label>
                <input type="text" placeholder="DD" style={{ width: '100%', padding: '1rem', backgroundColor: '#1a1a1a', border: '1px solid #a855f7', borderRadius: '12px', color: 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a3a3a3' }}>Year</label>
                <input type="text" placeholder="YYYY" style={{ width: '100%', padding: '1rem', backgroundColor: '#1a1a1a', border: '1px solid #a855f7', borderRadius: '12px', color: 'white' }} />
              </div>
            </div>

            <button onClick={() => setStep(2)} style={{ width: '100%', padding: '1.2rem', backgroundColor: '#22d3ee', color: '#000', fontWeight: 700, borderRadius: '9999px' }}>
              Continue
            </button>
          </div>
        )}

        {/* Navigation buttons for other steps */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem' }}>
          <button onClick={() => setStep(Math.max(1, step - 1))} style={{ padding: '1rem 2rem', backgroundColor: '#1a1a1a', borderRadius: '9999px' }}>Back</button>
          <button onClick={() => setStep(Math.min(4, step + 1))} style={{ padding: '1rem 2rem', backgroundColor: '#22d3ee', color: '#000', fontWeight: 700, borderRadius: '9999px' }}>Continue</button>
        </div>
      </div>
    </div>
  );
};

export default AgeVerification;
