import Head from "next/head";

export default function Actions() {
  return (
    <>
      <Head>
        <title>進捗サマリ & 次アクション💡2025/09/24更新</title>
      </Head>
      <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", lineHeight: 1.6 }}>
        <h1>🚀 進捗サマリ & 次アクション</h1>
        <p>年内MVPに向け、実装済みと次の一手をコンパクトに整理しました。</p>

        {/* 実装サマリ */}
        <h2>✅ 現在の進捗（実装済み）</h2>
        <ul>
          <li><strong>RBAC：</strong> 軽量Auth（<code>x-user-id</code>）＋ <code>Roles</code> デコレータ／<code>RolesGuard</code> 実装。<br />
              役割：<code>ADMIN</code> / <code>STAFF</code> / <code>VIEWER</code>（seed で作成済）</li>
          <li><strong>Applications：</strong> 一覧・詳細・面接票Upsert・承認（Cast自動作成/更新）・承認後補完ロジックを実装。</li>
          <li><strong>Casts：</strong> 一覧・詳細・本体/属性/希望/背景の更新、Application⇄Cast 同期、<strong>NGの追加/削除</strong> API。</li>
          <li><strong>Shops：</strong> 一覧/詳細/作成/更新（要求キーワードの全入替）を実装。</li>
          <li><strong>Swagger：</strong> DTOに沿った Example を反映（例：<code>POST /applications/:id/docs</code>）。</li>
          <li><strong>スモークテスト：</strong> <code>npm run smoke</code>（E2E最小）/ <code>npm run smoke:rbac</code>（権限確認）を scripts/ に整備。</li>
          <li><strong>Seed：</strong> 役割＋3ユーザー（ADMIN/STAFF/VIEWER）を自動投入。出力IDをそのままテストに利用可能。</li>
        </ul>

        {/* 使い方の要点（PM/関係者向けメモ） */}
        <details style={{ margin: "1rem 0" }}>
          <summary><strong>ℹ️ 動作確認の要点（抜粋）</strong></summary>
          <ul>
            <li>ヘッダ <code>x-user-id</code> に Seed されたユーザーIDを設定。</li>
            <li><code>POST /applications</code> → <code>PATCH /applications/:id/form</code> → <code>PATCH /applications/:id/approve</code>（承認は ADMIN 権限）。</li>
            <li>Cast は <code>GET /casts</code> / <code>GET /casts/:id</code> で確認。更新系は ADMIN/STAFF のみ。</li>
            <li>NG追加/削除：<code>POST /casts/:castId/ngs</code> / <code>DELETE /casts/:castId/ngs/:ngId</code>（ADMIN/STAFF）。</li>
          </ul>
        </details>

        {/* 次の一手 */}
        <h2>🧭 次の一手（提案）</h2>
        <ol>
          <li>
            <strong>シフト/出勤の最小スコープ実装</strong>
            <ul>
              <li>ERDに沿って <code>shifts</code> / <code>attendances</code> の read-only API を先行（当日一覧）。</li>
              <li>優先API：<code>GET /shifts?from&to&page</code>、<code>PATCH /shifts/:id</code>（確定/取消）。</li>
            </ul>
          </li>
          <li>
            <strong>応募ドキュメントのアップロード導線</strong>
            <ul>
              <li><code>POST /applications/:id/docs/presign</code>（S3 署名URL発行）を追加し、現行 <code>/docs</code> 登録と接続。</li>
              <li>キー規約：<code>applications/&lt;appId&gt;/&lt;docType&gt;/&lt;uuid&gt;</code>、TTL≈10分、privateバケット。</li>
            </ul>
          </li>
          <li>
            <strong>監査ログ（audit_logs）の雛形</strong>
            <ul>
              <li>重要操作（応募承認・NG登録・シフト確定）の JSON diff を記録するミドルウェアを導入。</li>
              <li>最初はアプリ内ログ→後日外部集約（CloudWatch/Datadog等）。</li>
            </ul>
          </li>
          <li>
            <strong>テスト/自動化の強化</strong>
            <ul>
              <li><code>npm run smoke</code> に Shops と NG 操作の簡易チェックを追加。</li>
              <li>Application⇄Cast 同期のユニットテストを1〜2本だけ先に（変更影響が大きい箇所）。</li>
            </ul>
          </li>
          <li>
            <strong>ポータル更新</strong>
            <ul>
              <li>「開発ルール v1.0」「コーディングルール v1.0」「ERD（Mermaid）」を最新版に更新。</li>
              <li>Swaggerの Example JSON は DTO 横に配置し、PR で差分レビュー短縮を明記。</li>
            </ul>
          </li>
        </ol>

        {/* PM 連携事項 */}
        <h2>🤝 PM 連携ポイント（要回答）</h2>
        <ul>
          <li>【LIFF/応募】必須項目・同意文言・ファイル種別（表/裏/セルフィー）の確定。</li>
          <li>【NG運用】店舗起点NGは当面ダッシュボード運用でOKか。</li>
          <li>【店舗データ】住所分割（都道府県/市区）・電話・要求キーワードのExcel雛形確定。</li>
          <li>【SLA】「LINEイベント→ダッシュボード反映 ≤ 10秒」の合意とアラート条件。</li>
          <li>【優先順位】次実装を「シフト管理」から着手で問題ないか（他優先があれば入替可）。</li>
        </ul>

        {/* 技術チェック */}
        <h2>🧰 技術準備チェック</h2>
        <ul>
          <li>.env テンプレ：DB/S3/LINE/JWT など必須キーを列挙。</li>
          <li>ESLint/Prettier をルートに適用、CI（lint/typecheck/test）有効化。</li>
          <li>Swagger を <code>/api/docs</code> で常設、PR にスクリーンショット添付。</li>
        </ul>

        {/* 今後の流れ */}
        <h2>📅 今後の流れ</h2>
        <ol>
          <li>ポータル更新 → PM確認</li>
          <li>回答反映 → ERD差分なしを確認 → <strong>Prisma schema 確定</strong></li>
          <li>優先API（シフト/署名発行/監査ログ雛形）を実装 → stg I/F 試験 → 画面統合</li>
          <li>応募〜承認〜本登録のE2Eを通し、NG除外ロジックも合わせて検証</li>
        </ol>

        <p style={{ marginTop: "2rem", color: "#b42318" }}>
          ※未確定：LIFF同意文言テンプレ、店舗リストの要求キーワード定義。<br />
          → 連携後、スキーマ/バリデーション/検索条件に即時反映します。
        </p>

        {/* 参考：コマンド（開発者向け） */}
        <details style={{ marginTop: "1rem" }}>
          <summary><strong>🔧 参考コマンド（開発者向け）</strong></summary>
          <pre style={{ background: "#f6f8fa", padding: "1rem", overflowX: "auto" }}>
{`# seed（IDはRBAC/スモークで使用）
npm run seed

# スモーク（E2E最小／RBAC）
export ADMIN_ID=...; export STAFF_ID=...; export VIEWER_ID=...
npm run smoke
npm run smoke:rbac`}
          </pre>
        </details>
      </main>
    </>
  );
}
