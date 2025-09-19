import Head from "next/head";

export default function Rules() {
  return (
    <>
      <Head>
        <title>開発ルール（仮）</title>
      </Head>
      <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <h1>⚙️ 開発ルール（仮）</h1>
        <p>
          この内容は <strong>MosP（勤怠管理）</strong> と{" "}
          <strong>Chatwoot（チャット連携）</strong> をベースにした現状の方針です。
          今後PMとの調整で更新予定です。
        </p>

        <h2>1. インフラ / 環境</h2>
        <ul>
          <li>バックエンド：Node.js + NestJS</li>
          <li>フロント：Next.js (App Router, PWA対応)</li>
          <li>DB：PostgreSQL + Prisma Migrate</li>
          <li>ホスティング：Vercel + VPS (API/DB)</li>
        </ul>

        <h2>2. 外部連携</h2>
        <ul>
          <li>MosP：出退勤データをAPI/ETLで同期</li>
          <li>Chatwoot：LINE Messaging APIと連携、Webhook経由でチャットを保存/返信</li>
        </ul>

        <h2>3. コーディング規約</h2>
        <ul>
          <li>命名規則：DBはsnake_case、PKはuuid</li>
          <li>DTOバリデーション：zod</li>
          <li>主要APIは /api/v1/xxx 形式で統一</li>
        </ul>

        <h2>4. データ保護</h2>
        <ul>
          <li>身分証や顔写真はストレージ分離＋署名付きURL</li>
          <li>個人情報は暗号化カラムを使用</li>
        </ul>

        <p style={{ marginTop: "2rem", color: "red" }}>
          ※このルールは仮版です。MosP連携方式（API or バッチ）、Chatwootホスティング（SaaS or 自前）
          などは未確定です。
        </p>
      </main>
    </>
  );
}
