export default function CreatorDashboard() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-5xl font-semibold tracking-tight mb-10">Creator Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#111214] rounded-3xl p-8 border border-white/10">
          <div className="text-sm text-white/60">Total Earnings</div>
          <div className="text-5xl font-semibold mt-2">$12,840</div>
        </div>
        <div className="bg-[#111214] rounded-3xl p-8 border border-white/10">
          <div className="text-sm text-white/60">Subscribers</div>
          <div className="text-5xl font-semibold mt-2">2,341</div>
        </div>
        <div className="bg-[#111214] rounded-3xl p-8 border border-white/10">
          <div className="text-sm text-white/60">This Month</div>
          <div className="text-5xl font-semibold mt-2">$3,920</div>
        </div>
      </div>

      <div className="bg-[#111214] rounded-3xl p-10 border border-white/10">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="flex gap-4">
          <button className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/5">Go Live</button>
          <button className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/5">Upload Content</button>
          <button className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/5">Manage Tiers</button>
        </div>
      </div>
    </div>
  );
}
