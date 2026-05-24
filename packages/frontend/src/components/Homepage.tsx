import React from 'react';

const Homepage = () => {
  return (
    <div>
      {/* Hero */}
      <div style={{ height: '70vh', background: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), ur[](https://picsum.photos/id/1015/2000/1200)', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', padding: '0 4rem' }}>
        <div style={{ maxWidth: '700px' }}>
          <h1 style={{ fontSize: '4.5rem', lineHeight: '1.1', fontWeight: 900 }}>
            Connect. <span style={{ color: '#22d3ee' }}>Live.</span> Vibe.
          </h1>
          <p style={{ fontSize: '1.6rem', marginTop: '1rem', color: '#d1d5db' }}>
            The premium hybrid dating and live interaction platform.<br />
            Discover genuine connections with creators who match your vibe.
          </p>
          <div style={{ marginTop: '3rem', display: 'flex', gap: '1.5rem' }}>
            <button style={{ backgroundColor: '#22d3ee', color: '#000', padding: '1rem 2.5rem', borderRadius: '9999px', fontSize: '1.2rem', fontWeight: 700 }}>Browse Profiles</button>
            <button style={{ backgroundColor: '#ec4899', color: 'white', padding: '1rem 2.5rem', borderRadius: '9999px', fontSize: '1.2rem', fontWeight: 700 }}>Watch Live</button>
          </div>
        </div>
      </div>

      {/* Live Now */}
      <div style={{ padding: '3rem 4rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Live Now</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* You can add more cards later */}
          <div style={{ backgroundColor: '#1a1a1a', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ height: '180px', background: '#334155', position: 'relative' }}>
              <span style={{ position: 'absolute', top: 12, left: 12, background: '#ef4444', color: 'white', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.8rem' }}>LIVE</span>
            </div>
            <div style={{ padding: '1rem' }}>Luna's Evening Vibes</div>
          </div>
        </div>
      </div>

      {/* Featured Creators */}
      <div style={{ padding: '3rem 4rem', backgroundColor: '#111111' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Featured Creators</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          {/* Add cards here later */}
        </div>
      </div>
    </div>
  );
};

export default Homepage;
