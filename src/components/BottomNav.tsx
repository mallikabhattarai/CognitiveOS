"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/home", label: "Home" },
  { href: "/sleep", label: "Sleep" },
  { href: "/insights", label: "Insights" },
  { href: "/settings", label: "Settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  if (!navItems.some((item) => pathname?.startsWith(item.href))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-[428px] border-t border-[var(--border-subtle)] bg-bg-card/95 backdrop-blur">
      <div className="flex w-full justify-between gap-0 py-2 sm:py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1.5 text-[10px] font-medium transition-colors duration-200 sm:gap-1 sm:px-2 sm:text-xs ${
                isActive
                  ? "text-accent"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <span
                className={`h-0.5 w-4 shrink-0 rounded-full transition-colors sm:w-6 ${
                  isActive ? "bg-accent" : "bg-transparent"
                }`}
              />
              <span className="truncate w-full text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
