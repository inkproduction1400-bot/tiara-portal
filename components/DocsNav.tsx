// components/DocsNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

type NavItem = { label: string; href: string };

export default function DocsNav() {
  const pathname = usePathname();

  const items: NavItem[] = useMemo(
    () => [
      { label: "Home", href: "/" },
      { label: "Docs", href: "/docs" },
      { label: "WBS", href: "/wbs" },
      // ▼ Live セクション（App Router）
      { label: "Live", href: "/dev/live/dashboard" },
      // ▼ OpenAPI(Swagger UI) への導線
      { label: "OpenAPI (Swagger)", href: "/docs/api" },
      // 必要に応じて Redoc など追加
      // { label: "Redoc", href: "/docs/redoc" },
    ],
    []
  );

  return (
    <header className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-3 flex gap-2 flex-wrap">
        {items.map((it) => {
          const active =
            pathname === it.href ||
            (it.href !== "/" && pathname?.startsWith(it.href));
          return (
            <Link
              key={it.href}
              href={it.href}
              className={[
                "relative block rounded-md px-3 py-1.5 text-sm transition",
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-100",
              ].join(" ")}
            >
              {it.label}
              {active && (
                <span className="pointer-events-none absolute inset-x-1 -bottom-1 h-0.5 rounded-full bg-zinc-900" />
              )}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
