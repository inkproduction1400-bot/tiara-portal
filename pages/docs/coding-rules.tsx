// pages/docs/coding-rules.tsx
// Next.js (Pages Router) — Coding Rules page for Tiara Portal
// Place at: pages/docs/coding-rules.tsx

import React from 'react';

const Page: React.FC = () => {
  return (
    <main className="min-h-screen bg-[#0b1020] text-[#e6e8ef]">
      <header className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Tiara Portal — Coding Rules</h1>
        <p className="mt-2 text-sm text-[#9aa3b2]">最終更新：2025-09-20（v1.0） / Next.js + TypeScript + Supabase</p>
      </header>

      <div className="max-w-4xl mx-auto px-4 pb-24 space-y-8">
        <Nav />

        <Section id="lang-fw" title="1. 言語・フレームワーク">
          <ul className="list-disc pl-6 space-y-2">
            <li><b>TypeScript 必須</b>（<code>any</code> 禁止。必要なら厳密な型・ユニオン・型ガードで対処）</li>
            <li><b>Next.js Pages Router</b>：APIは <code>/pages/api/**</code>、UIは <code>/pages/**</code>・<code>/components/**</code></li>
            <li>Node は LTS、ブラウザ互換は現行2世代を目安</li>
          </ul>
        </Section>

        <Section id="naming" title="2. 命名規則">
          <ul className="list-disc pl-6 space-y-2">
            <li>コンポーネント：<b>PascalCase.tsx</b>（例：<code>CastCard.tsx</code>）</li>
            <li>ライブラリ・APIユーティリティ：<b>camelCase.ts</b>（例：<code>tasksLoader.ts</code>）</li>
            <li>変数/関数：<b>camelCase</b>、定数：<b>UPPER_SNAKE_CASE</b></li>
            <li>DBテーブル/カラム：<b>snake_case</b>（例：<code>audit_logs</code>）</li>
          </ul>
        </Section>

        <Section id="structure" title="3. ディレクトリ構造">
          <Code lang="txt" code={`/components/   # UIコンポーネント（再利用可能）\n/lib/          # 共通ロジック・Supabaseクライアント・ユーティリティ\n/pages/        # Next.js ページ\n/pages/api/    # APIエンドポイント\n/public/data/  # JSONテンプレート\n/supabase/     # migrations, policies\n/scripts/      # seedスクリプト`} />
        </Section>

        <Section id="style" title="4. コードスタイル">
          <ul className="list-disc pl-6 space-y-2">
            <li><b>Prettier</b> + <b>ESLint</b> を必須化。import順は <code>eslint-plugin-import</code> で統制</li>
            <li>セミコロンあり、クオートは <b>シングル</b>、<b>trailing comma 常時</b></li>
            <li>相対より <code>@/...</code> での絶対 import を推奨（<code>tsconfig.json</code> の <code>paths</code> 設定）</li>
          </ul>
          <h4 className="mt-4 font-semibold">.prettierrc（推奨）</h4>
          <Code lang="json" code={`{\n  "singleQuote": true,\n  "semi": true,\n  "trailingComma": "all",\n  "printWidth": 100,\n  "tabWidth": 2\n}`} />
          <h4 className="mt-4 font-semibold">.eslintrc.js（推奨）</h4>
          <Code lang="js" code={`module.exports = {\n  root: true,\n  parser: '@typescript-eslint/parser',\n  plugins: ['@typescript-eslint', 'import'],\n  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended'],\n  rules: {\n    'import/order': [\n      'error',\n      {\n        groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],\n        pathGroups: [{ pattern: '@/**', group: 'internal' }],\n        'newlines-between': 'always',\n        alphabetize: { order: 'asc', caseInsensitive: true }\n      }\n    ],\n    '@typescript-eslint/no-explicit-any': 'error'\n  }\n};`} />
          <h4 className="mt-4 font-semibold">package.json（スクリプト例）</h4>
          <Code lang="json" code={`{\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build",\n    "start": "next start",\n    "lint": "eslint .",\n    "format": "prettier --write ."\n  }\n}`} />
        </Section>

        <Section id="react" title="5. React / Next.js">
          <ul className="list-disc pl-6 space-y-2">
            <li>関数コンポーネントのみ。<code>useEffect</code> 依存配列は明示</li>
            <li>状態管理はローカル優先。グローバルは Context or Zustand</li>
            <li>UI からの直接 fetch は禁止。<code>/lib/apiClient.ts</code> 等に集約</li>
            <li><code>getServerSideProps</code> 等は必要最小限。静的化できるものは静的化</li>
          </ul>
        </Section>

        <Section id="db" title="6. Supabase / DB">
          <ul className="list-disc pl-6 space-y-2">
            <li>PK は <b>UUID</b>、<b>created_at</b>/<b>updated_at</b> 必須</li>
            <li><b>RLS 必須</b>。匿名キーは select のみ、write は JWT 役割 or サーバー経由</li>
            <li>サービスロールキーは <b>サーバー側のみ</b> 使用（API/seed）。クライアント禁止</li>
            <li>主要インデックスは意図をコメントに記述</li>
          </ul>
        </Section>

        <Section id="test" title="7. テスト">
          <ul className="list-disc pl-6 space-y-2">
            <li>ユニット：Jest/Vitest（どちらかで統一）。E2E：Playwright</li>
            <li>API の最低限テストを <code>scripts/test-api.sh</code> に集約（curl ベースで可）</li>
          </ul>
        </Section>

        <Section id="git" title="8. Git運用">
          <ul className="list-disc pl-6 space-y-2">
            <li>ブランチ：<code>main</code> ← <code>feature/*</code>（1タスク=1PR）</li>
            <li>コミット：<b>Conventional Commits</b>（例：<code>feat:</code> / <code>fix:</code> / <code>chore:</code>）</li>
            <li>PR テンプレ：<code>.github/pull_request_template.md</code> を使用</li>
          </ul>
        </Section>

        <Section id="security" title="9. セキュリティ">
          <ul className="list-disc pl-6 space-y-2">
            <li>環境変数は <code>.env.local</code> のみ。Git には絶対に含めない</li>
            <li>鍵・トークンはログ出力禁止、Sentry 送信時も除外</li>
            <li>重要操作は <code>audit_logs</code> に記録（<code>lib/audit.ts</code>）</li>
          </ul>
        </Section>

        <Section id="docs" title="10. ドキュメント">
          <ul className="list-disc pl-6 space-y-2">
            <li>API 仕様：<code>/docs/api.md</code> に集約（エンドポイント・型・例）</li>
            <li>マイグレーション SQL には「意図」をコメントで併記</li>
            <li>リリースノート：<code>CHANGELOG.md</code>（Keep a Changelog 準拠推奨）</li>
          </ul>
        </Section>

        <Section id="starter" title="スターター同梱（コピー用）">
          <h4 className="font-semibold">tsconfig.json（抜粋）</h4>
          <Code lang="json" code={`{\n  "compilerOptions": {\n    "target": "ES2020",\n    "module": "ESNext",\n    "jsx": "preserve",\n    "baseUrl": ".",\n    "paths": {"@/*": ["*"]},\n    "strict": true,\n    "esModuleInterop": true,\n    "forceConsistentCasingInFileNames": true,\n    "skipLibCheck": true\n  }\n}`} />
          <h4 className="mt-4 font-semibold">.gitignore（抜粋）</h4>
          <Code lang="txt" code={`node_modules\n.next\n.env.local\naudit.json`} />
        </Section>

        <footer className="pt-8 border-t border-[#24304a] text-xs text-[#9aa3b2]">
          <p>© Tiara Portal Team — Guidelines v1.0（提案）。議論の上で更新してください。</p>
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
      <a className="mr-4 hover:underline" href="#lang-fw">1. 言語/FW</a>
      <a className="mr-4 hover:underline" href="#naming">2. 命名</a>
      <a className="mr-4 hover:underline" href="#structure">3. 構造</a>
      <a className="mr-4 hover:underline" href="#style">4. スタイル</a>
      <a className="mr-4 hover:underline" href="#react">5. React</a>
      <a className="mr-4 hover:underline" href="#db">6. DB</a>
      <a className="mr-4 hover:underline" href="#test">7. テスト</a>
      <a className="mr-4 hover:underline" href="#git">8. Git</a>
      <a className="mr-4 hover:underline" href="#security">9. セキュリティ</a>
      <a className="mr-4 hover:underline" href="#docs">10. ドキュメント</a>
      <a className="hover:underline" href="#starter">スターター</a>
    </div>
  </nav>
);

const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section id={id} className="bg-[#111733] border border-[#24304a] rounded-2xl p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
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
