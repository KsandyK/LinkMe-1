import React, { useState, useEffect } from 'react';

const creditPackages = [
  { amount: 500,  price: 4.99,  label: 'Starter' },
  { amount: 1500, price: 12.99, label: 'Popular' },
  { amount: 5000, price: 34.99, label: 'VIP' },
  { amount: 10000,price: 64.99, label: 'Legend' }
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
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex items-center justify-center p-8 overflow-hidden">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-16">
          <h1 className="text-7xl font-black tracking-tighter bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            VibeLink
          </h1>
          <p className="text-2xl text-gray-400 mt-2">Credits Store</p>
        </div>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 bg-[#1a1a1a] border border-purple-500/30 rounded-3xl px-10 py-6 text-5xl font-semibold">
             <span>{balance}</span> <span className="text-3xl text-gray-400">credits</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {creditPackages.map((pkg) => (
            <div
              key={pkg.amount}
              className="group bg-[#111] border border-transparent hover:border-purple-400 rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/30"
            >
              <div className="text-center">
                <div className="text-6xl font-bold text-purple-300 mb-1">{pkg.amount}</div>
                <div className="uppercase text-xs tracking-[2px] text-gray-500">credits</div>
                <div className="my-8 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
                <div className="text-5xl font-semibold text-white">\</div>
                <div className="text-purple-400 text-lg mt-2">{pkg.label}</div>

                <button
                  onClick={() => handlePurchase(pkg.amount)}
                  disabled={loading}
                  className="mt-12 w-full py-6 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl transition-all active:scale-95 shadow-lg shadow-purple-500/40"
                >
                  {loading ? 'Processing...' : 'Buy Now'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {message && (
          <div className="mt-16 text-center text-2xl font-medium text-emerald-400 bg-emerald-900/30 py-4 rounded-2xl">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditsCheckout;
