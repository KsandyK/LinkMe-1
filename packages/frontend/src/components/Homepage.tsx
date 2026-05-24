import React from 'react';

const Homepage = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Navigation */}
      <nav style={{ backgroundColor: '#111111', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #a855f7' }}>
        <div style={{ fontSize: '2rem', fontWeight: 900, background: 'linear-gradient(to right, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          VibeLink
        </div>
        <div style={{ display: 'flex', gap: '2rem', fontSize: '1.1rem' }}>
          <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Home</a>
          <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Creators</a>
          <a href="#" style={{ color: '#22d3ee', textDecoration: 'none' }}>Live <span style={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '9999px' }}>LIVE</span></a>
          <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Messages</a>
          <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Credits</a>
          <a href="#" style={{ color: 'white', textDecoration: 'none' }}>VIP</a>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: '#1a1a1a', padding: '6px 16px', borderRadius: '9999px', fontSize: '1rem' }}>💎 250</div>
          <button style={{ background: '#22d3ee', color: '#000', padding: '8px 20px', borderRadius: '9999px', fontWeight: 600 }}>Verify Age</button>
          <div style={{ width: 32, height: 32, background: '#ec4899', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>U</div>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{ position: 'relative', height: '70vh', background: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url("https://picsum.photos/id/1015/2000/1200") center/cover', display: 'flex', alignItems: 'center', padding: '0 4rem' }}>
        <div style={{ maxWidth: '600px' }}>
          <h1 style={{ fontSize: '4.5rem', lineHeight: '1.1', fontWeight: 900 }}>
            Connect. <span style={{ color: '#22d3ee' }}>Live.</span> Vibe.
          </h1>
          <p style={{ fontSize: '1.5rem', marginTop: '1rem', color: '#d1d5db' }}>
            The premium hybrid dating and live interaction platform.<br />
            Discover genuine connections with creators who match your vibe.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button style={{ background: '#22d3ee', color: '#000', padding: '1rem 2rem', borderRadius: '9999px', fontWeight: 700 }}>Browse Profiles</button>
            <button style={{ background: '#ec4899', color: 'white', padding: '1rem 2rem', borderRadius: '9999px', fontWeight: 700 }}>Watch Live</button>
          </div>
          <div style={{ marginTop: '3rem', display: 'flex', gap: '3rem' }}>
            <div><strong style={{ fontSize: '2rem' }}>2,400+</strong><br />Active Creators</div>
            <div><strong style={{ fontSize: '2rem' }}>2</strong><br />Live Right Now</div>
            <div><strong style={{ fontSize: '2rem' }}>180K+</strong><br />Members</div>
          </div>
        </div>
      </div>

      {/* Live Now Section */}
      <div style={{ padding: '3rem 4rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Live Now</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Add more cards here later */}
          <div style={{ background: '#1a1a1a', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ height: '180px', background: '#334155', position: 'relative' }}>
              <span style={{ position: 'absolute', top: 12, left: 12, background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.8rem' }}>LIVE</span>
            </div>
            <div style={{ padding: '1rem' }}>Luna's Evening Vibes</div>
          </div>
          {/* Repeat for other cards if you want */}
        </div>
      </div>

      {/* Credits Store Quick Link */}
      <div style={{ padding: '3rem 4rem', textAlign: 'center' }}>
        <a href="/credits" style={{ color: '#a855f7', textDecoration: 'none', fontSize: '1.5rem' }}>→ Credits Store</a>
      </div>
    </div>
  );
};

export default Homepage;
