import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

type Item = { href: string; label: string };

const items: Item[] = [
  { href: "/", label: "Home" },
  { href: "/dev/docs", label: "Docs" },
  { href: "/dev/docs/assignments", label: "Assignments" },
  { href: "/dev/docs/runbooks/local-smoke", label: "Local Smoke" },
  { href: "/erd", label: "ERD" },
  { href: "/wbs", label: "WBS" },
];

const liveItems: Item[] = [
  { href: "/dev/live/dashboard", label: "Dashboard (live)" },
];

export default function DocsNav() {
  const pathname = usePathname() ?? "";

  const activeMatch = useMemo(() => {
    return (href: string) => pathname === href || pathname.startsWith(href + "/");
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center gap-3">
          <Link href="/" className="font-semibold tracking-tight">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
              Tiara Portal
            </span>
          </Link>

        <nav className="ml-2 flex-1 overflow-x-auto">
          <ul className="flex items-center gap-1 min-w-max">
            {items.map((it) => {
              const active = activeMatch(it.href);
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    className={[
                      "relative block rounded-md px-3 py-1.5 text-sm transition",
                      active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100",
                    ].join(" ")}
                  >
                    {it.label}
                    {active && (
                      <span className="pointer-events-none absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
                    )}
                  </Link>
                </li>
              );
            })}

            <li aria-hidden className="mx-2 select-none text-[11px] font-bold uppercase tracking-widest text-zinc-400">
              Live
            </li>

            {liveItems.map((it) => {
              const active = activeMatch(it.href);
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    className={[
                      "relative block rounded-md px-3 py-1.5 text-sm transition",
                      active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100",
                    ].join(" ")}
                  >
                    {it.label}
                    {active && (
                      <span className="pointer-events-none absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden sm:flex items-center gap-2">
          <Link href="/docs/swagger" className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">
            OpenAPI（Swagger）
          </Link>
          <Link href="/docs/api" className="rounded-md border px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100">
            Redoc
          </Link>
        </div>
        </div>
      </div>
    </header>
  );
}
