export default function LiveFeeds() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-bold mb-8">Live Feeds</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-[#111214] aspect-video rounded-2xl flex items-center justify-center text-2xl">🔴 Live Stream {i}</div>
        ))}
      </div>
    </div>
  );
}
