"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Home", href: "/dashboard", icon: "home", shortcut: "H" },
  { name: "Squad", href: "/squad", icon: "users", shortcut: "S" },
  { name: "Tactics", href: "/tactics", icon: "layout", shortcut: "T" },
  { name: "Training", href: "/training", icon: "zap", shortcut: "R" },
  { name: "Matches", href: "/matches", icon: "trophy", shortcut: "M" },
  { name: "Career", href: "/career", icon: "trending-up", shortcut: "C" },
  { name: "Finances", href: "/finances", icon: "dollar-sign", shortcut: "F" },
  { name: "Press", href: "/press", icon: "mic", shortcut: "P" },
];

const iconPaths: Record<string, React.ReactNode> = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  layout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  zap: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  trophy: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  "trending-up": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  "dollar-sign": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  mic: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  play: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
};

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[72px] glass-heavy h-screen flex flex-col items-center py-4 fixed left-0 top-0 z-50">
      {/* Logo */}
      <Link href="/dashboard" className="mb-8 group">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-gold-400 flex items-center justify-center transition-transform duration-150 group-hover:scale-110">
          <span className="text-charcoal font-black text-sm">T</span>
        </div>
      </Link>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-150 ${
                isActive
                  ? "bg-white/10 text-gold"
                  : "text-offwhite-500 hover:text-offwhite hover:bg-white/5"
              }`}
            >
              {iconPaths[item.icon]}
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gold rounded-r-full" />
              )}
              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-3 py-1.5 rounded-md bg-charcoal-50 text-offwhite text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-glass z-50">
                {item.name}
                <span className="ml-2 text-offwhite-500">{item.shortcut}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Match Day Quick Access */}
      <Link
        href="/match-simulation"
        className={`group relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-150 mb-4 ${
          pathname === "/match-simulation"
            ? "bg-green-500/20 text-green-400"
            : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
        }`}
      >
        {iconPaths.play}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-green-400 rounded-r-full opacity-0" 
          style={{ opacity: pathname === "/match-simulation" ? 1 : 0 }} 
        />
        {/* Pulse ring for match day */}
        <div className="absolute inset-0 rounded-xl border border-green-400/30 animate-ping" 
          style={{ animationDuration: '3s' }} 
        />
        <div className="absolute left-full ml-3 px-3 py-1.5 rounded-md bg-charcoal-50 text-green-400 text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-glass z-50">
          Match Day
        </div>
      </Link>

      {/* Version */}
      <div className="mt-auto">
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
          <span className="text-[10px] text-offwhite-500 font-mono">v2</span>
        </div>
      </div>
    </aside>
  );
}
