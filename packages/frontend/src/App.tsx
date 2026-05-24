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
        <h1 style={{ fontSize: '4rem', color: '#a855f7' }}>VibeLink</h1>
        <p style={{ fontSize: '2rem', marginTop: '1rem' }}>Backend is connected</p>
        <p style={{ marginTop: '3rem', color: '#22d3ee' }}>Type "next" and tell me exactly which page you want first.</p>
      </div>
    </div>
  );
}

export default App;
