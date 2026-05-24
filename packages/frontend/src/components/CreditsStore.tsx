import React, { useState, useEffect } from 'react';

const creditPackages = [
  { amount: 500, price: 4.99, label: 'Starter Pack' },
  { amount: 1500, price: 12.99, label: 'Popular Pack' },
  { amount: 5000, price: 34.99, label: 'VIP Pack' },
  { amount: 10000, price: 64.99, label: 'Legend Pack' }
];

const CreditsStore = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/credits/balance');
      const data = await res.json();
      setBalance(data.balance || 0);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchBalance(); }, []);

  const handleBuy = async (amount) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethod: 'ccbill' })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ Purchase successful!');
        fetchBalance();
      }
    } catch (err) {
      setMessage('❌ Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', padding: '3rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '2rem' }}>Credits Store</h1>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', backgroundColor: '#1a1a1a', padding: '1rem 3rem', borderRadius: '9999px', fontSize: '2.5rem' }}>
            💎 <strong>{balance}</strong> credits
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {creditPackages.map((pkg) => (
            <div key={pkg.amount} style={{
              backgroundColor: '#111111',
              borderRadius: '20px',
              padding: '2rem',
              textAlign: 'center',
              border: '2px solid #a855f7'
            }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#c026d3' }}>{pkg.amount}</div>
              <div style={{ color: '#a3a3a3' }}>credits</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, margin: '1rem 0' }}>\</div>
              <div style={{ color: '#ec4899' }}>{pkg.label}</div>

              <button
                onClick={() => handleBuy(pkg.amount)}
                disabled={loading}
                style={{
                  marginTop: '2rem',
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  background: 'linear-gradient(to right, #a855f7, #ec4899)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '9999px',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>

        {message && <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '1.5rem', color: '#22d3ee' }}>{message}</div>}
      </div>
    </div>
  );
};

export default CreditsStore;
