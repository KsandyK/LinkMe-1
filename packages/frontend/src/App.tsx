import React, { useState, useEffect } from 'react';

const CreditsCheckout = () => {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    fetch('/api/credits/balance')
      .then(r => r.json())
      .then(data => setBalance(data.balance || 0))
      .catch(() => {});
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: 'white',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <h1 style={{
        fontSize: '5rem',
        fontWeight: 900,
        background: 'linear-gradient(to right, #a855f7, #ec4899, #22d3ee)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '2rem'
      }}>
        VibeLink
      </h1>
      
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '2rem 4rem',
        borderRadius: '9999px',
        border: '3px solid #a855f7',
        fontSize: '3rem',
        fontWeight: 700,
        marginBottom: '3rem'
      }}>
         {balance} credits
      </div>

      <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#c026d3' }}>
        Credits Store
      </h2>

      <p style={{ color: '#22d3ee', fontSize: '1.5rem' }}>
        Buy buttons connected to backend
      </p>
    </div>
  );
};

function App() {
  return <CreditsCheckout />;
}

export default App;
