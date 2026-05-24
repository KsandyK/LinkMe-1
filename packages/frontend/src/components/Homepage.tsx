import React from 'react';
import { Link } from 'react-router-dom';

const Homepage = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Nav */}
      <nav style={{ backgroundColor: '#111111', padding: '1rem 3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #a855f7' }}>
        <div style={{ fontSize: '2.2rem', fontWeight: 900, background: 'linear-gradient(to right, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          VibeLink
        </div>
        <div style={{ display: 'flex', gap: '2.5rem', fontSize: '1.1rem' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
          <Link to="/creators" style={{ color: 'white', textDecoration: 'none' }}>Creators</Link>
          <Link to="/live" style={{ color: '#22d3ee', textDecoration: 'none' }}>Live <span style={{ background: '#ef4444', color: 'white', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '9999px' }}>LIVE</span></Link>
          <Link to="/messages" style={{ color: 'white', textDecoration: 'none' }}>Messages</Link>
          <Link to="/credits" style={{ color: 'white', textDecoration: 'none' }}>Credits</Link>
          <Link to="/vip" style={{ color: 'white', textDecoration: 'none' }}>VIP</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: '#1a1a1a', padding: '8px 20px', borderRadius: '9999px', fontSize: '1rem' }}>💎 250</div>
          <button style={{ backgroundColor: '#22d3ee', color: '#000', padding: '8px 24px', borderRadius: '9999px', fontWeight: 700 }}>Verify Age</button>
          <div style={{ width: 40, height: 40, backgroundColor: '#ec4899', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>U</div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ height: '70vh', background: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url("https://picsum.photos/id/1015/2000/1200") center/cover', display: 'flex', alignItems: 'center', padding: '0 4rem' }}>
        <div style={{ maxWidth: '700px' }}>
          <h1 style={{ fontSize: '4.5rem', lineHeight: '1.1', fontWeight: 900 }}>
            Connect. <span style={{ color: '#22d3ee' }}>Live.</span> Vibe.
          </h1>
          <p style={{ fontSize: '1.6rem', marginTop: '1rem', color: '#d1d5db' }}>
            The premium hybrid dating and live interaction platform.<br />
            Discover genuine connections with creators who match your vibe.
          </p>
          <div style={{ marginTop: '3rem', display: 'flex', gap: '1.5rem' }}>
            <Link to="/creators" style={{ backgroundColor: '#22d3ee', color: '#000', padding: '1rem 2.5rem', borderRadius: '9999px', fontSize: '1.2rem', fontWeight: 700, textDecoration: 'none' }}>Browse Profiles</Link>
            <Link to="/live" style={{ backgroundColor: '#ec4899', color: 'white', padding: '1rem 2.5rem', borderRadius: '9999px', fontSize: '1.2rem', fontWeight: 700, textDecoration: 'none' }}>Watch Live</Link>
          </div>
        </div>
      </div>

      {/* Live Now */}
      <div style={{ padding: '3rem 4rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Live Now</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div style={{ backgroundColor: '#1a1a1a', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ height: '180px', background: '#334155', position: 'relative' }}>
              <span style={{ position: 'absolute', top: 12, left: 12, background: '#ef4444', color: 'white', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.8rem' }}>LIVE</span>
            </div>
            <div style={{ padding: '1rem' }}>Luna's Evening Vibes</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
