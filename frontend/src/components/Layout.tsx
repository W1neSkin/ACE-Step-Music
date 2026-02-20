import { NavLink } from "react-router-dom";
import { Music, PenLine, Clock, Disc3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { to: "/", icon: Music, label: "Generate" },
  { to: "/lyrics", icon: PenLine, label: "Lyrics AI" },
  { to: "/history", icon: Clock, label: "History" },
];

function SidebarLink({ to, icon: Icon, label }: (typeof NAV_ITEMS)[number]) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-accent/15 text-accent-light shadow-[0_0_12px_rgba(139,92,246,0.15)]"
            : "text-gray-400 hover:text-white hover:bg-surface-200/50"
        )
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-surface-200/50 bg-surface-50/50">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="relative">
            <Disc3 size={32} className="text-accent animate-[spin_8s_linear_infinite]" />
            <div className="absolute inset-0 rounded-full bg-accent/20 blur-md" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">La' Musica</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
              Powered by ACE-Step
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3 mt-2">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>

        {/* Bottom status */}
        <div className="mt-auto px-4 py-4">
          <div className="glass rounded-xl p-3 text-xs text-gray-500">
            <p className="font-medium text-gray-400 mb-1">Model</p>
            <p>ACE-Step v1.5 Turbo</p>
            <p>LM 1.7B + DiT</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
