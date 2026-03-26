"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Dumbbell,
  Calendar,
  StickyNote,
  Network,
  GraduationCap,
  Stethoscope,
  PanelLeftClose,
  PanelLeft,
  Search,
  Keyboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, shortcut: "⌘1" },
  { href: "/disciplina/calculo-1", label: "Cálculo I", icon: BookOpen, shortcut: "" },
  { href: "/disciplina/mat-discreta", label: "Mat. Discreta", icon: BookOpen, shortcut: "" },
  { href: "/provas", label: "Provas", icon: GraduationCap, shortcut: "⌘4" },
  { href: "/diagnostico", label: "Diagnóstico", icon: Stethoscope, shortcut: "⌘5" },
  { href: "/mapa", label: "Mapa Conceitual", icon: Network, shortcut: "⌘6" },
  { href: "/exercicios", label: "Exercícios", icon: Dumbbell, shortcut: "⌘7" },
  { href: "/calendario", label: "Calendário", icon: Calendar, shortcut: "⌘8" },
  { href: "/notas", label: "Notas", icon: StickyNote, shortcut: "⌘9" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border-default bg-bg-primary transition-all",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border-default px-4">
        {!collapsed && (
          <span className="text-base font-semibold tracking-tight text-fg-primary">
            cogni.
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-fg-tertiary transition-colors hover:bg-bg-secondary hover:text-fg-secondary"
          title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {/* Section: Disciplinas */}
        {!collapsed && (
          <div className="mb-1 px-2 pt-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-fg-muted">
              Disciplinas
            </span>
          </div>
        )}
        {navItems.slice(1, 3).map((item) => (
          <NavItem
            key={item.href}
            {...item}
            collapsed={collapsed}
            active={pathname === item.href}
          />
        ))}

        {!collapsed && (
          <div className="mb-1 mt-4 px-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-fg-muted">
              Navegação
            </span>
          </div>
        )}
        {collapsed && <div className="my-3 border-t border-border-default" />}
        {[navItems[0], ...navItems.slice(3)].map((item) => (
          <NavItem
            key={item.href}
            {...item}
            collapsed={collapsed}
            active={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
          />
        ))}
      </nav>

      {/* Bottom shortcuts */}
      <div className="border-t border-border-default px-2 py-3">
        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-fg-tertiary transition-colors hover:bg-bg-secondary hover:text-fg-secondary">
          <Search size={16} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left text-sm">Buscar</span>
              <kbd className="rounded border border-border-default bg-bg-tertiary px-1.5 py-0.5 font-mono text-[10px] text-fg-muted">
                ⌘K
              </kbd>
            </>
          )}
        </button>
        {!collapsed && (
          <button className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-fg-tertiary transition-colors hover:bg-bg-secondary hover:text-fg-secondary">
            <Keyboard size={16} />
            <span className="flex-1 text-left text-sm">Atalhos</span>
            <kbd className="rounded border border-border-default bg-bg-tertiary px-1.5 py-0.5 font-mono text-[10px] text-fg-muted">
              ?
            </kbd>
          </button>
        )}
      </div>
    </aside>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  shortcut,
  collapsed,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  shortcut: string;
  collapsed: boolean;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-bg-secondary text-fg-primary"
          : "text-fg-tertiary hover:bg-bg-secondary hover:text-fg-secondary"
      )}
      title={collapsed ? label : undefined}
    >
      <Icon size={16} />
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {shortcut && (
            <kbd className="hidden rounded border border-border-default bg-bg-tertiary px-1 py-0.5 font-mono text-[10px] text-fg-muted group-hover:inline-block">
              {shortcut}
            </kbd>
          )}
        </>
      )}
    </Link>
  );
}
