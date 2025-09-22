import Head from "next/head";

export default function Actions() {
  return (
    <>
      <Head>
        <title>次アクション</title>
      </Head>
      <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <h1>🚀 次アクション</h1>
        <p>確定したERD／開発・コーディングルールを踏まえ、年内MVPに向けた優先タスクと連携事項を整理しました。</p>

        <h2>🔹 優先タスク（私）</h2>
        <ol>
          <li>
            <strong>ポータル整備</strong>
            <ul>
              <li>「開発ルール v1.0」「コーディングルール v1.0」「ERD（Mermaid）」ページの最終反映。</li>
              <li>APIドキュメント（OpenAPI/Swagger）雛形を追加し、差分が出たらPRに添付する運用を明記。</li>
            </ul>
          </li>
          <li>
            <strong>Prisma Schema（ERD→schema.prisma）初版</strong>
            <ul>
              <li>テーブル/カラムは <code>snake_case</code>、UUID v4、時刻はUTC。</li>
              <li>RBAC（<code>roles</code>/<code>user_roles</code>）、NG（<code>cast_ngs</code>）、応募/身分証（<code>applications</code>/<code>application_docs</code>）までをスコープ。</li>
              <li>マイグレーション作成（<code>prisma migrate dev --create-only</code>）→ stg に適用テスト。</li>
            </ul>
          </li>
          <li>
            <strong>認証・ストレージの下準備</strong>
            <ul>
              <li>LINE OIDC の環境変数（<code>LINE_CHANNEL_ID</code>/<code>SECRET</code>）とコールバックURLの定義。</li>
              <li>S3（private, SSE）バケット/ IAM ロール作成、署名URL TTL ~10分、キー規約 <code>applications/{'{id}'}/{'{docType}'}/{'{uuid}'}</code> を実装メモ化。</li>
            </ul>
          </li>
          <li>
            <strong>優先APIのスタブ実装</strong>
            <ul>
              <li><code>POST /applications</code>（応募登録）／ <code>POST /applications/:id/docs/presign</code>（S3署名発行）</li>
              <li><code>GET /shifts?from&to&page</code>（当日出勤一覧用）／ <code>PATCH /shifts/:id</code>（確定・取消）</li>
              <li><code>GET /search/casts</code>（NG除外検索）</li>
            </ul>
          </li>
          <li>
            <strong>監査ログとログ基盤の雛形</strong>
            <ul>
              <li>重要操作（応募承認・NG登録・シフト確定）を <code>audit_logs</code> に JSON diff 保存するミドルウェアを用意。</li>
              <li>リクエストログ（<code>request_id</code>）の出力とヘルスチェックエンドポイント。</li>
            </ul>
          </li>
        </ol>

        <h2>🔹 PM / 高橋さん 連携ポイント</h2>
        <ul>
          <li>【LIFF/応募】必須項目・同意文言・ファイル種別（表/裏/セルフィー）の最終FIX。</li>
          <li>【NG運用】店舗起点NGの登録フローを当面はダッシュボードで実施する運用確認。</li>
          <li>【店舗データ】住所分割（都道府県/市区）・電話・要求キーワードのExcel雛形確定。</li>
          <li>【SLA】「LINEイベント→ダッシュボード反映 ≤ 10秒」に同意（アラート条件を含む）。</li>
          <li>【将来】MosP 連携タイミング（API or バッチ）はMVP後に再協議で合意。</li>
        </ul>

        <h2>🔹 技術準備チェック（自分）</h2>
        <ul>
          <li>.env テンプレ更新：DB/S3/LINE/JWT など必須キーを列挙。</li>
          <li>ESLint/Prettier 設定をルートに適用、CI（lint/typecheck/test）を有効化。</li>
          <li>OpenAPI 自動生成（Swagger）を <code>/api/docs</code> に常設、PRごとにスクリーンショットを添付。</li>
        </ul>

        <h2>🔹 今後の流れ</h2>
        <ol>
          <li>ポータル更新 → 高橋さん確認</li>
          <li>回答反映 → ERD差分なしを確認 → <strong>Prisma schema 確定</strong></li>
          <li>優先APIをスタブ → stg で I/F 試験 → 画面統合（当日出勤一覧・キャスト詳細モーダル）</li>
          <li>応募〜承認〜本登録のE2Eを先行で通す（NG除外ロジックを含む）</li>
        </ol>

        <p style={{ marginTop: "2rem", color: "red" }}>
          ※未確定：LIFFの同意文言テンプレ、店舗リストの要求キーワード定義。<br />
          → 連携後、スキーマ/バリデーション/検索条件に即時反映します。
        </p>
      </main>
    </>
  );
}
