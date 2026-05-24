import React from 'react';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', color: '#a855f7', marginBottom: '1rem' }}>
          ✅ TEST SUCCESS
        </h1>
        <p style={{ fontSize: '2rem', color: '#22d3ee' }}>
          Changes are now applying
        </p>
        <p style={{ marginTop: '3rem', fontSize: '1.2rem', color: '#a3a3a3' }}>
          If you see this, the frontend is updating correctly.<br />
          Reply "next" and I'll restore the full homepage + credits + creator pages.
        </p>
      </div>
    </div>
  );
}

export default App;
