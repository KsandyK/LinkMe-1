import React, { useState, useEffect } from 'react';

const App = () => {
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
        marginBottom: '1rem'
      }}>
        VibeLink
      </h1>
      <p style={{ fontSize: '1.8rem', color: '#a3a3a3', marginBottom: '3rem' }}>Connect. Live. Vibe.</p>

      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '2rem 4rem',
        borderRadius: '9999px',
        border: '3px solid #a855f7',
        fontSize: '3rem',
        fontWeight: 700,
        marginBottom: '4rem'
      }}>
        💎 {balance} credits
      </div>

      <a href="/credits" style={{
        backgroundColor: '#22d3ee',
        color: '#000',
        padding: '1rem 3rem',
        borderRadius: '9999px',
        fontSize: '1.5rem',
        fontWeight: 700,
        textDecoration: 'none'
      }}>
        Go to Credits Store
      </a>
    </div>
  );
};

export default App;
