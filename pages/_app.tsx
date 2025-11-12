// pages/_app.tsx
import type { AppProps } from "next/app";
import "@/styles/globals.css";
import "swagger-ui-react/swagger-ui.css"; // ← Swagger UI のCSSを全体に適用
import DocsNav from "@/components/DocsNav";
import Link from "next/link";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* 共通ヘッダーナビ */}
      <nav className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link href="/">Home</Link>
          <Link href="/dev/docs">Docs</Link>
          <Link href="/dev/docs/assignments">Assignments</Link>
          <Link href="/dev/docs/runbooks/local-smoke">Local Smoke</Link>
          <Link href="/docs/swagger">API (Swagger)</Link>
          <Link href="/docs/api">API (Redoc)</Link>
          <Link href="/erd">ERD</Link>
          <Link href="/wbs">Gantt / WBS</Link>
        </div>
      </nav>

      {/* 既存の DocsNav（不要なら削除可） */}
      <DocsNav />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Component {...pageProps} />
      </main>
    </>
  );
}
