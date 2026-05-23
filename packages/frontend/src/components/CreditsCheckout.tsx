import React, { useState, useEffect } from 'react';

const creditPackages = [
  { amount: 500, price: 4.99, label: 'Starter' },
  { amount: 1500, price: 12.99, label: 'Popular' },
  { amount: 5000, price: 34.99, label: 'VIP' },
  { amount: 10000, price: 64.99, label: 'Legend' }
];

const CreditsCheckout = () => {
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

  const handlePurchase = async (amount) => {
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
        setMessage(\ \ credits added!\);
        fetchBalance();
      }
    } catch (err) {
      setMessage(' Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: 'white',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1100px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '4.5rem',
            fontWeight: 900,
            background: 'linear-gradient(to right, #a855f7, #ec4899, #22d3ee)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            VibeLink
          </h1>
          <p style={{ fontSize: '1.5rem', color: '#a3a3a3', marginTop: '0.5rem' }}>Credits Store</p>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1rem',
            backgroundColor: '#1a1a1a',
            border: '2px solid #a855f7',
            borderRadius: '9999px',
            padding: '1rem 2rem',
            fontSize: '2.5rem',
            fontWeight: 700
          }}>
             {balance} <span style={{ fontSize: '1.5rem', color: '#a3a3a3' }}>credits</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
          {creditPackages.map((pkg) => (
            <div key={pkg.amount} style={{
              backgroundColor: '#111111',
              borderRadius: '24px',
              padding: '2rem',
              textAlign: 'center',
              border: '1px solid #a855f7',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: '#c026d3' }}>{pkg.amount}</div>
              <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#a3a3a3' }}>credits</div>
              <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #c026d3, transparent)', margin: '2rem 0' }}></div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>\</div>
              <div style={{ color: '#c026d3', marginTop: '0.5rem' }}>{pkg.label}</div>

              <button
                onClick={() => handlePurchase(pkg.amount)}
                disabled={loading}
                style={{
                  marginTop: '3rem',
                  width: '100%',
                  padding: '1.25rem',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  background: 'linear-gradient(to right, #a855f7, #ec4899)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>

        {message && (
          <div style={{
            marginTop: '3rem',
            padding: '1rem 2rem',
            backgroundColor: '#052e16',
            color: '#4ade80',
            borderRadius: '9999px',
            textAlign: 'center',
            fontSize: '1.25rem',
            fontWeight: 600
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditsCheckout;
