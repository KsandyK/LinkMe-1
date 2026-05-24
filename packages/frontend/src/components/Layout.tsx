import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const Layout = () => {
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
      <Outlet />
    </div>
  );
};

export default Layout;
