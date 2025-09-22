import Head from "next/head";

export default function Rules() {
  return (
    <>
      <Head>
        <title>Tiara 開発ルール</title>
      </Head>
      <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <h1>⚙️ Tiara 開発ルール v1.0</h1>
        <p>
          目的：年内MVP（キャストPWA + エンド/管理ダッシュボード）を
          安定・安全・素早く届ける。以後の横展開・AIマッチング拡張を見据えた作りにする。
        </p>

        <h2>0.前提</h2>
        <ul>
          <li>インフラ: VPS / Linux</li>
          <li>Backend: NestJS + Prisma + PostgreSQL16</li>
          <li>Storage: Amazon S3（private, SSE, 署名付きURL）</li>
          <li>認証: キャスト=LINE OIDC、エンド/管理=Email+PW+JWT</li>
          <li>RBAC: 複数ロール（roles / user_roles）</li>
          <li>チャット: Chatwoot（テキストのみ）</li>
          <li>勤怠: MosPは将来連携、MVPは自前shifts</li>
        </ul>

        <h2>1. リポジトリ / ブランチ / リリース</h2>
        <ul>
          <li>単一モノレポ推奨</li>
          <li>Trunk-Based開発、Conventional Commits</li>
          <li>PRは小さく、レビュー必須、CI green必須</li>
          <li>タグ/リリース: vX.Y.Z</li>
        </ul>

        <h2>2. コーディング規約（共通）</h2>
        <ul>
          <li>TypeScript 5+</li>
          <li>Lint: ESLint + Prettier</li>
          <li>命名: camelCase, PascalCase, snake_case</li>
          <li>DB: UTC時刻、created_at/updated_at必須</li>
          <li>ファイル/画像はS3、サーバ直置き禁止</li>
        </ul>

        <h2>3. Backend（NestJS）</h2>
        <ul>
          <li>層構成: controller → service → repository(prisma)</li>
          <li>DTOはclass-validator必須</li>
          <li>API: /api/v1, ページング30件固定</li>
          <li>認証: JWT、認可: Guard+RBAC</li>
          <li>監査ログ: 重要操作は差分保存</li>
          <li>S3: 署名付きURL TTL=10分、身分証は90日で削除</li>
        </ul>

        <h2>4. データ設計（DB）</h2>
        <ul>
          <li>ERDを唯一の真実源とする</li>
          <li>ID: UUID v4、外部IDは別列でunique</li>
          <li>検索列にindex付与</li>
        </ul>

        <h2>5. フロントエンド</h2>
        <ul>
          <li>Cast PWA: Next.js/React + TS</li>
          <li>UIはデザイナー決定を厳守</li>
          <li>当日出勤100名でも快適に（仮想リスト検討）</li>
          <li>チャットUIはテキストのみ</li>
        </ul>

        <h2>6. テスト / 品質</h2>
        <ul>
          <li>Unit=Jest, Integration=Supertest, E2E=応募フロー/出勤一覧/NG除外</li>
          <li>カバレッジ目標: lines70%, critical path90%</li>
        </ul>

        <h2>7. デプロイ / CI</h2>
        <ul>
          <li>CI: lint → typecheck → test → build → prisma diff</li>
          <li>CD: main→Staging自動、Prodは手動承認</li>
          <li>監視: /health, /ready</li>
        </ul>

        <h2>8. 監視・運用</h2>
        <ul>
          <li>ログ: JSON構造化、相関ID</li>
          <li>メトリクス: Prometheus</li>
          <li>トレーシング: OpenTelemetry</li>
          <li>SLA: LINEイベント→反映 ≤10秒</li>
        </ul>

        <h2>9. セキュリティ・個人情報</h2>
        <ul>
          <li>S3 IAMは発行専用、DBは専用ユーザ</li>
          <li>身分証は所定期間で削除</li>
          <li>NG/指名操作は監査ログ必須</li>
        </ul>

        <h2>10. API デザイン規約</h2>
        <ul>
          <li>ベース: /api/v1</li>
          <li>認証: Bearer JWT</li>
          <li>ページング30件固定</li>
          <li>日付はISO8601 UTC</li>
          <li>エラー形式: {"{ error_code, message, details? }"}</li>
        </ul>

        <h2>11. Definition of Done</h2>
        <ul>
          <li>ERD/Swagger更新済</li>
          <li>Lint/Typecheck/Test/Build通過</li>
          <li>入力検証+認可Guard+監査ログあり</li>
          <li>監視系（ログ/メトリクス/HC）整備済</li>
        </ul>

        <h2>12. PRレビュー チェックリスト</h2>
        <ul>
          <li>仕様差分がPRに含まれる</li>
          <li>入力検証・認可が実装されている</li>
          <li>ページング/検索が整合している</li>
          <li>S3直リンク保存していない</li>
          <li>ログに個人情報を出していない</li>
        </ul>

        <h2>13. 環境変数（例）</h2>
        <pre>
{`NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://...
JWT_SECRET=...
LINE_CHANNEL_ID=...
LINE_CHANNEL_SECRET=...
S3_BUCKET=tiara-private
S3_REGION=ap-northeast-1
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
CHATWOOT_BASE_URL=...
CHATWOOT_API_TOKEN=...`}
        </pre>

        <h2>14. 変更手続き</h2>
        <ul>
          <li>Issue → ADR → PRの順で反映</li>
          <li>重大変更はアナウンス＋移行手順必須</li>
        </ul>
      </main>
    </>
  );
}
