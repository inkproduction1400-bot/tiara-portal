// pages/index.tsx
import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>Tiara System Portal</title>
      </Head>

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-zinc-50">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Tiara System 開発ポータル
            </h1>
            <p className="mt-3 text-zinc-600">
              中洲人材派遣「ティアラネット」システム開発のまとめとドキュメント集。
              日々の開発で「最初に開く場所」を目指します。
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dev/docs"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:opacity-90"
              >
                開発ドキュメントへ
              </Link>
              <Link
                href="/docs/swagger"
                className="rounded-lg border px-4 py-2 text-zinc-800 hover:bg-zinc-100"
              >
                API（Swagger）
              </Link>
              <Link
                href="/docs/api"
                className="rounded-lg border px-4 py-2 text-zinc-800 hover:bg-zinc-100"
              >
                API（Redoc）
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h2 className="text-lg font-semibold text-zinc-900">📌 概要</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-zinc-700">
            <li>対象：中洲「ティアラネット」</li>
            <li>提供形態：PWA（モバイル）＋ Web管理</li>
            <li>年内リリース範囲：キャスト/スタッフ/店舗（AI除く）</li>
            <li>翌年以降：AIマッチング機能</li>
          </ul>
        </div>
      </section>

      {/* Links grid */}
      <section className="pb-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-lg font-semibold text-zinc-900">🔗 クイックリンク</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card title="Docs（目次）" href="/dev/docs" desc="ポータルの目次・各種手順" />
            <Card title="Assignments" href="/dev/docs/assignments" desc="アサイン機能のAPI/検証" />
            <Card title="Local Smoke" href="/dev/docs/runbooks/local-smoke" desc="起動→ヘルス→最小検証" />
            <Card title="API（Swagger）" href="/docs/swagger" desc="Try it でAPIを実行" />
            <Card title="API（Redoc）" href="/docs/api" desc="OpenAPI を読みやすく閲覧" />
            <Card title="ERD 図" href="/erd" desc="最新ERDへのリンク集" />
            <Card title="WBS / ガント" href="/wbs" desc="進行状況・今後の計画" />
            <Card title="開発ルール" href="/rules" desc="レポ方針・命名・Lint等" />
            <Card title="コーディングルール" href="/docs/coding-rules" desc="実装規約の詳細" />
          </div>
        </div>
      </section>
    </>
  );
}

function Card({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <h3 className="font-medium text-zinc-900">{title}</h3>
        <span className="ml-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white transition group-hover:translate-x-0.5">
          →
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-600">{desc}</p>
    </Link>
  );
}
