import React, { useState, useEffect } from 'react';

const creditPackages = [
  { amount: 500, price: 4.99, label: 'Starter' },
  { amount: 1500, price: 12.99, label: 'Popular' },
  { amount: 5000, price: 34.99, label: 'VIP' },
  { amount: 10000, price: 64.99, label: 'Legend' }
];

const CreditsCheckout: React.FC = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/credits/balance');
      const data = await res.json();
      setBalance(data.balance);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchBalance(); }, []);

  const handlePurchase = async (amount: number) => {
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
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Header - Manus style */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold tracking-tighter bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            VibeLink Credits
          </h1>
          <p className="text-xl text-gray-400 mt-3">Power up your experience</p>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-[#1a1a1a] border border-purple-500/30 rounded-3xl px-8 py-4">
            <span className="text-3xl"></span>
            <span className="text-4xl font-semibold">{balance}</span>
            <span className="text-gray-400 text-2xl">credits</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {creditPackages.map((pkg) => (
            <div
              key={pkg.amount}
              className="group bg-[#111111] border border-transparent hover:border-purple-500/50 rounded-3xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
            >
              <div className="text-center">
                <div className="text-5xl font-bold text-purple-300">{pkg.amount}</div>
                <div className="text-sm uppercase tracking-widest text-gray-400 mt-1">credits</div>
                <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent my-6"></div>
                <div className="text-4xl font-semibold">\</div>
                <div className="text-purple-400 text-sm mt-1">{pkg.label}</div>

                <button
                  onClick={() => handlePurchase(pkg.amount)}
                  disabled={loading}
                  className="mt-10 w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl text-xl font-semibold transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Buy Now'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {message && (
          <div className="mt-12 text-center text-xl font-medium text-emerald-400">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditsCheckout;
