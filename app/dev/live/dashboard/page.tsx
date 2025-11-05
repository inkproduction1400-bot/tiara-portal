'use client';

export default function LiveDashboardPage() {
  const SRC = process.env.NEXT_PUBLIC_DASHBOARD_URL
    ?? 'https://tiara-dashboard-app.vercel.app/dashboard';

  return (
    <main className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Tiara Live Dashboard</h1>
        <p className="text-gray-500 text-sm">運用中のダッシュボードを埋め込み表示</p>
      </header>

      <section className="rounded-lg border overflow-hidden shadow-sm">
        <iframe
          src={SRC}
          title="Live Dashboard"
          className="w-full h-[80vh]"
          allow="clipboard-read; clipboard-write; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      </section>

      <div className="mt-3 text-xs text-gray-500">
        env.local に <code>NEXT_PUBLIC_DASHBOARD_URL</code> を設定できます。
      </div>
    </main>
  );
}
