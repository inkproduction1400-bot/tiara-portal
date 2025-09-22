// pages/docs/coding-rules.tsx
// Next.js (Pages Router) — Coding Rules page for Tiara Portal
// Place at: pages/docs/coding-rules.tsx

import React from 'react';

const Page: React.FC = () => {
  return (
    <main className="min-h-screen bg-[#0b1020] text-[#e6e8ef]">
      <header className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Tiara Portal — Coding Rules</h1>
        <p className="mt-2 text-sm text-[#9aa3b2]">
          最終更新：2025-09-22（v1.0） / Next.js + TypeScript + NestJS + Prisma + PostgreSQL
        </p>
      </header>

      <div className="max-w-4xl mx-auto px-4 pb-24 space-y-8">
        <Nav />

        <Section id="intro" title="0. 前提">
          <ul className="list-disc pl-6 space-y-2">
            <li>言語：<b>TypeScript 5+</b>（<code>strict</code>、<code>noImplicitAny</code> 有効）</li>
            <li>API：<b>NestJS</b>、ORM：<b>Prisma</b>、DB：<b>PostgreSQL 16</b></li>
            <li>フロント：<b>Next.js</b>（Cast PWA / Admin）</li>
            <li>ストレージ：<b>Amazon S3</b>（private、SSE、有効期限付き署名URL）</li>
            <li>ページング：<b>30件固定</b>（API/フロント統一）</li>
            <li>時刻：DBは<b>UTC</b>、表示は <b>Asia/Tokyo</b></li>
          </ul>
        </Section>

        <Section id="naming" title="1. 命名規則 / ファイル構成">
          <ul className="list-disc pl-6 space-y-2">
            <li>変数/関数：<b>camelCase</b>、クラス/型/Enum：<b>PascalCase</b>、定数：<b>UPPER_SNAKE_CASE</b></li>
            <li>API ルート：<b>kebab-case</b>（例：<code>/api/v1/cast-profiles</code>）</li>
            <li>DB：テーブル/カラムは <b>snake_case</b>（Prisma の <code>@@map</code>/<code>@map</code> を利用）</li>
          </ul>

          <h4 className="mt-4 font-semibold">NestJS ディレクトリ（例）</h4>
          <Code
            lang="txt"
            code={`/api
  src/
    modules/
      auth/
        auth.controller.ts
        auth.service.ts
        auth.module.ts
        dto/
      casts/
      shops/
    common/
      guards/
      interceptors/
      filters/
      pipes/
      utils/
    prisma/
      prisma.module.ts
      prisma.service.ts
    main.ts`}
          />

          <h4 className="mt-4 font-semibold">Next.js ディレクトリ（例）</h4>
          <Code
            lang="txt"
            code={`/web-admin
  app/
    (routes)/
    components/
    features/
    hooks/
    lib/
    styles/`}
          />
        </Section>

        <Section id="ts" title="2. TypeScript の書き方">
          <ul className="list-disc pl-6 space-y-2">
            <li><code>// @ts-ignore</code> は原則禁止（やむを得ない場合は理由コメントを必須）</li>
            <li>外部公開 DTO と内部 Entity/Model は分離（<b>最小公開</b>の原則）</li>
            <li>API では日時は <b>ISO8601文字列</b> でやり取り</li>
            <li>ユニオン/Enumは<b>文字列リテラル型</b>を優先（例：<code>'pending' | 'approved' | 'rejected'</code>）</li>
          </ul>
        </Section>

        <Section id="nest" title="3. NestJS（API）">
          <h4 className="font-semibold mb-2">Controller / Service</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li>Controller は薄く（検証・入出力整形）、Service にドメインロジック集約</li>
            <li>Repository（Prisma）はさらに薄く、データ取得責務に限定</li>
          </ul>
          <Code
            lang="ts"
            code={`// casts.controller.ts
@Post(':id/store-flags')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STAFF','ADMIN')
async upsertFlags(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() dto: UpsertFlagsDto,
) {
  return this.castsService.upsertFlags(id, dto);
}`}
          />

          <h4 className="font-semibold mb-2 mt-6">DTO / Validation</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li><b>class-validator</b> 必須。<code>transform: true</code>、<code>whitelist: true</code></li>
          </ul>
          <Code
            lang="ts"
            code={`export class SearchCastsDto {
  @IsOptional() @IsUUID() handlerId?: string;
  @IsOptional() @IsInt() @Min(0) hourlyMin?: number;
  @IsOptional() @IsInt() @Min(0) hourlyMax?: number;
  @IsOptional() @IsIn(['and','or']) logic: 'and' | 'or' = 'and';
  @IsOptional() @IsUUID() excludeNgForShopId?: string;
  @IsOptional() @IsInt() @Min(1) page: number = 1; // 30件固定
}`}
          />

          <h4 className="font-semibold mb-2 mt-6">認証・認可・APIポリシー</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li>API バージョン：<b>/api/v1</b></li>
            <li>認証：<b>JWT</b>、認可：<b>Guard + RBAC</b>（<code>@Roles()</code>）</li>
            <li>ページング：<b>30件固定</b>、<code>?page=1</code> から開始</li>
            <li>エラー形式：<code>{`{ error_code, message, details? }`}</code></li>
          </ul>

          <h4 className="font-semibold mb-2 mt-6">ロギング / 監査 / パフォーマンス</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li>全リクエストに <b>request_id</b> 付与、JSON ログ</li>
            <li>重要操作（NG登録、シフト確定、応募承認）は <b>audit_logs</b> に JSON diff 保存</li>
            <li>N+1回避。必要な <code>include/select</code> のみ使用</li>
          </ul>
        </Section>

        <Section id="prisma" title="4. Prisma / DB">
          <ul className="list-disc pl-6 space-y-2">
            <li>テーブル/カラムは <b>snake_case</b>（<code>@@map</code>/<code>@map</code>）</li>
            <li>主キーは <b>UUID v4</b>（<code>default(uuid())</code>）</li>
            <li><code>created_at</code>/<code>updated_at</code> はアプリ層で管理</li>
            <li>外部ID（例：LINE <code>sub</code>）はユニーク制約</li>
            <li>参照整合：FK による。履歴は監査ログで追跡</li>
          </ul>
          <h4 className="font-semibold mb-2 mt-4">マイグレーション</h4>
          <ul className="list-disc pl-6 space-y-2">
            <li>PR毎に <code>prisma migrate dev --create-only</code> を発行し差分レビュー</li>
            <li>破壊的変更は段階導入（追加→両対応→削除）</li>
          </ul>
        </Section>

        <Section id="frontend" title="5. フロントエンド（Next.js / React）">
          <ul className="list-disc pl-6 space-y-2">
            <li>Server Component をデフォルト。クライアントは必要最小限</li>
            <li>データ取得は <b>fetcher（SWR/React Query 等）</b> に集約し、UI 直接 fetch を避ける</li>
            <li>当日出勤 100名でも快適表示（<b>仮想スクロール</b> 検討）</li>
            <li>一覧は 30件固定ページング＋サマリ件数</li>
            <li>アクセシビリティ：フォーム label、モーダルのフォーカストラップ、印刷用 CSS</li>
          </ul>
        </Section>

        <Section id="security" title="6. セキュリティ / 個人情報">
          <ul className="list-disc pl-6 space-y-2">
            <li>XSS/SQLi/SSRF 対策。外部URL取得は禁止（必要時はホワイトリスト）</li>
            <li>S3 署名URL：<b>最小権限 IAM</b>、TTL 短め（~10分）、Content-Type 固定</li>
            <li>身分証は <b>S3キーのみ保持</b>、URLは都度署名。<b>90日ライフサイクル</b>（要件で調整）</li>
            <li>ログにPIIを出さない。トークン/IDはマスク</li>
          </ul>
        </Section>

        <Section id="test" title="7. テスト / 品質">
          <ul className="list-disc pl-6 space-y-2">
            <li>Unit：Jest（Service/Util）</li>
            <li>Integration：Supertest（Controller + Prisma with test DB）</li>
            <li>E2E：主要フロー（応募→承認→本登録、当日出勤一覧、NG除外マッチング）</li>
            <li>カバレッジ目標：<b>lines 70% / クリティカル 90%</b></li>
            <li>テストデータは <b>factory</b> で生成、固定ID依存を避ける</li>
          </ul>
        </Section>

        <Section id="docs" title="8. ドキュメント / 変更管理">
          <ul className="list-disc pl-6 space-y-2">
            <li>OpenAPI（Swagger）は常に更新。PRに差分のスクショ/リンクを添付</li>
            <li>決定事項は ADR（軽量）で <code>/docs/adr/</code> に保存</li>
            <li>ERD が唯一の真実源。変更は ERD → PR → Prisma 反映の順</li>
          </ul>
        </Section>

        <Section id="retry" title="9. 例外・リトライ方針 / Webhook">
          <ul className="list-disc pl-6 space-y-2">
            <li>S3・外部APIは指数バックオフ（最大3回）</li>
            <li>DBトランザクション失敗時は明示ロールバック、再試行は idempotency key</li>
            <li>Webhook は署名検証必須。200以外は再試行</li>
          </ul>
        </Section>

        <Section id="pr-check" title="10. PR レビュー チェックリスト">
          <ul className="list-disc pl-6 space-y-2">
            <li>TypeScript エラーなし、<code>any</code> 回避、型定義妥当</li>
            <li>DTO の <code>class-validator</code> が完全</li>
            <li>ページング30件固定・検索条件が API と一致</li>
            <li>監査ログ（追加/更新/削除）が記録される</li>
            <li>S3 は <b>s3_key のみ</b> 保存（直リンク保存なし）</li>
            <li>ログ/レスポンスに PII が含まれない</li>
          </ul>
        </Section>

        <Section id="starter" title="スターター同梱（コピー用）">
          <h4 className="font-semibold">.prettierrc（推奨）</h4>
          <Code
            lang="json"
            code={`{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}`}
          />
          <h4 className="mt-4 font-semibold">.eslintrc.js（推奨）</h4>
          <Code
            lang="js"
            code={`module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended'],
  rules: {
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
        pathGroups: [{ pattern: '@/**', group: 'internal' }],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true }
      }
    ],
    '@typescript-eslint/no-explicit-any': 'error'
  }
};`}
          />
          <h4 className="mt-4 font-semibold">package.json（スクリプト例）</h4>
          <Code
            lang="json"
            code={`{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}`}
          />
          <h4 className="mt-4 font-semibold">tsconfig.json（抜粋）</h4>
          <Code
            lang="json"
            code={`{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": { "@/*": ["*"] },
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}`}
          />
          <h4 className="mt-4 font-semibold">.gitignore（抜粋）</h4>
          <Code lang="txt" code={`node_modules\n.next\n.env.local\naudit.json`} />
        </Section>

        <footer className="pt-8 border-t border-[#24304a] text-xs text-[#9aa3b2]">
          <p>© Tiara Portal Team — Coding Rules v1.0（確定）。必要に応じてADRで更新してください。</p>
        </footer>
      </div>
    </main>
  );
};

export default Page;

/* ------------------------- UI Helpers ------------------------- */
const Nav: React.FC = () => (
  <nav className="sticky top-0 z-10 -mt-6 backdrop-blur bg-[#0b1020]/80 border-y border-[#24304a]">
    <div className="max-w-4xl mx-auto px-4 py-3 text-sm overflow-x-auto whitespace-nowrap">
      <a className="mr-4 hover:underline" href="#intro">0. 前提</a>
      <a className="mr-4 hover:underline" href="#naming">1. 命名/構成</a>
      <a className="mr-4 hover:underline" href="#ts">2. TypeScript</a>
      <a className="mr-4 hover:underline" href="#nest">3. NestJS</a>
      <a className="mr-4 hover:underline" href="#prisma">4. Prisma/DB</a>
      <a className="mr-4 hover:underline" href="#frontend">5. Frontend</a>
      <a className="mr-4 hover:underline" href="#security">6. セキュリティ</a>
      <a className="mr-4 hover:underline" href="#test">7. テスト</a>
      <a className="mr-4 hover:underline" href="#docs">8. ドキュメント</a>
      <a className="mr-4 hover:underline" href="#retry">9. リトライ/Webhook</a>
      <a className="mr-4 hover:underline" href="#pr-check">10. PRチェック</a>
      <a className="hover:underline" href="#starter">スターター</a>
    </div>
  </nav>
);

const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({
  id,
  title,
  children,
}) => (
  <section
    id={id}
    className="bg-[#111733] border border-[#24304a] rounded-2xl p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]"
  >
    <h2 className="text-xl font-semibold mb-3">{title}</h2>
    <div className="text-sm leading-relaxed text-[#d5d9e3]">{children}</div>
  </section>
);

const Code: React.FC<{ lang?: string; code: string }> = ({ lang, code }) => (
  <pre className="relative mt-3 overflow-x-auto rounded-xl border border-[#24304a] bg-[#0a0f22] p-4 text-xs">
    {lang ? <span className="absolute right-3 top-2 text-[10px] text-[#8fa1c1]">{lang}</span> : null}
    <code>{code}</code>
  </pre>
);
