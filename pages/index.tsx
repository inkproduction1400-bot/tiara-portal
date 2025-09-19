import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>Tiara System Portal</title>
      </Head>
      <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <h1>Tiara System 開発ポータル</h1>
        <p>中洲人材派遣「ティアラネット」システム開発まとめサイト</p>

        <h2>📌 概要</h2>
        <ul>
          <li>対象：中洲「ティアラネット」</li>
          <li>提供形態：PWA（モバイル）＋ Web管理</li>
          <li>年内リリース範囲：キャスト/スタッフ/店舗（AI除く）</li>
          <li>翌年以降：AIマッチング機能</li>
        </ul>

        <h2>🔗 ページ一覧</h2>
        <ul>
          <li><Link href="/wbs">WBS & ガントチャート</Link></li>
          <li><Link href="/erd">ERD図</Link></li>
          <li><Link href="/rules">開発ルール</Link></li>
          <li><Link href="/actions">次アクション</Link></li>
          <li><a href="/questionnaire">質問票ドラフト</a></li>
          <li><a href="/questionnaire">質問票（PM記入）</a></li>
        </ul>
      </main>
    </>
  );
}
