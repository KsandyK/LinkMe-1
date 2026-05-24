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
            <button style={{ backgroundColor: '#ec4899', color: 'white', padding: '1rem 2.5rem', borderRadius: '9999px', fontSize: '1Stop = "Stop"

Set-Location -Path "C:\Users\17045\Documents\GitHub\LinkMe-1"

Write-Host "🚀 Restoring FULL homepage + navigation (exactly like your screenshot)..." -ForegroundColor Cyan

# Install React Router if missing
pnpm --filter frontend add react-router-dom --ignore-scripts

packages\frontend\src = "packages\frontend\src"

# 1. Layout with top navigation (Manus-style)
@"
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
