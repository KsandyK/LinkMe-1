xport function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base dark background */}
      <div className="absolute inset-0 bg-[#0D0D1A]" />

      {/* Subtle bokeh / lens flare effect */}
      <div className="absolute inset-0 bg-[radial-gradient(#1a1c2e_0.8px,transparent_1px)] bg-[length:4px_4px] opacity-30" />

      {/* Soft glowing orbs (bokeh) */}
      <div className="absolute top-[15%] left-[10%] w-[400px] h-[400px] bg-[#00C9A7] rounded-full blur-[120px] opacity-10" />
      <div className="absolute top-[40%] right-[15%] w-[300px] h-[300px] bg-[#7C3AED] rounded-full blur-[100px] opacity-10" />
      <div className="absolute bottom-[20%] left-[25%] w-[350px] h-[350px] bg-[#EC4899] rounded-full blur-[110px] opacity-10" />
      <div className="absolute top-[60%] right-[30%] w-[250px] h-[250px] bg-[#F59E0B] rounded-full blur-[90px] opacity-10" />

      {/* Light streaks / lens flare effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />
    </div>
  );
}
