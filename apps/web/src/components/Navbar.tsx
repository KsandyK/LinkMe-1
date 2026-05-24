import { Link, useLocation } from "wouter";

export default function Navbar() {
  const [location] = useLocation();

  const links = [
    { href: "/profiles", label: "Profiles" },
    { href: "/live", label: "Live" },
    { href: "/messages", label: "Messages" },
    { href: "/rewards", label: "Rewards" },
    { href: "/vip", label: "VIP" },
  ];

  return (
    <nav className="bg-[#0a0a0a] border-b border-white/10 px-8 py-5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#14B8A6] rounded-full" />
          <span className="text-2xl font-semibold tracking-tight">LinkMe</span>
        </Link>

        <div className="flex items-center gap-9 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={location === link.href ? "text-[#14B8A6]" : "text-white/80 hover:text-white"}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/become-creator" className="px-5 py-2 text-sm rounded-full border border-white/60 hover:bg-white hover:text-black transition-all">Become a Creator</Link>
          <Link href="/login" className="text-sm text-white/80 hover:text-white">Login</Link>
        </div>
      </div>
    </nav>
  );
}

