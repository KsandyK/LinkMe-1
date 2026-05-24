import { Link } from "wouter";

export function Navigation() {
  return (
    <nav className="bg-[#0a0c1f] border-b border-[#1a1c2e] px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#00ff9d] to-[#14B8A6] rounded-full" />
          <span className="font-bold text-xl">
            <span className="text-[#00ff9d]">Link</span>
            <span className="text-white">Me</span>
          </span>
        </Link>

        {/* Main Navigation */}
        <div className="flex items-center gap-8 text-sm">
          <Link href="/live" className="hover:text-white text-[#a0aec0]">Live Feeds</Link>
          <Link href="/profiles" className="hover:text-white text-[#a0aec0]">Profiles</Link>
          <Link href="/messages" className="hover:text-white text-[#a0aec0]">Messages</Link>
          <Link href="/rewards" className="hover:text-white text-[#a0aec0]">Rewards</Link>
          <Link href="/vip-lounge" className="hover:text-white text-[#a0aec0]">VIP Lounge</Link>
          <Link href="/become-creator" className="px-4 py-1.5 rounded-full border border-[#333] hover:bg-[#1a1c20]">Become a Creator</Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-6 text-sm">
          <Link href="/account" className="text-[#a0aec0] hover:text-white">Account</Link>
          <Link href="/creator" className="text-[#a0aec0] hover:text-white">Creator Dashboard</Link>
        </div>
      </div>
    </nav>
  );
}
