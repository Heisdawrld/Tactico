"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Squad", href: "/squad" },
    { name: "Tactics", href: "/tactics" },
    { name: "Matches", href: "/matches" },
    { name: "Transfers", href: "/transfers", disabled: true },
    { name: "Finances", href: "/finances", disabled: true },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen p-4 fixed left-0 top-0 z-10">
      <div className="flex flex-col h-full">
        <h1 className="text-2xl font-bold mb-8">TACTICO</h1>
        <nav className="flex-1">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.disabled ? "#" : item.href}
                  className={`flex items-center p-2 rounded-lg ${
                    pathname === item.href
                      ? "bg-blue-600"
                      : "hover:bg-gray-800"
                  } ${
                    item.disabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={(e) => item.disabled && e.preventDefault()}
                >
                  {item.name}
                  {item.disabled && (
                    <span className="ml-2 text-xs bg-gray-600 px-2 py-1 rounded">
                      Soon
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-2 border-t border-gray-700">
          <p className="text-sm text-gray-400">v0.1.0</p>
        </div>
      </div>
    </aside>
  );
}