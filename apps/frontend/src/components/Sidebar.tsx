"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "🏠" },
    { name: "Squad", href: "/squad", icon: "👥" },
    { name: "Tactics", href: "/tactics", icon: "⚙️" },
    { name: "Training", href: "/training", icon: "💪" },
    { name: "Matches", href: "/matches", icon: "⚽" },
    { name: "Career", href: "/career", icon: "📈" },
    { name: "Finances", href: "/finances", icon: "💰" },
    { name: "Press", href: "/press", icon: "🎤" },
    { name: "Match Simulation", href: "/match-simulation", icon: "▶️" },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen p-4 fixed left-0 top-0 z-10 overflow-y-auto">
      <div className="flex flex-col h-full">
        <h1 className="text-2xl font-bold mb-8">⚽ TACTICO</h1>
        <nav className="flex-1">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    pathname === item.href
                      ? "bg-blue-600"
                      : "hover:bg-gray-800"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-2 border-t border-gray-700">
          <p className="text-sm text-gray-400">v0.1.0</p>
          <p className="text-xs text-gray-500">A 10 Billion Dollar Project</p>
        </div>
      </div>
    </aside>
  );
}